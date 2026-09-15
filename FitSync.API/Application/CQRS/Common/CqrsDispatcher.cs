using Microsoft.Extensions.DependencyInjection;

namespace FitSync.API.Application.CQRS.Common;

public sealed class CqrsDispatcher(IServiceProvider serviceProvider)
{
    public Task<TResult> SendAsync<TResult>(ICqrsRequest<TResult> request, CancellationToken cancellationToken = default)
    {
        var handlerType = typeof(ICqrsHandler<,>).MakeGenericType(request.GetType(), typeof(TResult));
        dynamic handler = serviceProvider.GetRequiredService(handlerType);
        return handler.HandleAsync((dynamic)request, cancellationToken);
    }
}
