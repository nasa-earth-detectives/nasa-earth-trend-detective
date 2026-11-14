namespace NasaTrendDetective.Domain.Enums;

public enum ClimateVariable
{
    Gistemp = 1,
    ModisNdvi = 2,
    GraceMass = 3,
    Oco2 = 4,

    // MERRA-2: NASA reanalysis named by the challenge. Annual mean served by NASA POWER.
    Merra2Temperature = 5,
    Merra2Precipitation = 6,
    Merra2Evaporation = 7,
    Merra2SoilMoisture = 8,

    // GPM IMERG: precipitation estimated by the GPM satellite constellation, also via NASA POWER.
    GpmPrecipitation = 9
}
