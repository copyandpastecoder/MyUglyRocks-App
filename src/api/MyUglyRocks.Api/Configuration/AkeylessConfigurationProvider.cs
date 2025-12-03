using System.Diagnostics;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;

namespace MyUglyRocks.Api.Configuration;

public class AkeylessConfigurationSource : IConfigurationSource
{
    public string? GatewayUrl { get; set; }
    public string? AccessId { get; set; }
    public string? AccessKey { get; set; }
    public string SecretPath { get; set; } = "/myuglyrocks/dev";

    public IConfigurationProvider Build(IConfigurationBuilder builder) => new AkeylessConfigurationProvider(this);
}

public class AkeylessConfigurationProvider : ConfigurationProvider
{
    private readonly AkeylessConfigurationSource _source;

    // Map Akeyless secret names (under SecretPath) to configuration keys consumed by the app.
    private static readonly Dictionary<string, string> SecretMappings = new(StringComparer.OrdinalIgnoreCase)
    {
        ["db-connection-string"] = "ConnectionStrings:DefaultConnection",
        ["jwt-secret"] = "Jwt:Secret",
        ["r2-access-key-id"] = "R2:AccessKeyId",
        ["r2-secret-access-key"] = "R2:SecretAccessKey",
        ["r2-bucket-name"] = "R2:BucketName",
        ["redis-connection-string"] = "ConnectionStrings:Redis",
        ["r2-account-id"] = "R2:AccountId",
        ["resend-api-key"] = "Email:ApiKey"
    };

    public AkeylessConfigurationProvider(AkeylessConfigurationSource source)
    {
        _source = source;
    }

    public override void Load()
    {
        if (string.IsNullOrWhiteSpace(_source.AccessId) || string.IsNullOrWhiteSpace(_source.AccessKey))
            return;

        var cliPath = GetCliPath();
        if (cliPath == null)
            return;

        var token = Authenticate(cliPath);
        if (string.IsNullOrEmpty(token))
        {
            Console.WriteLine("[Akeyless] Authentication failed");
            return;
        }

        foreach (var mapping in SecretMappings)
        {
            var secretName = BuildSecretName(mapping.Key);
            try
            {
                var value = GetSecretViaCli(cliPath, token, secretName);
                if (!string.IsNullOrWhiteSpace(value))
                    Data[mapping.Value] = value;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Akeyless] Failed to load {secretName}: {ex.Message}");
            }
        }

