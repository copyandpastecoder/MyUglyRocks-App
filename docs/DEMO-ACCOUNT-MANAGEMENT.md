# Demo Account Management System

> **Status**: Implementation Complete - Deployment In Progress
>
> **Last Updated**: 2026-01-09

## Overview

The Demo Account Management system allows administrators to create on-demand demo accounts with realistic data for demonstration purposes. These accounts can be easily created, managed, and completely removed (hard delete) when no longer needed.

### Key Features

- **On-Demand Creation**: Create demo accounts via API with auto-generated credentials
- **Realistic Data**: Automatically generates 4-6 inventory sources, 15-25 specimens, and 4 months of cycle data
- **Photo Copying**: Copies photos from source accounts with new R2 storage keys (not shared references)
- **Manual Photo Trigger**: Admin panel can manually trigger photo copying if automatic job fails
- **Hard Delete**: Completely removes demo accounts including all data and R2 photos
- **Safety Checks**: Multiple validation layers prevent accidental deletion of real accounts

## Architecture

### Hybrid Approach

The system uses a hybrid synchronous/asynchronous architecture:

1. **User + Data Creation**: Synchronous (immediate response)
   - User account created with `IsDemoAccount=true`
   - Inventory sources and specimens generated
   - Tumblers and cycles created
   - Returns immediately with credentials

2. **Photo Copying**: Asynchronous via Hangfire background job
   - Automatically enqueued after account creation
   - Can be manually triggered from admin panel
   - Downloads photos from source, uploads with new keys
   - Takes 30-60 seconds to complete

**Rationale**: This approach provides better UX by returning credentials immediately while handling I/O-intensive photo copying in the background.

### Source Accounts for Photo Copying

**Development Environment**:
- User ID: `00000000-0000-0000-0000-000000000003`
- Email: demo@myuglyrocks.com
- Username: DemoUser

**Production Environment**:
- User ID: `b40acd0e-9c94-4b3c-a248-43d3bb21b0f8`
- Email: mur-user.u11s7@dralias.com
- Username: MyUglyRocks

**Cycle Photos**: Copied from the calling admin's account (not source accounts)

## Database Changes

### Migration: AddIsDemoAccountFlag

**File**: `src/api/MyUglyRocks.Infrastructure/Migrations/20260108235024_AddIsDemoAccountFlag.cs`

```sql
-- Add IsDemoAccount column
ALTER TABLE users
ADD COLUMN IsDemoAccount BOOLEAN NOT NULL DEFAULT FALSE;

-- Create partial index for efficient querying
CREATE INDEX idx_users_is_demo_account
ON users("IsDemoAccount")
WHERE "IsDemoAccount" = TRUE;
```

### User Entity Update

**File**: `src/api/MyUglyRocks.Core/Entities/User.cs`

Added property:
```csharp
/// <summary>
/// Indicates if this is a demo account created for demonstration purposes.
/// Demo accounts can be hard-deleted including all associated data.
/// </summary>
public bool IsDemoAccount { get; set; }
```

## Data Transfer Objects (DTOs)

**File**: `src/api/MyUglyRocks.Abstractions/DTOs/DemoAccountDtos.cs`

### CreateDemoAccountRequest
```csharp
public record CreateDemoAccountRequest(string Email);
```

### DemoAccountCreatedResponse
```csharp
public record DemoAccountCreatedResponse(
    Guid UserId,
    string Email,
    string Username,
    string Password, // ONE-TIME VIEW - not stored anywhere
    string Message,
    DateTime DateCreated
);
```

### DemoAccountListDto
```csharp
public record DemoAccountListDto(
    Guid UserId,
    string Email,
    string Username,
    DateTime DateCreated,
    DateTime? DateLastLogin,
    int InventoryCount,
    int CycleCount,
    int PhotoCount
);
```

### DemoAccountDeletionResult
```csharp
public record DemoAccountDeletionResult(
    bool Success,
    string Message,
    int PhotosDeleted,
    int RecordsDeleted
);
```

### PhotoCopyJobResult
```csharp
public record PhotoCopyJobResult(
    bool Success,
    string Message,
    int PhotosCopied,
    int CyclePhotosCopied
);
```

## Service Interface

**File**: `src/api/MyUglyRocks.Abstractions/Interfaces/IDemoAccountService.cs`

### Methods

