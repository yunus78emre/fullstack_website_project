namespace backend.Models
{
    public enum ProjectStatus
    {
        OPEN,
        FULL,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }

    public enum RequestStatus
    {
        PENDING,
        ACCEPTED,
        REJECTED,
        CANCELLED
    }
}
