namespace FitSync.API.Application.CQRS.Common;

public interface ICqrsHandler<in TRequest, TResult>
    where TRequest : ICqrsRequest<TResult>
{
    Task<TResult> HandleAsync(TRequest request, CancellationToken cancellationToken = default);
}
