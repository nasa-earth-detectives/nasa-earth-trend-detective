namespace NasaTrendDetective.Domain.Enums;

public enum ClimateVariable
{
    Gistemp = 1,
    ModisNdvi = 2,
    GraceMass = 3,
    Oco2 = 4,

    // MERRA-2: reanálisis de la NASA que nombra el reto. Media anual servida por NASA POWER.
    Merra2Temperature = 5,
    Merra2Precipitation = 6,
    Merra2Evaporation = 7,
    Merra2SoilMoisture = 8,

    // GPM IMERG: precipitación estimada por la constelación de satélites GPM, también vía NASA POWER.
    GpmPrecipitation = 9
}
