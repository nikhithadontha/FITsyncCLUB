using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class CancelBookingCommandHandler : ICqrsHandler<CancelBookingCommand, object?>
{
    public Task<object?> HandleAsync(CancelBookingCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing BookingController.CancelBooking business logic here without changing the API contract.");
    }
}
