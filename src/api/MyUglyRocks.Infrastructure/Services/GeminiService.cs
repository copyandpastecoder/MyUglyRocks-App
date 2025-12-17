using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MyUglyRocks.Abstractions.DTOs;
using MyUglyRocks.Abstractions.Interfaces;
using MyUglyRocks.Infrastructure.Configuration;

namespace MyUglyRocks.Infrastructure.Services;

public class GeminiService : IGeminiService
{
    private readonly HttpClient _httpClient;
    private readonly GeminiSettings _settings;
    private readonly ILogger<GeminiService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public GeminiService(
        HttpClient httpClient,
        IOptions<GeminiSettings> settings,
        ILogger<GeminiService> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;
    }

    public bool IsConfigured => _settings.IsConfigured;

    public async Task<SpecimenLookupResponse> LookupSpecimenAsync(SpecimenLookupRequest request, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            return new SpecimenLookupResponse(false, "Gemini AI lookup is not configured", null);
        }

        try
        {
            var prompt = BuildPrompt(request);
            var geminiRequest = new GeminiRequest
            {
                Contents = new[]
                {
                    new GeminiContent
                    {
                        Parts = new[] { new GeminiPart { Text = prompt } }
                    }
                },
                GenerationConfig = new GeminiGenerationConfig
                {
                    Temperature = 0.2f, // Low temperature for factual responses
                    TopP = 0.8f,
                    TopK = 40,
                    MaxOutputTokens = 1024,
                    ResponseMimeType = "application/json"
                }
            };

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_settings.Model}:generateContent?key={_settings.ApiKey}";

            var response = await _httpClient.PostAsJsonAsync(url, geminiRequest, JsonOptions, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Gemini API error: {StatusCode} - {Error}", response.StatusCode, errorContent);

                // Check for rate limit error (429) or quota exceeded in error content
                if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests ||
                    errorContent.Contains("RESOURCE_EXHAUSTED", StringComparison.OrdinalIgnoreCase) ||
                    errorContent.Contains("quota", StringComparison.OrdinalIgnoreCase))
                {
                    return new SpecimenLookupResponse(false, "Rate limit reached. Please try again in 1 minute.", null);
                }

