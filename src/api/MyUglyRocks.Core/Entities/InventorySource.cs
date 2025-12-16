namespace MyUglyRocks.Core.Entities;

/// <summary>
/// Source type for inventory sources (WHERE specimens are acquired from)
/// </summary>
public enum InventorySourceType
{
    Store = 0,      // Physical retail store
    Online = 1,     // Online purchase (eBay, Etsy, etc.)
    Found = 2,      // Collected in the wild (beaches, hiking, etc.)
    Contact = 3,    // From a person (gift, trade, friend, dealer)
    GemShow = 4,    // Gem and mineral shows (Tucson, etc.)
    Other = 5       // Other source
}

/// <summary>
/// Represents WHERE specimens are acquired from (vendors, locations, contacts).
/// This is separate from the actual purchase/acquisition event (Inventory).
/// </summary>
public class InventorySource : BaseEntity
{
    public Guid InventorySourceId { get; set; }
    public Guid UserId { get; set; }
    public InventorySourceType SourceType { get; set; }
    public required string Name { get; set; }
    public string? Location { get; set; }
    public string? Phone { get; set; }
    public string? Url { get; set; }
    public string? ContactName { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual ICollection<Inventory> Inventories { get; set; } = [];
}
