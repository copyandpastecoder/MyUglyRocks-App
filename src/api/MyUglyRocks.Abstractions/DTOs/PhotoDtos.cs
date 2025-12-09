namespace MyUglyRocks.Abstractions.DTOs;

public record UploadPhotoRequest(
    Guid StageRunId,
    string PhotoType // "before", "during", "after"
);

public record UploadPhotoResponse(
    bool Success,
    PhotoDto? Photo = null,
    string? Error = null
);

public record DeletePhotoRequest(
    Guid PhotoId
);

public record ReorderPhotosRequest(
    List<Guid> PhotoIds
);

public record UploadAvatarResponse(
    bool Success,
    string? AvatarUrl = null,
    string? Error = null
);
