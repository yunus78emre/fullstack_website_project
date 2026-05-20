using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs.Advisor;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    /// <summary>
    /// Service to manage and calculate advisor capacity and availability across project categories.
    /// Used for validation during request sending and for visibility in search results.
    /// </summary>
    public interface IAdvisorAvailabilityService
    {
        /// <summary>
        /// Calculates the current availability of an advisor for a specific category.
        /// </summary>
        Task<AdvisorCategoryAvailabilityDTO> GetAdvisorAvailabilityAsync(int advisorProfileId, int categoryId);

        /// <summary>
        /// Evaluates availability for a list of advisors in a specific category.
        /// Useful for search result enrichment to avoid N+1 queries.
        /// </summary>
        Task<Dictionary<int, AdvisorCategoryAvailabilityDTO>> EvaluateAvailabilityBulkAsync(int categoryId, List<int> advisorProfileIds);
        
        /// <summary>
        /// Direct check if an advisor can be assigned to a project in a specific category.
        /// </summary>
        Task<(bool IsAvailable, string Message)> CheckAvailabilityAsync(int advisorProfileId, int categoryId);
    }

    public class AdvisorAvailabilityService : IAdvisorAvailabilityService
    {
        private readonly AppDbContext _context;

        public AdvisorAvailabilityService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<AdvisorCategoryAvailabilityDTO> GetAdvisorAvailabilityAsync(int advisorProfileId, int categoryId)
        {
            // 1. Load Category Capacity
            var category = await _context.ProjectCategories
                .AsNoTracking()
                .Where(c => c.Id == categoryId)
                .Select(c => new { c.Id, c.Name, c.Color, c.MaxProjectsPerAdvisor })
                .FirstOrDefaultAsync();

            if (category == null)
            {
                throw new ArgumentException($"Category with ID {categoryId} not found.");
            }

            // 2. Count currently assigned projects for this advisor in this category
            int currentCount = await _context.Projects
                .CountAsync(p => p.AdvisorAssignedId == advisorProfileId && p.CategoryId == categoryId);

            // 3. Build Availability DTO
            var availability = new AdvisorCategoryAvailabilityDTO
            {
                CategoryId = categoryId,
                CategoryName = category.Name,
                CategoryColor = category.Color,
                AdvisorId = advisorProfileId,
                CurrentAssignedProjectCount = currentCount,
                MaxAllowedProjectCount = category.MaxProjectsPerAdvisor
            };

            if (category.MaxProjectsPerAdvisor == null)
            {
                availability.IsAvailable = true;
                availability.AvailabilityText = "Unlimited";
            }
            else
            {
                availability.IsAvailable = currentCount < category.MaxProjectsPerAdvisor.Value;
                availability.AvailabilityText = $"{currentCount}/{category.MaxProjectsPerAdvisor.Value}";
            }

            return availability;
        }

        public async Task<Dictionary<int, AdvisorCategoryAvailabilityDTO>> EvaluateAvailabilityBulkAsync(int categoryId, List<int> advisorProfileIds)
        {
            var category = await _context.ProjectCategories
                .AsNoTracking()
                .Where(c => c.Id == categoryId)
                .Select(c => new { c.Id, c.Name, c.Color, c.MaxProjectsPerAdvisor })
                .FirstOrDefaultAsync();

            if (category == null) return new Dictionary<int, AdvisorCategoryAvailabilityDTO>();

            // Optimized aggregation: Count projects per advisor ID in the target category
            var counts = await _context.Projects
                .Where(p => advisorProfileIds.Contains(p.AdvisorAssignedId ?? 0) && p.CategoryId == categoryId)
                .GroupBy(p => p.AdvisorAssignedId)
                .Select(g => new { AdvisorId = g.Key!.Value, Count = g.Count() })
                .ToDictionaryAsync(x => x.AdvisorId, x => x.Count);

            var result = new Dictionary<int, AdvisorCategoryAvailabilityDTO>();

            foreach (var advisorId in advisorProfileIds)
            {
                int currentCount = counts.GetValueOrDefault(advisorId, 0);
                
                var availability = new AdvisorCategoryAvailabilityDTO
                {
                    CategoryId = categoryId,
                    CategoryName = category.Name,
                    CategoryColor = category.Color,
                    AdvisorId = advisorId,
                    CurrentAssignedProjectCount = currentCount,
                    MaxAllowedProjectCount = category.MaxProjectsPerAdvisor
                };

                if (category.MaxProjectsPerAdvisor == null)
                {
                    availability.IsAvailable = true;
                    availability.AvailabilityText = "Unlimited";
                }
                else
                {
                    availability.IsAvailable = currentCount < category.MaxProjectsPerAdvisor.Value;
                    availability.AvailabilityText = $"{currentCount}/{category.MaxProjectsPerAdvisor.Value}";
                }

                result[advisorId] = availability;
            }

            return result;
        }

        public async Task<(bool IsAvailable, string Message)> CheckAvailabilityAsync(int advisorProfileId, int categoryId)
        {
            var availability = await GetAdvisorAvailabilityAsync(advisorProfileId, categoryId);
            
            if (availability.IsAvailable)
            {
                return (true, "Advisor is available.");
            }

            return (false, $"Advisor has reached the maximum project limit ({availability.AvailabilityText}) for the '{availability.CategoryName}' category.");
        }
    }
}
