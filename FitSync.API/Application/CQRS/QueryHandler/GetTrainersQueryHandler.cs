using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Query;

namespace FitSync.API.Application.CQRS.QueryHandler;

public sealed class GetTrainersQueryHandler : ICqrsHandler<GetTrainersQuery, object?>
{
    public Task<object?> HandleAsync(GetTrainersQuery request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing TrainerController.GetTrainers business logic here without changing the API contract.");
    }
}
