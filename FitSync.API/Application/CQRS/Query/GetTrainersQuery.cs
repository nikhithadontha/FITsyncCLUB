using FitSync.API.Application.CQRS.Common;

namespace FitSync.API.Application.CQRS.Query;

public sealed record GetTrainersQuery : ICqrsRequest<object?>;
