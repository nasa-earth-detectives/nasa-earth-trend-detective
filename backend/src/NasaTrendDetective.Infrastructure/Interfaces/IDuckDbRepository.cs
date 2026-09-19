using NasaTrendDetective.Domain.Entities;
using NasaTrendDetective.Domain.Enums;

namespace NasaTrendDetective.Infrastructure.Interfaces;

public interface IDuckDbRepository
{
    Task<IEnumerable<TrendObservation>> QueryObservationsAsync(ClimateVariable variable, int startYear, int endYear);
    Task ExecuteParquetIngestAsync(string parquetFilePath, string tableName);
}