#### CreateDemoAccountAsync
Creates a demo account with generated data and triggers photo copying job.

**Parameters**:
- `request`: Email for the demo account
- `createdByAdminId`: ID of the admin creating the account
- `cancellationToken`: Optional cancellation token

**Returns**: `DemoAccountCreatedResponse` with one-time password

#### GetDemoAccountsAsync
Lists all demo accounts with statistics.

**Returns**: `List<DemoAccountListDto>`

#### DeleteDemoAccountAsync
Hard deletes a demo account and all associated data (R2 files + database records).

**Parameters**:
- `userId`: ID of the demo account to delete
- `cancellationToken`: Optional cancellation token

**Returns**: `DemoAccountDeletionResult` with deletion statistics

**Safety**: Verifies `IsDemoAccount=true` before deletion

#### CopyPhotosForDemoAccountAsync
Copies photos from source account to demo account.

**Parameters**:
- `demoUserId`: ID of the demo account
- `sourceUserId`: ID of the source account to copy photos from
- `adminUserId`: ID of the admin (for cycle photos)
- `cancellationToken`: Optional cancellation token

**Returns**: `PhotoCopyJobResult` with copy statistics

**Usage**: Called as background job or manually from admin panel

#### TriggerPhotoCopyAsync
Manually trigger photo copying for a demo account (Admin panel).

**Parameters**:
- `demoUserId`: ID of the demo account
- `adminUserId`: ID of the admin triggering the copy
- `cancellationToken`: Optional cancellation token

**Returns**: `PhotoCopyJobResult` with copy statistics

**Note**: Uses environment-specific source account automatically

## Service Implementation

**File**: `src/api/MyUglyRocks.Infrastructure/Services/DemoAccountService.cs`

### Key Implementation Details

#### Password Generation

Generates cryptographically secure 16-character passwords:

```csharp
private static string GenerateSecurePassword()
{
    const string upperCase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const string lowerCase = "abcdefghjkmnpqrstuvwxyz";
    const string digits = "23456789";
    const string symbols = "!@#$%&*";
    const string allChars = upperCase + lowerCase + digits + symbols;

    var bytes = RandomNumberGenerator.GetBytes(16);
    var result = new char[16];

    // Ensure at least one of each type
    result[0] = upperCase[bytes[0] % upperCase.Length];
    result[1] = lowerCase[bytes[1] % lowerCase.Length];
    result[2] = digits[bytes[2] % digits.Length];
    result[3] = symbols[bytes[3] % symbols.Length];

    // Fill rest randomly
    for (int i = 4; i < 16; i++)
        result[i] = allChars[bytes[i] % allChars.Length];

    // Shuffle
    return new string(result.OrderBy(_ => Guid.NewGuid()).ToArray());
}
```

**Security Features**:
- Uses `RandomNumberGenerator` (cryptographically secure)
- Guarantees character type diversity
- Excludes ambiguous characters (I, O, l, 0, 1)
- 16 characters long

#### Demo Data Generation

**Inventory Sources**: 4-6 sources with varied types
- Store: "Rock Hound Shop", "The Gem Store", "Crystal Palace", "Earth's Treasures"
- Online: "eBay", "Etsy - RockCollector123", "Amazon - GemStore", "RockShed.com"
- Found: "Lake Superior Beach", "Colorado River", "Local Hiking Trail", "Backyard Dig"
- Contact: "Rock Show Vendor", "Friend's Collection", "Club Member Trade", "Estate Sale"
- GemShow: "Tucson Gem Show", "Denver Mineral Show", "Local Gem & Mineral Club", "Annual Rock Show"

**Inventory Items**: 15-25 specimens distributed across sources
- Random specimens from active specimen list
- Realistic weights (100-2000 grams)
- Random costs ($10-$100)
- Quality ratings (3-5 stars)
- Acquired dates spread over 4 months

**Cycles**: 4 months of cycle data
- 1 tumbler (Lortone 3A rotary)
- 1 barrel
- Multiple cycles with realistic stage progression
- Stage runs with materials and cleaning runs

#### Photo Copying Process

**Inventory Photos**:
1. Query up to 30 photos from source account
2. Query demo account inventories
3. Distribute photos evenly across inventories (1-3 per inventory)
4. For each photo:
   - Download stream from source R2 key
   - Generate new storage key: `photos/inventory/{inventoryId}/{guid}{extension}`
   - Upload to R2 with new key
   - Create new `InventoryPhoto` record

