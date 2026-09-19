using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Domain.Entities;

public class TrendObservation
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public ClimateVariable Variable { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double Value { get; set; }
    public string Unit { get; set; } = string.Empty;
    public double? Anomaly { get; set; }
    public DateTime Timestamp { get; set; }
}
