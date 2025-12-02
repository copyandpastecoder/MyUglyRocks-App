namespace MyUglyRocks.Abstractions.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(Guid userId, string email, string username, bool isAdmin);
    string GenerateRefreshToken();
    (Guid userId, string email)? ValidateAccessToken(string token);
}