**Cycle Photos**:
1. Query up to 20 photos from admin's cycles
2. Query demo account stage runs
3. Distribute photos across stage runs
4. For each photo:
   - Download stream from admin's R2 key
   - Generate new storage key: `photos/cycle/{stageRunId}/{guid}{extension}`
   - Upload to R2 with new key
   - Create new `Photo` record

**Important**: Photos are COPIED with new storage keys, not shared. This prevents demo account deletions from affecting source photos.

#### Hard Delete Process

**Safety Check**:
```csharp
if (!user.IsDemoAccount)
{
    throw new InvalidOperationException(
        "SAFETY CHECK FAILED: User is not marked as demo account. Cannot delete.");
}
```

**Deletion Order** (prevents foreign key violations):

```sql
-- Phase 1: Inventory data
DELETE FROM inventory_photos
WHERE inventory_id IN (SELECT inventory_id FROM inventories WHERE user_id = @userId);

DELETE FROM inventory_specimens
WHERE inventory_id IN (SELECT inventory_id FROM inventories WHERE user_id = @userId);

DELETE FROM inventories WHERE user_id = @userId;
DELETE FROM inventory_sources WHERE user_id = @userId;

-- Phase 2: Cycle data
DELETE FROM photos
WHERE stage_run_id IN (
    SELECT sr.stage_run_id FROM stage_runs sr
    JOIN cycles c ON sr.cycle_id = c.cycle_id
    WHERE c.user_id = @userId
);

DELETE FROM cleaning_materials WHERE cleaning_run_id IN (...);
DELETE FROM cleaning_runs WHERE stage_run_id IN (...);
DELETE FROM stage_materials WHERE stage_run_id IN (...);
DELETE FROM stage_run_barrels WHERE stage_run_id IN (...);
DELETE FROM stage_runs WHERE cycle_id IN (SELECT cycle_id FROM cycles WHERE user_id = @userId);
DELETE FROM cycle_specimens WHERE cycle_id IN (SELECT cycle_id FROM cycles WHERE user_id = @userId);
DELETE FROM cycles WHERE user_id = @userId;

-- Phase 3: Equipment
DELETE FROM barrels WHERE tumbler_id IN (SELECT tumbler_id FROM tumblers WHERE user_id = @userId);
DELETE FROM tumblers WHERE user_id = @userId;

-- Phase 4: Social data
DELETE FROM posts WHERE user_id = @userId;
DELETE FROM comments WHERE user_id = @userId;

-- Phase 5: User data
DELETE FROM invitation_codes WHERE created_by_user_id = @userId;
DELETE FROM user_settings WHERE user_id = @userId;
DELETE FROM refresh_tokens WHERE user_id = @userId;
DELETE FROM user_sessions WHERE user_id = @userId;
DELETE FROM users WHERE user_id = @userId;
```

**R2 File Deletion**:
- Collects all storage keys before database deletion
- Calls `IStorageService.DeleteManyAsync(keys)` to remove R2 files
- Returns count of photos deleted

## API Endpoints

**File**: `src/api/MyUglyRocks.Api/Controllers/AdminController.cs`

All endpoints are in the `#region Demo Accounts` section and require `[Authorize(Roles = "Admin")]`.

### POST /api/admin/demo-accounts

Create a demo account with sample data.

**Request**:
```json
{
  "email": "demo-user@example.com"
}
```

**Response** (201 Created):
```json
{
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "email": "demo-user@example.com",
  "username": "DemoUser_abc123",
  "password": "Xy7!mK#9pL@2qR$5", // ONE-TIME VIEW
  "message": "Demo account created. Photo copying in progress.",
  "dateCreated": "2026-01-08T23:50:24.123Z"
}
```

**Errors**:
- 400 Bad Request: Email validation failed or email already exists
- 401 Unauthorized: Not authenticated as admin

### GET /api/admin/demo-accounts

List all demo accounts with statistics.

**Response** (200 OK):
```json
[
  {
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "demo-user@example.com",
    "username": "DemoUser_abc123",
    "dateCreated": "2026-01-08T23:50:24.123Z",
    "dateLastLogin": "2026-01-09T10:30:00.000Z",
    "inventoryCount": 18,
    "cycleCount": 5,
    "photoCount": 25
  }
]
```

