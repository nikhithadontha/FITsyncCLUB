using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class UpdateSessionCommandHandler : ICqrsHandler<UpdateSessionCommand, object?>
{
    public Task<object?> HandleAsync(UpdateSessionCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing WorkoutController.UpdateSession business logic here without changing the API contract.");
    }
}
