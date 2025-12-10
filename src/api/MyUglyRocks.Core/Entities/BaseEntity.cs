namespace MyUglyRocks.Core.Entities;

/// <summary>
/// Base entity with audit fields (DateCreated, DateUpdated).
/// Each entity must define its own primary key as {TableName}Id.
/// </summary>
public abstract class BaseEntity
{
    public DateTime DateCreated { get; set; }
    public DateTime DateUpdated { get; set; }
}

/// <summary>
/// Interface for entities that support soft delete
/// </summary>
public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTime? DateDeleted { get; set; }
}

/// <summary>
/// Interface for entities that track user audit (who created/updated)
/// </summary>
public interface IUserAuditable
{
    Guid UserCreated { get; set; }
    Guid UserUpdated { get; set; }
}

/// <summary>
/// Interface for entities tracking material amounts with unit conversion
/// </summary>
public interface IWeightable
{
    decimal? DisplayAmount { get; set; }
    string? DisplayUnit { get; set; }
    decimal? AmountGrams { get; set; }
    decimal? AmountMilliliters { get; set; }
}

/// <summary>
/// Base entity with soft delete capability
/// </summary>
public abstract class SoftDeletableEntity : BaseEntity, ISoftDeletable
{
    public bool IsDeleted { get; set; }
    public DateTime? DateDeleted { get; set; }
}

/// <summary>
/// Base entity with user audit fields
/// </summary>
public abstract class UserAuditedEntity : BaseEntity, IUserAuditable
{
    public Guid UserCreated { get; set; }
    public Guid UserUpdated { get; set; }

    // Navigation properties
    public virtual User? CreatedByUser { get; set; }
    public virtual User? UpdatedByUser { get; set; }
}
