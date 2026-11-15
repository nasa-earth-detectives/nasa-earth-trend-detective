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
        var path = context.Request.Path.Value ?? string.Empty;

        // Health checks are exempt to allow monitoring and Docker health probes
        if (path.Equals("/health", StringComparison.OrdinalIgnoreCase) ||
            path.Equals("/api/health", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        var userAgent = context.Request.Headers.UserAgent.ToString();

        // 1. Legitimate User-Agent header required
        if (string.IsNullOrWhiteSpace(userAgent) || userAgent.Length < 4)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsync("Valid User-Agent header is required.");
            return;
        }

        // 2. Block known malicious scanners
        if (BlockedUserAgents.Any(badAgent => userAgent.Contains(badAgent, StringComparison.OrdinalIgnoreCase)))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsync("Forbidden by Bot Shield Policy.");
            return;
        }

        // 3. Honeypot trap in invisible headers
        if (context.Request.Headers.TryGetValue("X-Honeypot-Token", out var honeypotValue) && !string.IsNullOrEmpty(honeypotValue))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsync("Automated bot submission detected.");
            return;
        }

        await _next(context);
    }
}
