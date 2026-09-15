using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class DeleteFacilityCommandHandler : ICqrsHandler<DeleteFacilityCommand, object?>
{
    public Task<object?> HandleAsync(DeleteFacilityCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing AdminController.DeleteFacility business logic here without changing the API contract.");
    }
}
