using NpgsqlTypes;

namespace backend.Models
{
    public enum ProjectStatus
    {
        [PgName("OPEN")] OPEN,
        [PgName("FULL")] FULL,
        [PgName("IN_PROGRESS")] IN_PROGRESS,
        [PgName("COMPLETED")] COMPLETED,
        [PgName("CANCELLED")] CANCELLED
    }

    public enum RequestStatus
    {
        [PgName("PENDING")] PENDING,
        [PgName("ACCEPTED")] ACCEPTED,
        [PgName("REJECTED")] REJECTED,
        [PgName("CANCELLED")] CANCELLED
    }
}
