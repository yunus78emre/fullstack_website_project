using backend.DTOs.Advisor;
using System.Collections.Generic;

namespace backend.Services
{
    /// <summary>
    /// Defines the contract for advisor-area operations (profile, projects, requests, etc.).
    /// </summary>
    public interface IAdvisorProfileService
    {
        /// <summary>
        /// Retrieves the combined user + advisor profile data for the given user ID.
        /// Returns null if no advisor profile exists for the user.
        /// </summary>
        Task<AdvisorProfileResponseDTO?> GetProfileByUserIdAsync(int userId);

        /// <summary>
        /// Retrieves all projects where the advisor (identified by user ID) is assigned
        /// via projects.advisor_assigned_id. Returns null if the advisor profile does not exist.
        /// </summary>
        Task<List<AdvisorProjectListItemDTO>?> GetProjectsByUserIdAsync(int userId);

        /// <summary>
        /// Creates a new advisor request for a student-owned project.
        /// Returns (response, statusCode, errorMessage). On success errorMessage is null.
        /// </summary>
        Task<(AdvisorSendRequestResponseDTO? Response, int StatusCode, string? ErrorMessage)>
            SendAdvisorRequestAsync(int userId, AdvisorSendRequestRequestDTO request);

        /// <summary>
        /// Retrieves all incoming advisor requests for the logged-in advisor.
        /// Returns null if the advisor profile does not exist.
        /// </summary>
        Task<AdvisorIncomingRequestsResponseDTO?> GetIncomingRequestsByUserIdAsync(int userId);

        /// <summary>
        /// Searches for student-owned projects based on dynamic filters, sorting, and pagination.
        /// Returns null if the advisor profile does not exist.
        /// </summary>
        Task<AdvisorSearchProjectsResponseDTO?> SearchProjectsAsync(int userId, AdvisorSearchProjectsQueryDTO query);

        /// <summary>
        /// Retrieves a combined announcement feed for advisors (Direct, Categories, Projects Looking for Advisors).
        /// Returns null if the advisor profile does not exist.
        /// </summary>
        Task<AdvisorAnnouncementsFeedResponseDTO?> GetAnnouncementsFeedAsync(int userId);

        /// <summary>
        /// Retrieves a list of availability statuses for the logged-in advisor across all relevant categories.
        /// Useful for the advisor's dashboard to see their current capacity usage (e.g. 2/3).
        /// </summary>
        Task<List<AdvisorCategoryAvailabilityDTO>?> GetMyAvailabilityAsync(int userId);

        /// <summary>
        /// Saves which categories the advisor accepts for incoming requests.
        /// </summary>
        Task<(bool Success, string Message)> UpdateMyAvailabilityAsync(int userId, List<int> selectedCategoryIds);
    }
}
