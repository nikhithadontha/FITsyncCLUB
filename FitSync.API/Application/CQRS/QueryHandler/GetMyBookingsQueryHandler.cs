using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Query;

namespace FitSync.API.Application.CQRS.QueryHandler;

public sealed class GetMyBookingsQueryHandler : ICqrsHandler<GetMyBookingsQuery, object?>
{
    public Task<object?> HandleAsync(GetMyBookingsQuery request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing BookingController.GetMyBookings business logic here without changing the API contract.");
    }
}
