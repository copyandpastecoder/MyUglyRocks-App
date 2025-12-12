namespace MyUglyRocks.Abstractions.DTOs;

public record VoteDto
{
    public Guid VoteId { get; init; }
    public Guid PostId { get; init; }
    public Guid UserId { get; init; }
    public DateTime DateCreated { get; init; }
}

public record VoteCountDto
{
    public Guid PostId { get; init; }
    public int Count { get; init; }
    public bool UserHasVoted { get; init; }
}
