using FitSync.API.Application.CQRS.Common;

namespace FitSync.API.Application.CQRS.Command;

public sealed record CreateBookingCommand : ICqrsRequest<object?>;
