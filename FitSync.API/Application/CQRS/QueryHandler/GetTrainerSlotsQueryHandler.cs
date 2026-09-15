using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Query;

namespace FitSync.API.Application.CQRS.QueryHandler;

public sealed class GetTrainerSlotsQueryHandler : ICqrsHandler<GetTrainerSlotsQuery, object?>
{
    public Task<object?> HandleAsync(GetTrainerSlotsQuery request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing TrainerController.GetTrainerSlots business logic here without changing the API contract.");
    }
}
