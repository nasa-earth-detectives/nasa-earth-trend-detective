using System.ComponentModel.DataAnnotations;
using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Application.DTOs;

public class AnalyzeSeriesRequestDto
{
    [Required]
    public ClimateVariable Variable { get; set; } = ClimateVariable.Gistemp;

    [Required]
    [MinLength(3, ErrorMessage = "Se requieren al menos 3 observaciones para el cálculo de Mann-Kendall.")]
    public List<AnnualObservation> Observations { get; set; } = new();

    [Range(-90.0, 90.0)]
    public double? Latitude { get; set; }

    [Range(-180.0, 180.0)]
    public double? Longitude { get; set; }
}