**Errors**:
- 401 Unauthorized: Not authenticated as admin

### POST /api/admin/demo-accounts/{userId}/copy-photos

Manually trigger photo copying for a demo account.

**Use Cases**:
- Automatic Hangfire job failed
- Need to re-run photo copying
- Initial photo copy returned 0 photos (source had no photos)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Successfully copied 15 inventory photos and 10 cycle photos",
  "photosCopied": 15,
  "cyclePhotosCopied": 10
}
```

**Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "User not found or not a demo account",
  "photosCopied": 0,
  "cyclePhotosCopied": 0
}
```

**Notes**:
- This operation is synchronous and takes 30-60 seconds
- Uses environment-specific source account automatically
- Returns immediate results with photo counts

**Errors**:
- 400 Bad Request: User not found or not a demo account
- 401 Unauthorized: Not authenticated as admin

### DELETE /api/admin/demo-accounts/{userId}

Hard delete a demo account and all associated data.

**WARNING**: This permanently deletes the user, all data, and R2 files. Cannot be undone.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Demo account and all data deleted successfully",
  "photosDeleted": 25,
  "recordsDeleted": 142
}
```

**Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "SAFETY CHECK FAILED: User is not marked as demo account. Cannot delete.",
  "photosDeleted": 0,
  "recordsDeleted": 0
}
```

**Errors**:
- 400 Bad Request: Safety check failed (not a demo account)
- 401 Unauthorized: Not authenticated as admin
- 404 Not Found: User not found

## Security Considerations

### Password Security
- ✅ Cryptographically secure password generation (RandomNumberGenerator)
- ✅ Password shown only once in creation response
- ✅ Password hashed with BCrypt before storage
- ✅ No password logging or persistence

### Deletion Safety
- ✅ Demo flag verification before deletion
- ✅ Admin-only authorization on all endpoints
- ✅ Audit logging for all operations
- ✅ Cannot delete non-demo accounts

### PII Protection
- ✅ Email addresses masked in logs: `u***@e***.com`
- ✅ No PII in log aggregation systems
- ✅ Correlation IDs for debugging without PII

### Data Isolation
- ✅ Photos copied with new storage keys (not shared)
- ✅ Complete data removal on deletion
- ✅ No orphaned records or files

## Usage Examples

### Creating a Demo Account

```bash
# Admin authentication required
curl -X POST https://dev.myuglyrocks.com/api/admin/demo-accounts \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@example.com"}'
```

**Response**:
```json
{
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "email": "demo@example.com",
  "username": "DemoUser_abc123",
  "password": "Xy7!mK#9pL@2qR$5",
  "message": "Demo account created. Photo copying in progress.",
  "dateCreated": "2026-01-08T23:50:24.123Z"
}
```

**Next Steps**:
1. Save the password (shown only once)
2. Provide credentials to demo user
3. Photos will be copied automatically in background (30-60 seconds)
4. Check photo status via GET /api/admin/demo-accounts

### Manually Triggering Photo Copy

```bash
# If automatic photo copy failed or needs re-run
curl -X POST https://dev.myuglyrocks.com/api/admin/demo-accounts/3fa85f64-5717-4562-b3fc-2c963f66afa6/copy-photos \
  -H "Authorization: Bearer {admin-token}"
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully copied 15 inventory photos and 10 cycle photos",
  "photosCopied": 15,
  "cyclePhotosCopied": 10
}
```

### Listing Demo Accounts

```bash
curl -X GET https://dev.myuglyrocks.com/api/admin/demo-accounts \
  -H "Authorization: Bearer {admin-token}"
```

**Response**:
```json
[
  {
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "demo@example.com",
    "username": "DemoUser_abc123",
    "dateCreated": "2026-01-08T23:50:24.123Z",
    "dateLastLogin": "2026-01-09T10:30:00.000Z",
    "inventoryCount": 18,
    "cycleCount": 5,
    "photoCount": 25
  }
]
```

### Deleting a Demo Account

```bash
# DANGER: This permanently deletes everything
curl -X DELETE https://dev.myuglyrocks.com/api/admin/demo-accounts/3fa85f64-5717-4562-b3fc-2c963f66afa6 \
  -H "Authorization: Bearer {admin-token}"
```

**Response**:
```json
{
  "success": true,
  "message": "Demo account and all data deleted successfully",
  "photosDeleted": 25,
  "recordsDeleted": 142
}
```

