namespace MyUglyRocks.Abstractions.DTOs;

public record JoinWaitlistRequest(string Email);

public record JoinWaitlistResponse(bool Success, string? Message = null);
