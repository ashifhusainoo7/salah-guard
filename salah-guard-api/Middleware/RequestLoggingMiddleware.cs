using System.Diagnostics;

namespace SalahGuardApi.Middleware;

/// <summary>
/// Logs all incoming requests and their response times,
/// while carefully excluding sensitive information from logs.
/// </summary>
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    private static readonly HashSet<string> SensitiveHeaders = new(StringComparer.OrdinalIgnoreCase)
    {
        "Authorization", "Cookie", "Set-Cookie", "X-Api-Key"
    };

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    /// <summary>
    /// Invokes the middleware to log request and response details.
    /// </summary>
    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var requestPath = context.Request.Path;
        var requestMethod = context.Request.Method;

        _logger.LogInformation("Request started: {Method} {Path} {QueryString}",
            requestMethod, requestPath, context.Request.QueryString);

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            _logger.LogInformation(
                "Request completed: {Method} {Path} → {StatusCode} in {ElapsedMs}ms",
                requestMethod, requestPath, context.Response.StatusCode, stopwatch.ElapsedMilliseconds);
        }
    }
}
