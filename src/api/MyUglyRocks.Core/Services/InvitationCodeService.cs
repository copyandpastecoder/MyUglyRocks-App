using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Helpers;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Core.Entities;

namespace MyUglyRocks.Core.Services;

public class InvitationCodeService : IInvitationCodeService
{
    private readonly DbContext _context;
    private readonly ILogger<InvitationCodeService> _logger;
    private readonly int _maxCodesPerGeneration;

    public InvitationCodeService(
        DbContext context,
        ILogger<InvitationCodeService> logger,
        IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _maxCodesPerGeneration = int.Parse(configuration["InvitationCodes:MaxPerGeneration"] ?? "50");
    }

    /// <summary>
    /// Generates invitation codes using format: "ROCK-XXXX-YYYY" (e.g., "ROCK-ABC1-XYZ2")
    /// This format is memorable, scannable, and unlikely to have ambiguous characters.
    /// </summary>
    private static string GenerateCode()
    {
        // Generate 8 random characters (4 pairs)
        var bytes = RandomNumberGenerator.GetBytes(4);
        var hex = Convert.ToHexString(bytes).ToUpper();
        return $"ROCK-{hex[..4]}-{hex[4..]}";
    }

    public async Task<List<InvitationCodeDto>> GenerateCodesAsync(
        CreateInvitationCodeRequest request,
        Guid adminUserId,
        CancellationToken cancellationToken = default)
    {
        // Log the request for debugging
        _logger.LogInformation(
            "GenerateCodesAsync called. Quantity: {Quantity}, ExpiresAt: {ExpiresAt}, Description: {Description}",
            request.Quantity,
            request.ExpiresAt?.ToString("O") ?? "null",
            request.Description ?? "null");

        // Validate quantity
        if (request.Quantity < 1 || request.Quantity > _maxCodesPerGeneration)
        {
            throw new InvalidOperationException(
                $"Quantity must be between 1 and {_maxCodesPerGeneration}");
        }

        // Validate expiration date (if provided)
        if (request.ExpiresAt.HasValue && request.ExpiresAt <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("Expiration date must be in the future");
        }

        var admin = await _context.Set<User>().FindAsync(new object[] { adminUserId }, cancellationToken);
        if (admin == null)
        {
            throw new InvalidOperationException("Admin user not found");
        }

        var codes = new List<InvitationCodeDto>();
        var existingCodes = new HashSet<string>(
            await _context.Set<InvitationCode>().Select(ic => ic.Code).ToListAsync(cancellationToken));

        for (int i = 0; i < request.Quantity; i++)
        {
            string code;
            do
            {
                code = GenerateCode();
            } while (existingCodes.Contains(code));

            existingCodes.Add(code);

            var invitationCode = new InvitationCode
            {
                Code = code,
                CreatedByUserId = adminUserId,
                DateExpires = request.ExpiresAt,
                Description = request.Description
            };

            _context.Set<InvitationCode>().Add(invitationCode);
            codes.Add(MapToDto(invitationCode));
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Admin {AdminEmail} generated {Count} invitation codes. Expires: {ExpiresAt}",
            PiiMaskingHelper.MaskEmail(admin.Email),
            request.Quantity,
            request.ExpiresAt?.ToString("O") ?? "Never");

        return codes;
    }

    public async Task<PaginatedInvitationCodesResponse> GetCodesAsync(
        int page = 1,
        int pageSize = 20,
        string? status = null,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        // Validate pagination
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Set<InvitationCode>()
            .Include(ic => ic.UsedByUser)
            .AsQueryable();

        // Apply status filter
        if (!string.IsNullOrEmpty(status))
        {
            query = status.ToLower() switch
            {
                "unused" => query.Where(ic => ic.UsedByUserId == null && !ic.IsRevoked &&
                    (ic.DateExpires == null || ic.DateExpires > DateTime.UtcNow)),
                "used" => query.Where(ic => ic.UsedByUserId != null),
                "expired" => query.Where(ic => ic.DateExpires != null && ic.DateExpires <= DateTime.UtcNow),
                "revoked" => query.Where(ic => ic.IsRevoked),
                _ => query
            };
        }

        // Apply search filter
        if (!string.IsNullOrEmpty(search))
        {
            var searchTerm = search.Trim().ToUpper();
            query = query.Where(ic => ic.Code.Contains(searchTerm));
        }

        var total = await query.CountAsync(cancellationToken);
        var codeEntities = await query
            .OrderByDescending(ic => ic.DateCreated)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = codeEntities.Select(MapToDto).ToList();

        return new PaginatedInvitationCodesResponse(dtos, total, page, pageSize);
    }