                return new SpecimenLookupResponse(false, "Failed to lookup specimen information", null);
            }

            var geminiResponse = await response.Content.ReadFromJsonAsync<GeminiResponse>(JsonOptions, cancellationToken);

            if (geminiResponse?.Candidates == null || geminiResponse.Candidates.Length == 0)
            {
                return new SpecimenLookupResponse(false, "No response from AI", null);
            }

            var text = geminiResponse.Candidates[0].Content?.Parts?[0]?.Text;
            if (string.IsNullOrEmpty(text))
            {
                return new SpecimenLookupResponse(false, "Empty response from AI", null);
            }

            // Parse the JSON response from Gemini
            var lookupData = ParseGeminiResponse(text, request.CommonName);
            if (lookupData == null)
            {
                return new SpecimenLookupResponse(false, "Failed to parse AI response", null);
            }

            _logger.LogInformation(
                "Specimen lookup successful: {CommonName} - Known: {IsKnown}, Confidence: {Confidence}%",
                request.CommonName, lookupData.IsKnownSpecimen, lookupData.ConfidenceScore);

            return new SpecimenLookupResponse(true, null, lookupData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error looking up specimen: {CommonName}", request.CommonName);
            return new SpecimenLookupResponse(false, "An error occurred while looking up specimen information", null);
        }
    }

    private static string BuildPrompt(SpecimenLookupRequest request)
    {
        var sourceContext = "";
        if (!string.IsNullOrEmpty(request.SourceUrl) || !string.IsNullOrEmpty(request.SourceName) || !string.IsNullOrEmpty(request.SourceDescription))
        {
            sourceContext = "\n\nAdditional context from where the rock was purchased:";
            if (!string.IsNullOrEmpty(request.SourceName))
                sourceContext += $"\n- Seller/Store: {request.SourceName}";
            if (!string.IsNullOrEmpty(request.SourceUrl))
                sourceContext += $"\n- URL: {request.SourceUrl}";
            if (!string.IsNullOrEmpty(request.SourceDescription))
                sourceContext += $"\n- Listing description: {request.SourceDescription}";
        }

        return $@"You are a geology and rock tumbling expert. A user wants to add a rock/mineral to their tumbling collection with the name ""{request.CommonName}"".{sourceContext}

Provide information for their specimen database. Respond with a JSON object:

{{
  ""commonName"": ""Standard common name for this specimen"",
  ""scientificName"": ""Chemical formula (e.g., SiO2, CaCO3, Cu2CO3(OH)2) or scientific classification"",
  ""alias"": ""Other common names/trade names, comma-separated"",
  ""rockFamily"": ""Primary classification (see list below)"",
  ""species"": ""Mineral family if applicable (e.g., Quartz, Feldspar, Beryl)"",
  ""variety"": ""Specific variety name if applicable"",
  ""materialType"": ""One of: Rock, Mineral, Glass, Fossil, Other"",
  ""mohsHardnessMin"": 0.0,
  ""mohsHardnessMax"": 0.0,
  ""tumblingDifficulty"": ""One of: Easy, Intermediate, Advanced, Expert, Fragile"",
  ""recommendedGritSequence"": ""Grit progression for tumbling"",
  ""specialConsiderations"": ""Rock tumbling specific warnings and tips"",
  ""isKnownSpecimen"": true/false,
  ""confidenceScore"": 0-100,
  ""confidenceReason"": ""Brief explanation""
}}

FIELD GUIDELINES:

**rockFamily** - Use one of these categories:
- Silicate-based: ""Agate"", ""Jasper"", ""Quartz"", ""Chert"", ""Silicate""
- Feldspar family: ""Feldspar""
- Other minerals: ""Carbonate"", ""Oxide"", ""Sulfate"", ""Phosphate"", ""Borate"", ""Sulfide""
- Gem families: ""Beryl"", ""Jade"", ""Garnet"", ""Spodumene"", ""Pyroxene""
- Rock types: ""Granite"", ""Basalt"", ""Gabbro"", ""Rhyolite""
- Other: ""Metamorphic"", ""Sedimentary"", ""Igneous"", ""Volcanic Glass"", ""Tektite"", ""Organic"", ""Man-Made""
- Specific groups: ""Sodalite"", ""Lapis Lazuli"", ""Serpentine"", ""Mica"", ""Zeolite""

**species** - The mineral species/family:
- For quartz varieties: ""Quartz""
- For feldspars: ""Feldspar""
- For beryls: ""Beryl""
- For garnets: ""Garnet""
- Leave empty if not applicable

**variety** - Specific variety name:
- Examples: ""Banded"", ""Moss"", ""Dendritic"", ""Botswana"", ""Brazilian"", ""Mexican Crazy Lace"", ""Blue Lace""

**tumblingDifficulty** - Based on hardness AND other factors:
- ""Easy"" - Hardness 6.5-7+, durable, forgiving (agates, jaspers, quartz)
- ""Intermediate"" - Hardness 5.5-6.5 OR harder but with cleavage/special handling (feldspar, nephrite jade)
- ""Advanced"" - Hardness 5-6 with issues OR challenging materials (lapis lazuli, hematite, charoite)
- ""Expert"" - Very soft (2-4 Mohs) OR extremely problematic (malachite, kyanite, amber, lepidolite)
- ""Fragile"" - Soft and easily damaged, barely tumble-able (calcite, aragonite, marble, celestite)

**recommendedGritSequence** - Standard sequences:
- Easy/hard stones: ""60/90 -> 120/220 -> 500 -> Polish""
- Medium stones: ""120/220 -> 500 -> Polish""
- Soft stones: ""220 -> 500 -> Polish"" or ""500 -> Polish""
- Special cases: ""Dry Tumble"", ""Hand Polish Only"", ""Vibratory/Dry Polish""

**specialConsiderations** - ROCK TUMBLING SPECIFIC tips only:
- Undercutting risks (""Softer inclusions may undercut"")
- Cleavage warnings (""Prone to cracking along cleavage planes"")
- Cushioning needs (""Use ceramic media for cushioning"")
- Porosity (""Porous - absorbs grit, rinse thoroughly"")
- Mixed hardness (""Matrix wears faster than crystals"")
- Polish expectations (""Takes high polish"" or ""Matte/satin finish typical"")
- Safety warnings if toxic (""Toxic dust - do not inhale"")
- Do NOT include general geological facts

**isKnownSpecimen** - TRUE only for real, recognized rock/mineral/lapidary names
**confidenceScore** - How certain you are (100=certain, 0=guess)

Respond ONLY with the JSON object, no additional text.";
    }

    private SpecimenLookupData? ParseGeminiResponse(string jsonText, string originalName)
    {
        try
        {
            // Clean up the response - Gemini sometimes wraps in markdown code blocks
            jsonText = jsonText.Trim();
            if (jsonText.StartsWith("```json"))
                jsonText = jsonText[7..];
            if (jsonText.StartsWith("```"))
                jsonText = jsonText[3..];
            if (jsonText.EndsWith("```"))
                jsonText = jsonText[..^3];
            jsonText = jsonText.Trim();

            var parsed = JsonSerializer.Deserialize<GeminiSpecimenResponse>(jsonText, JsonOptions);
            if (parsed == null)
                return null;

            return new SpecimenLookupData(
                CommonName: parsed.CommonName ?? originalName,
                ScientificName: parsed.ScientificName,
                Alias: parsed.Alias,
                RockFamily: parsed.RockFamily,
                Species: parsed.Species,
                Variety: parsed.Variety,
                MaterialType: NormalizeMaterialType(parsed.MaterialType),
                MohsHardnessMin: parsed.MohsHardnessMin > 0 ? parsed.MohsHardnessMin : null,
                MohsHardnessMax: parsed.MohsHardnessMax > 0 ? parsed.MohsHardnessMax : null,
                TumblingDifficulty: NormalizeDifficulty(parsed.TumblingDifficulty),
                RecommendedGritSequence: parsed.RecommendedGritSequence,
                SpecialConsiderations: parsed.SpecialConsiderations,
                IsKnownSpecimen: parsed.IsKnownSpecimen,
                ConfidenceScore: Math.Clamp(parsed.ConfidenceScore, 0, 100),
                ConfidenceReason: parsed.ConfidenceReason
            );
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse Gemini response JSON: {Response}", jsonText);
            return null;
        }
    }

    private static string NormalizeMaterialType(string? materialType)
    {
        return materialType?.ToLowerInvariant() switch
        {
            "rock" => "Rock",
            "mineral" => "Mineral",
            "glass" => "Glass",
            "fossil" => "Fossil",
            "gemstone" => "Mineral", // Map gemstone to mineral for consistency
            _ => "Other"
        };
    }

    private static string? NormalizeDifficulty(string? difficulty)
    {
        return difficulty?.ToLowerInvariant() switch
        {
            "easy" => "Easy",
            "intermediate" or "medium" or "moderate" => "Intermediate",
            "advanced" or "hard" or "difficult" => "Advanced",
            "expert" => "Expert",
            "fragile" => "Fragile",
            _ => null
        };
    }

    #region Gemini API Models

    private class GeminiRequest
    {
        public GeminiContent[] Contents { get; set; } = Array.Empty<GeminiContent>();
        public GeminiGenerationConfig? GenerationConfig { get; set; }
    }

    private class GeminiContent
    {
        public GeminiPart[] Parts { get; set; } = Array.Empty<GeminiPart>();
    }

    private class GeminiPart
    {
        public string Text { get; set; } = string.Empty;
    }

    private class GeminiGenerationConfig
    {
        public float Temperature { get; set; }
        public float TopP { get; set; }
        public int TopK { get; set; }
        public int MaxOutputTokens { get; set; }
        public string? ResponseMimeType { get; set; }
    }

    private class GeminiResponse
    {
        public GeminiCandidate[] Candidates { get; set; } = Array.Empty<GeminiCandidate>();
    }

    private class GeminiCandidate
    {
        public GeminiContent? Content { get; set; }
    }

    private class GeminiSpecimenResponse
    {
        public string? CommonName { get; set; }
        public string? ScientificName { get; set; }
        public string? Alias { get; set; }
        public string? RockFamily { get; set; }
        public string? Species { get; set; }
        public string? Variety { get; set; }
        public string? MaterialType { get; set; }
        public decimal MohsHardnessMin { get; set; }
        public decimal MohsHardnessMax { get; set; }
        public string? TumblingDifficulty { get; set; }
        public string? RecommendedGritSequence { get; set; }
        public string? SpecialConsiderations { get; set; }
        public bool IsKnownSpecimen { get; set; }
        public int ConfidenceScore { get; set; }
        public string? ConfidenceReason { get; set; }
    }

    #endregion
}
