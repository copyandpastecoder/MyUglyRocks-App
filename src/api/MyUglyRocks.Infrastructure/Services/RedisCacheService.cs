using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using MyUglyRocks.Abstractions.Helpers;
using MyUglyRocks.Abstractions.Interfaces;
using StackExchange.Redis;

namespace MyUglyRocks.Infrastructure.Services;

public class RedisCacheService : ICacheService
{
    private readonly IDistributedCache _cache;
    private readonly IConnectionMultiplexer? _redis;
    private readonly ILogger<RedisCacheService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;
    private readonly string _instanceName;

    public RedisCacheService(
        IDistributedCache cache,
        ILogger<RedisCacheService> logger,
        IConnectionMultiplexer? redis = null,
        string instanceName = "MyUglyRocks:")
    {
        _cache = cache;
        _redis = redis;
        _logger = logger;
        _instanceName = instanceName;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            var data = await _cache.GetStringAsync(key, cancellationToken);
            if (data == null)
            {
                return null;
            }

            return JsonSerializer.Deserialize<T>(data, _jsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get cache key {Key}", PiiMaskingHelper.SanitizeForLog(key));
            return null;
        }
    }

    public async Task<T?> GetAndRemoveAsync<T>(string key, CancellationToken cancellationToken = default) where T : class
    {
        if (_redis == null)
        {
            // Fallback for non-Redis scenarios: get then remove (not atomic, but best effort)
            var result = await GetAsync<T>(key, cancellationToken);
            if (result != null)
            {
                await RemoveAsync(key, cancellationToken);
            }
            return result;
        }

        try
        {
            var db = _redis.GetDatabase();
            // IDistributedCache stores data as a hash with "data", "absexp", "sldexp" fields
            // Must use prefixed key to match what IDistributedCache stores
            var prefixedKey = $"{_instanceName}{key}";

            // Get the data field from the hash
            var data = await db.HashGetAsync(prefixedKey, "data");

            if (data.IsNullOrEmpty)
            {
                return null;
            }

            // Delete the key after getting the data (atomic get-and-delete)
            await db.KeyDeleteAsync(prefixedKey);

            return JsonSerializer.Deserialize<T>(data.ToString(), _jsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get and remove cache key {Key}", PiiMaskingHelper.SanitizeForLog(key));
            return null;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiration ?? TimeSpan.FromMinutes(30)
            };

            var data = JsonSerializer.Serialize(value, _jsonOptions);
            await _cache.SetStringAsync(key, data, options, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to set cache key {Key}", PiiMaskingHelper.SanitizeForLog(key));
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            await _cache.RemoveAsync(key, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to remove cache key {Key}", PiiMaskingHelper.SanitizeForLog(key));
        }
    }

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        if (_redis == null)
        {
            _logger.LogWarning("Redis connection not available for prefix deletion");
            return;
        }

        try
        {
            var server = _redis.GetServer(_redis.GetEndPoints().First());
            var keys = server.Keys(pattern: $"{prefix}*").ToArray();

            if (keys.Length > 0)
            {
                var db = _redis.GetDatabase();
                await db.KeyDeleteAsync(keys);
                _logger.LogDebug("Removed {Count} cache keys with prefix {Prefix}", keys.Length, PiiMaskingHelper.SanitizeForLog(prefix));
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to remove cache keys with prefix {Prefix}", PiiMaskingHelper.SanitizeForLog(prefix));
        }
    }
}
