using Microsoft.AspNetCore.Mvc;

namespace NasaTrendDetective.Api.Controllers;

[ApiController]
public class HealthController : ControllerBase
{
    [HttpGet("health")]
    [HttpGet("api/health")]
    public IActionResult GetHealth()
    {
        return Ok(new
        {
            status = "Healthy",
            service = "NASA Earth System Trend Detective API",
            architecture = "Clean Architecture .NET 10",
            timestamp = DateTime.UtcNow
        });
    }
}