        if (Data.Count > 0)
            Console.WriteLine($"[Akeyless] Loaded {Data.Count} secrets");
    }

    private static string? GetCliPath()
    {
        // Check common locations for akeyless CLI
        var paths = new[]
        {
            // Linux container paths (check first for Docker)
            "/usr/local/bin/akeyless",
            "/usr/bin/akeyless",
            // Windows paths
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".akeyless", "bin", "akeyless.exe"),
            @"C:\Program Files\akeyless\akeyless.exe",
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".akeyless", "bin", "akeyless"),
        };

        foreach (var path in paths)
        {
            if (File.Exists(path))
                return path;
        }

        // Try PATH
        var pathEnv = Environment.GetEnvironmentVariable("PATH") ?? "";
        var pathDirs = pathEnv.Split(Path.PathSeparator);
        foreach (var dir in pathDirs)
        {
            var fullPath = Path.Combine(dir, OperatingSystem.IsWindows() ? "akeyless.exe" : "akeyless");
            if (File.Exists(fullPath))
                return fullPath;
        }

        return null;
    }

    private string? Authenticate(string cliPath)
    {
        // Build auth arguments - if Gateway URL is set, use it
        var gatewayArg = !string.IsNullOrWhiteSpace(_source.GatewayUrl)
            ? $"--gateway-url \"{_source.GatewayUrl}\""
            : "";

        // Use bash to pipe 'n' responses to skip interactive prompts on first run
        var authCmd = $"{cliPath} auth --access-id \"{_source.AccessId}\" --access-key \"{_source.AccessKey}\" {gatewayArg} --json";

        var psi = new ProcessStartInfo
        {
            FileName = "/bin/bash",
            Arguments = $"-c \"yes n 2>/dev/null | {authCmd} 2>&1\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        // Set environment variable for Gateway URL (CLI picks this up)
        if (!string.IsNullOrWhiteSpace(_source.GatewayUrl))
        {
            psi.EnvironmentVariables["AKEYLESS_GATEWAY_URL"] = _source.GatewayUrl;
        }

        // If on Windows, run directly without bash wrapper
        if (OperatingSystem.IsWindows())
        {
            psi.FileName = cliPath;
            psi.Arguments = $"auth --access-id \"{_source.AccessId}\" --access-key \"{_source.AccessKey}\" {gatewayArg} --json";
        }

        using var process = Process.Start(psi);
        if (process == null) return null;

        var output = process.StandardOutput.ReadToEnd();
        var error = process.StandardError.ReadToEnd();
        process.WaitForExit();

        // For bash wrapper, check output for success even if exit code is non-zero
        var fullOutput = output + error;

        // Parse JSON or text output to extract token
        var tokenMatch = Regex.Match(fullOutput, @"""token""\s*:\s*""([^""]+)""");
        if (tokenMatch.Success)
            return tokenMatch.Groups[1].Value;

        // Try text format: "Token: t-xxxxx"
        tokenMatch = Regex.Match(fullOutput, @"Token:\s*(\S+)");
        if (tokenMatch.Success)
            return tokenMatch.Groups[1].Value;

        return null;
    }

    private string? GetSecretViaCli(string cliPath, string token, string secretName)
    {
        // Use bash to pipe 'n' responses to skip any interactive prompts
        var secretCmd = $"{cliPath} get-secret-value --name \"{secretName}\" --token \"{token}\"";

        var psi = new ProcessStartInfo
        {
            FileName = "/bin/bash",
            Arguments = $"-c \"yes n 2>/dev/null | {secretCmd} 2>&1\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        // Set environment variable for Gateway URL
        if (!string.IsNullOrWhiteSpace(_source.GatewayUrl))
        {
            psi.EnvironmentVariables["AKEYLESS_GATEWAY_URL"] = _source.GatewayUrl;
        }

        // If on Windows, run directly without bash wrapper
        if (OperatingSystem.IsWindows())
        {
            psi.FileName = cliPath;
            psi.Arguments = $"get-secret-value --name \"{secretName}\" --token \"{token}\"";
        }

        using var process = Process.Start(psi);
        if (process == null) return null;

        var output = process.StandardOutput.ReadToEnd();
        var error = process.StandardError.ReadToEnd();
        process.WaitForExit();

        var fullOutput = (output + error).Trim();

        // Check for errors in output
        if (fullOutput.Contains("error", StringComparison.OrdinalIgnoreCase) || fullOutput.Contains("failed", StringComparison.OrdinalIgnoreCase))
            return null;

        // The secret value should be the last non-empty line
        var lines = fullOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        return lines.Length > 0 ? lines[^1].Trim() : null;
    }

    private string BuildSecretName(string secretKey)
    {
        var prefix = _source.SecretPath.Trim().TrimEnd('/');
        var key = secretKey.TrimStart('/');
        return $"{prefix}/{key}";
    }
}

public static class AkeylessConfigurationBuilderExtensions
{
    public static IConfigurationBuilder AddAkeyless(
        this IConfigurationBuilder builder,
        string? gatewayUrl,
        string? accessId,
        string? accessKey,
        string? secretPath)
    {
        if (string.IsNullOrWhiteSpace(accessId) || string.IsNullOrWhiteSpace(accessKey))
            return builder;

        var normalizedPath = string.IsNullOrWhiteSpace(secretPath)
            ? "/myuglyrocks/dev"
            : NormalizePath(secretPath);

        return builder.Add(new AkeylessConfigurationSource
        {
            GatewayUrl = gatewayUrl,
            AccessId = accessId,
            AccessKey = accessKey,
            SecretPath = normalizedPath
        });
    }

    private static string NormalizePath(string path)
    {
        var trimmed = path.Trim();
        if (!trimmed.StartsWith('/'))
        {
            trimmed = "/" + trimmed;
        }
        return trimmed.TrimEnd('/');
    }
}
