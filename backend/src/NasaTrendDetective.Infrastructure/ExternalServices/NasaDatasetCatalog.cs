using NasaTrendDetective.Infrastructure.ExternalServices.Models;

namespace NasaTrendDetective.Infrastructure.ExternalServices;

/// <summary>
/// Catálogo mínimo de datasets NASA usados por el detector de tendencias.
/// </summary>
public static class NasaDatasetCatalog
{
    public const string GistempV4Key = "gistemp-v4";
    public const string ModisTerraNdviKey = "modis-mod13a2";
    public const string ModisAquaNdviKey = "modis-myd13a2";
    public const string GraceLandMasconKey = "grace-tellus-land-mascon";
    public const string Oco2Xco2Key = "oco2-xco2";

    public static readonly NasaDataset GistempV4 = new(
        GistempV4Key,
        "GISS Surface Temperature Analysis v4 (anomalías globales)",
        "GISTEMP",
        "v4",
        "NASA GISS",
        RequiresAuthentication: false,
        DirectUrl: new Uri("https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv"));

    public static readonly NasaDataset ModisTerraNdvi = new(
        ModisTerraNdviKey,
        "MODIS/Terra Vegetation Indices 16-Day L3 Global 1km",
        "MOD13A2",
        "061",
        "LPCLOUD",
        RequiresAuthentication: true);

    public static readonly NasaDataset ModisAquaNdvi = new(
        ModisAquaNdviKey,
        "MODIS/Aqua Vegetation Indices 16-Day L3 Global 1km",
        "MYD13A2",
        "061",
        "LPCLOUD",
        RequiresAuthentication: true);

    public static readonly NasaDataset GraceLandMascon = new(
        GraceLandMasconKey,
        "JPL GRACE/GRACE-FO Tellus Land Mascon (CRI) RL06.3 v04",
        "TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4",
        null,
        "POCLOUD",
        RequiresAuthentication: true);

    public static readonly NasaDataset Oco2Xco2 = new(
        Oco2Xco2Key,
        "OCO-2 Level 2 bias-corrected XCO2 (Lite FP)",
        "OCO2_L2_Lite_FP",
        "11.1r",
        "GES_DISC",
        RequiresAuthentication: true);

    public static IReadOnlyList<NasaDataset> All { get; } =
        [GistempV4, ModisTerraNdvi, ModisAquaNdvi, GraceLandMascon, Oco2Xco2];

    public static bool TryGet(string key, out NasaDataset dataset)
    {
        var match = All.FirstOrDefault(d => string.Equals(d.Key, key, StringComparison.OrdinalIgnoreCase));
        dataset = match!;
        return match is not null;
    }

    public static NasaDataset Get(string key) =>
        TryGet(key, out var dataset)
            ? dataset
            : throw new KeyNotFoundException($"Dataset NASA desconocido: '{key}'.");
}
