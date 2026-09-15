using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class CreateFacilityCommandHandler : ICqrsHandler<CreateFacilityCommand, object?>
{
    public Task<object?> HandleAsync(CreateFacilityCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing AdminController.CreateFacility business logic here without changing the API contract.");
    }
}
