using FitSync.API.Application.CQRS.Common;

namespace FitSync.API.Application.CQRS.Query;

public sealed record GetProfileQuery : ICqrsRequest<object?>;
