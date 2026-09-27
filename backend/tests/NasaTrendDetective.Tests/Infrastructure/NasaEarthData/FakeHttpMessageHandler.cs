using System.Net;
using System.Net.Http.Headers;

namespace NasaTrendDetective.Tests.Infrastructure.NasaEarthData;

/// <summary>
/// HttpMessageHandler simulado: responde con una cola de respuestas y registra cada request.
/// Nunca sale a internet.
/// </summary>
internal sealed class FakeHttpMessageHandler : HttpMessageHandler
{
    private readonly Queue<Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>>> _responses = new();
    private readonly object _gate = new();

    public List<RecordedRequest> Requests { get; } = [];

    public int CallCount
    {
        get
        {
            lock (_gate)
            {
                return Requests.Count;
            }
        }
    }

    public FakeHttpMessageHandler Enqueue(HttpStatusCode status, string body = "", string mediaType = "text/plain")
    {
        _responses.Enqueue((_, _) => Task.FromResult(new HttpResponseMessage(status)
        {
            Content = new StringContent(body, System.Text.Encoding.UTF8, mediaType)
        }));
        return this;
    }

    public FakeHttpMessageHandler EnqueueHang()
    {
        _responses.Enqueue(async (_, cancellationToken) =>
        {
            await Task.Delay(TimeSpan.FromSeconds(30), cancellationToken);
            return new HttpResponseMessage(HttpStatusCode.OK);
        });
        return this;
    }

    public FakeHttpMessageHandler Enqueue(Func<HttpResponseMessage> factory)
    {
        _responses.Enqueue((_, _) => Task.FromResult(factory()));
        return this;
    }

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> next;
        lock (_gate)
        {
            Requests.Add(new RecordedRequest(request.RequestUri!, request.Headers.Authorization));
            if (!_responses.TryDequeue(out next!))
            {
                throw new InvalidOperationException($"Request inesperado a {request.RequestUri}.");
            }
        }

        return next(request, cancellationToken);
    }
}

internal sealed record RecordedRequest(Uri Uri, AuthenticationHeaderValue? Authorization);
