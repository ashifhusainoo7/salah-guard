using System.Net;
using System.Text.Json;
using SalahGuardApi.DTOs;

namespace SalahGuardApi.Middleware;

/// <summary>
/// Global exception handling middleware that catches all unhandled exceptions
/// and returns a consistent error response without exposing internal details.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    /// <summary>
    /// Invokes the middleware to handle the HTTP request.
    /// </summary>
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception processing {Method} {Path}",
                context.Request.Method, context.Request.Path);

            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, message) = exception switch
        {
            ArgumentException => (HttpStatusCode.BadRequest, "Invalid request parameters."),
            KeyNotFoundException => (HttpStatusCode.NotFound, "The requested resource was not found."),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Authentication required."),
            OperationCanceledException => (HttpStatusCode.BadRequest, "Request was cancelled."),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred. Please try again later.")
        };

        context.Response.StatusCode = (int)statusCode;

        var errors = new List<string>();
        if (_environment.IsDevelopment())
        {
            errors.Add(exception.Message);
            if (exception.InnerException is not null)
            {
                errors.Add(exception.InnerException.Message);
            }
        }

        var response = ApiResponse<object>.Fail(message, errors);
        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var json = JsonSerializer.Serialize(response, jsonOptions);

        await context.Response.WriteAsync(json);
    }
}