    public async Task<InvitationCodeDto?> GetCodeByIdAsync(Guid codeId, CancellationToken cancellationToken = default)
    {
        var code = await _context.Set<InvitationCode>()
            .Include(ic => ic.UsedByUser)
            .FirstOrDefaultAsync(ic => ic.InvitationCodeId == codeId, cancellationToken);

        return code == null ? null : MapToDto(code);
    }

    public async Task<InvitationCodeValidationResult> ValidateCodeAsync(
        string code,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return new InvitationCodeValidationResult(false, "Invitation code is required");
        }

        var normalizedCode = code.Trim().ToUpper();
        var invitationCode = await _context.Set<InvitationCode>()
            .FirstOrDefaultAsync(ic => ic.Code == normalizedCode, cancellationToken);

        if (invitationCode == null)
        {
            return new InvitationCodeValidationResult(false, "Invalid invitation code");
        }

        // Check if already used
        if (invitationCode.UsedByUserId != null)
        {
            return new InvitationCodeValidationResult(false, "This invitation code has already been used");
        }

        // Check if revoked
        if (invitationCode.IsRevoked)
        {
            return new InvitationCodeValidationResult(false, "This invitation code has been revoked");
        }

        // Check if expired
        if (invitationCode.DateExpires.HasValue && invitationCode.DateExpires <= DateTime.UtcNow)
        {
            return new InvitationCodeValidationResult(false, "This invitation code has expired");
        }

        return new InvitationCodeValidationResult(true, null, invitationCode.InvitationCodeId);
    }

    public async Task UseCodeAsync(
        string code,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var normalizedCode = code.Trim().ToUpper();
        var invitationCode = await _context.Set<InvitationCode>()
            .FirstOrDefaultAsync(ic => ic.Code == normalizedCode, cancellationToken);

        if (invitationCode == null)
        {
            throw new InvalidOperationException("Invitation code not found");
        }

        if (invitationCode.UsedByUserId != null)
        {
            throw new InvalidOperationException("Invitation code has already been used");
        }

        if (invitationCode.IsRevoked)
        {
            throw new InvalidOperationException("Invitation code is revoked");
        }

        if (invitationCode.DateExpires.HasValue && invitationCode.DateExpires <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("Invitation code has expired");
        }

        // Mark as used
        invitationCode.UsedByUserId = userId;
        invitationCode.DateUsed = DateTime.UtcNow;

        // Update user's invited_by relationship
        var user = await _context.Set<User>().FindAsync(new object[] { userId }, cancellationToken);
        if (user != null)
        {
            user.InvitedByUserId = invitationCode.CreatedByUserId;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Invitation code {Code} used by user {UserId}",
            invitationCode.Code,
            userId);
    }

    public async Task RevokeCodeAsync(
        Guid codeId,
        Guid revokedByUserId,
        string reason,
        CancellationToken cancellationToken = default)
    {
        var invitationCode = await _context.Set<InvitationCode>().FindAsync(new object[] { codeId }, cancellationToken);
        if (invitationCode == null)
        {
            throw new InvalidOperationException("Invitation code not found");
        }

        invitationCode.IsRevoked = true;
        invitationCode.DateRevoked = DateTime.UtcNow;
        invitationCode.RevokedByUserId = revokedByUserId;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Invitation code {Code} revoked by {RevokedByUserId}. Reason: {Reason}",
            invitationCode.Code,
            revokedByUserId,
            PiiMaskingHelper.SanitizeForLog(reason));
    }

    public async Task<InvitationStatsDto> GetStatsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var total = await _context.Set<InvitationCode>().CountAsync(cancellationToken);
        var used = await _context.Set<InvitationCode>().CountAsync(ic => ic.UsedByUserId != null, cancellationToken);
        var expired = await _context.Set<InvitationCode>().CountAsync(
            ic => ic.DateExpires != null && ic.DateExpires <= now, cancellationToken);
        var revoked = await _context.Set<InvitationCode>().CountAsync(ic => ic.IsRevoked, cancellationToken);
        var available = await _context.Set<InvitationCode>().CountAsync(
            ic => ic.UsedByUserId == null && !ic.IsRevoked &&
            (ic.DateExpires == null || ic.DateExpires > now), cancellationToken);

        return new InvitationStatsDto(total, used, expired, revoked, available);
    }

    private static InvitationCodeDto MapToDto(InvitationCode code)
    {
        var status = code.IsRevoked ? "Revoked"
            : code.UsedByUserId != null ? "Used"
            : code.DateExpires.HasValue && code.DateExpires <= DateTime.UtcNow ? "Expired"
            : "Unused";

        return new InvitationCodeDto(
            code.InvitationCodeId,
            code.Code,
            code.DateCreated,
            code.DateUsed,
            code.UsedByUserId,
            code.UsedByUser?.Username,
            code.DateExpires,
            code.IsRevoked,
            code.DateRevoked,
            code.Description,
            status);
    }
}
