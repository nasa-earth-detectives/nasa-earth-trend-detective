namespace NasaTrendDetective.Api.Middlewares;

public class BotDetectionMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly string[] BlockedUserAgents =
    {
        "sqlmap", "nikto", "masscan", "wpscan", "zgrab", "nmap"
    };

    public BotDetectionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var userAgent = context.Request.Headers.UserAgent.ToString();

        // 1. Bloqueo de scanners maliciosos conocidos (Regla 8)
        if (BlockedUserAgents.Any(badAgent => userAgent.Contains(badAgent, StringComparison.OrdinalIgnoreCase)))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsync("Forbidden by Bot Shield Policy.");
            return;
        }

        // 2. Trampa Honeypot en cabeceras o parámetros invisibles
        if (context.Request.Headers.TryGetValue("X-Honeypot-Token", out var honeypotValue) && !string.IsNullOrEmpty(honeypotValue))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsync("Automated bot submission detected.");
            return;
        }

        await _next(context);
    }
}