## Hangfire Dashboard Access

**Development**: Available at `https://dev.myuglyrocks.com/hangfire`
- Requires Admin authentication
- Can monitor photo copy jobs
- Can retry failed jobs manually

**Production**: Not accessible (security)
- Use `POST /api/admin/demo-accounts/{userId}/copy-photos` instead
- Returns immediate results with photo counts
- No need for Hangfire dashboard access

## Troubleshooting

### Photo Copy Returns 0 Photos

**Cause**: Source account has no photos

**Solutions**:
1. Verify source account has photos in database
2. Manually trigger photo copy after adding photos to source
3. Use different source account if needed

### Demo Account Creation Fails

**Common Issues**:

1. **Email already exists**
   - Error: 400 Bad Request
   - Solution: Use different email

2. **No active specimens in database**
   - Error: Warning in logs, inventories not created
   - Solution: Seed specimen data first

3. **Admin not authenticated**
   - Error: 401 Unauthorized
   - Solution: Provide valid admin JWT token

### Deletion Fails with Safety Check

**Error**: "SAFETY CHECK FAILED: User is not marked as demo account"

**Cause**: Attempting to delete non-demo account

**Solution**:
1. Verify `IsDemoAccount=true` in database
2. Only delete accounts created via demo endpoint
3. Never manually set `IsDemoAccount=true` on real accounts

### R2 Photo Upload Failures

**Symptoms**: Photo copy succeeds but photo count is low

**Debug**:
1. Check R2 credentials in Kubernetes secrets
2. Verify R2 bucket access permissions
3. Check API logs for upload errors
4. Retry photo copy manually

## Testing Checklist

- [ ] Create demo account via API
- [ ] Verify password works for login
- [ ] Check inventory sources created (4-6)
- [ ] Check inventory items created (15-25)
- [ ] Check cycles created (spanning 4 months)
- [ ] Wait for photo copy job (check Hangfire or manually trigger)
- [ ] Verify inventory photos copied
- [ ] Verify cycle photos copied
- [ ] List demo accounts endpoint
- [ ] Verify photo counts in list response
- [ ] Attempt to delete non-demo account (should fail)
- [ ] Delete demo account successfully
- [ ] Verify user cannot login anymore
- [ ] Verify database records deleted
- [ ] Verify R2 photos deleted

## Files Modified/Created

### New Files
- `src/api/MyUglyRocks.Abstractions/DTOs/DemoAccountDtos.cs`
- `src/api/MyUglyRocks.Abstractions/Interfaces/IDemoAccountService.cs`
- `src/api/MyUglyRocks.Infrastructure/Services/DemoAccountService.cs`
- `src/api/MyUglyRocks.Infrastructure/Migrations/20260108235024_AddIsDemoAccountFlag.cs`
- `docs/DEMO-ACCOUNT-MANAGEMENT.md` (this file)

### Modified Files
- `src/api/MyUglyRocks.Core/Entities/User.cs` - Added `IsDemoAccount` property and `Inventories` navigation
- `src/api/MyUglyRocks.Api/Controllers/AdminController.cs` - Added 4 new endpoints
- `src/api/MyUglyRocks.Api/Program.cs` - Registered `IDemoAccountService`
- `src/api/MyUglyRocks.Infrastructure/Data/DemoUserSeedService.cs` - Changed from 12 months to 4 months

## Future Enhancements

### Potential Improvements

1. **Scheduled Cleanup**
   - Auto-delete demo accounts after N days
   - Hangfire recurring job to cleanup expired demos

2. **Demo Account Templates**
   - Multiple templates with different data profiles
   - Specialized demos for different use cases

3. **Photo Library**
   - Dedicated demo photo library
   - No dependency on user accounts

4. **Metrics & Analytics**
   - Track demo account usage
   - Monitor photo copy success rates
   - Alert on failures

5. **Admin Dashboard UI**
   - Web UI for demo management
   - Visual status of photo copying
   - One-click operations

6. **Bulk Operations**
   - Create multiple demo accounts
   - Bulk deletion
   - Clone existing demo

## Support

For issues or questions:
- Check API logs: `kubectl logs -f deployment/myuglyrocks-api -n myuglyrocks`
- Check Hangfire dashboard (dev only): `https://dev.myuglyrocks.com/hangfire`
- Review this documentation
- File issue on GitHub repository
