using NasaTrendDetective.Application.Interfaces;

namespace NasaTrendDetective.Infrastructure.Implements;

/// <summary>Singleton flag set by <see cref="DatasetSeedHostedService"/> when seeding is over.</summary>
public sealed class DatasetSeedState : IDatasetSeedState
{
    private readonly TaskCompletionSource _completion = new(TaskCreationOptions.RunContinuationsAsynchronously);

    public bool IsCompleted => _completion.Task.IsCompleted;

    public Task Completed => _completion.Task;

    public void MarkCompleted() => _completion.TrySetResult();
}
