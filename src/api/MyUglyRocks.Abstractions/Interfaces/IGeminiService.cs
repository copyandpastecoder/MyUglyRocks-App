using MyUglyRocks.Abstractions.DTOs;

namespace MyUglyRocks.Abstractions.Interfaces;

/// <summary>
/// Service for AI-powered specimen lookups using Google Gemini
/// </summary>
public interface IGeminiService
{
    /// <summary>
    /// Look up specimen information using AI
    /// </summary>
    /// <param name="request">The lookup request with common name and optional source info</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>AI-generated specimen data with confidence indicators</returns>
    Task<SpecimenLookupResponse> LookupSpecimenAsync(SpecimenLookupRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Look up inventory source information using AI
    /// </summary>
    /// <param name="request">The lookup request with company name or URL</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>AI-generated source data with confidence indicators</returns>
    Task<InventorySourceLookupResponse> LookupInventorySourceAsync(InventorySourceLookupRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Whether the Gemini service is configured and available
    /// </summary>
    bool IsConfigured { get; }
}
