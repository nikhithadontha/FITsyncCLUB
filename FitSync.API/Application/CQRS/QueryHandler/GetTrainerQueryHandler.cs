using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Query;

namespace FitSync.API.Application.CQRS.QueryHandler;

public sealed class GetTrainerQueryHandler : ICqrsHandler<GetTrainerQuery, object?>
{
    public Task<object?> HandleAsync(GetTrainerQuery request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing TrainerController.GetTrainer business logic here without changing the API contract.");
    }
}
