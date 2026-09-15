using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class CreateBookingCommandHandler : ICqrsHandler<CreateBookingCommand, object?>
{
    public Task<object?> HandleAsync(CreateBookingCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing BookingController.CreateBooking business logic here without changing the API contract.");
    }
}
