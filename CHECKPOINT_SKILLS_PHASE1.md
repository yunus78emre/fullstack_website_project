Skills Phase-1 Checkpoint
=========================

Date: 2026-04-28

Goal
----
Persist and display user skills (student + advisor) through backend profile APIs and settings update flow.

Current confirmed state before implementation
---------------------------------------------
- DB tables exist: `skills`, `user_skills`, `project_skills`.
- `project_skills` is used.
- `user_skills` is mostly unused in profile read/write.
- Frontend settings has skills UI, but backend profile update does not persist skills.

Phase-1 scope
-------------
1) Add `Skills: string[]` to profile DTOs.
2) Add `Skills` to `UpdateProfileDto`.
3) Persist skills in `PUT /api/auth/profile` via `skills` + `user_skills`.
4) Return skills in:
   - `GET /api/student/profile/me`
   - `GET /api/advisor/profile/me`
5) Sync frontend auth user from role profile endpoint after login/update.

Rollback hint
-------------
If needed, revert files touched after this checkpoint:
- backend/Controllers/AuthController.cs
- backend/Controllers/StudentController.cs
- backend/DTOs/Student/StudentProfileResponseDTO.cs
- backend/DTOs/Advisor/AdvisorProfileDTOs.cs
- backend/Services/AdvisorProfileService.cs
- frontend/lib/auth-context.tsx
