using System;
using System.Collections.Generic;

namespace backend.DTOs.Advisor
{
    /// <summary>
    /// Represents the availability of an advisor for a specific project category.
    /// Used across search results and request validations.
    /// </summary>
    public class AdvisorCategoryAvailabilityDTO
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? CategoryColor { get; set; }
        public bool IsSelected { get; set; }
        public int AdvisorId { get; set; }
        
        public int CurrentAssignedProjectCount { get; set; }
        public int? MaxAllowedProjectCount { get; set; } // Null if unlimited
        
        /// <summary>
        /// Human-readable availability text (e.g., "2/3", "3/3", "Unlimited")
        /// </summary>
        public string AvailabilityText { get; set; } = string.Empty;
        
        /// <summary>
        /// True if the advisor can still be assigned to projects in this category.
        /// </summary>
        public bool IsAvailable { get; set; }
    }

    /// <summary>
    /// Information about a category's capacity settings.
    /// </summary>
    public class ProjectCategoryCapacitySettingsDTO
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int? MaxProjectsPerAdvisor { get; set; }
    }

    public class UpdateAdvisorAvailabilityRequestDTO
    {
        public List<int> SelectedCategoryIds { get; set; } = new();
    }
}
