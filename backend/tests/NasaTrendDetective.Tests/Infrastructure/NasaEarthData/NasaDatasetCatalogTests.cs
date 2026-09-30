using NasaTrendDetective.Infrastructure.ExternalServices;

namespace NasaTrendDetective.Tests.Infrastructure.NasaEarthData;

public class NasaDatasetCatalogTests
{
    [Theory]
    [InlineData(NasaDatasetCatalog.GistempV4Key, "GISTEMP", false)]
    [InlineData(NasaDatasetCatalog.ModisTerraNdviKey, "MOD13A2", true)]
    [InlineData(NasaDatasetCatalog.ModisAquaNdviKey, "MYD13A2", true)]
    [InlineData(NasaDatasetCatalog.GraceLandMasconKey, "TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4", true)]
    [InlineData(NasaDatasetCatalog.Oco2Xco2Key, "OCO2_L2_Lite_FP", true)]
    public void Get_ReturnsExpectedShortNameAndAuthRequirement(string key, string shortName, bool requiresAuth)
    {
        var dataset = NasaDatasetCatalog.Get(key);

        Assert.Equal(shortName, dataset.ShortName);
        Assert.Equal(requiresAuth, dataset.RequiresAuthentication);
    }

    [Fact]
    public void All_HasUniqueKeysAndOnlyGistempHasDirectUrl()
    {
        Assert.Equal(5, NasaDatasetCatalog.All.Count);
        Assert.Equal(NasaDatasetCatalog.All.Count, NasaDatasetCatalog.All.Select(d => d.Key).Distinct().Count());
        Assert.Equal(NasaDatasetCatalog.GistempV4, Assert.Single(NasaDatasetCatalog.All, d => d.DirectUrl is not null));
    }

    [Fact]
    public void TryGet_UnknownKey_ReturnsFalseAndGetThrows()
    {
        Assert.False(NasaDatasetCatalog.TryGet("desconocido", out _));
        Assert.Throws<KeyNotFoundException>(() => NasaDatasetCatalog.Get("desconocido"));
    }
}
