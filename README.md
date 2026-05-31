# 🎓 Academic Project & Advisor Management System

This project is a **full-stack** web application designed to streamline and manage student project groups, project proposals, and academic advisor (faculty) assignments in educational institutions (e.g., graduation/capstone projects or senior design courses).

The system enables students to propose project ideas, search for team members, apply to existing projects, request academic advisors, and manage the entire project lifecycle in one centralized platform.

---

## 🚀 Technology Stack

The project is built using a modern, modular, and scalable architecture.

### 💻 Frontend (Client)
* **Framework:** Next.js (App Router, React 19, TypeScript)
* **Styling & UI:** Tailwind CSS v4, Radix UI & Shadcn UI components
* **Charts & Analytics:** Recharts (for dashboard analytics)
* **Icons:** Lucide React
* **Forms & Validation:** React Hook Form & Zod
* **Notifications:** Sonner (Toast alerts)

### ⚙️ Backend (API)
* **Language & Framework:** C# - ASP.NET Core Web API (.NET 9.0)
* **ORM:** Entity Framework Core (EF Core)
* **Security & Auth:** JWT Bearer Token-based Authentication
* **Password Hashing:** BCrypt
* **Email Service:** MailKit (for password resets and system notifications)
* **API Documentation:** OpenAPI (Swagger) & Scalar API Reference (accessible at `/scalar/v1`)

### 🗄️ Database & Infrastructure
* **Database:** PostgreSQL 15
* **Containerization:** Docker & Docker Compose (for PostgreSQL db instance)

---

## ✨ Key Features

The platform supports 3 primary user roles:

### 🧑‍🎓 Students
* **Profile Management:** Set up department, year of study, interests, bio, GitHub, and LinkedIn links.
* **Skill Tags:** Define and list personal skills to stand out.
* **Project Proposals:** Create project proposals specifying title, description, team size, category, etc.
* **Team Recruiting & Applications:** Apply to join other students' projects (`student_requests`) or manage incoming student requests.
* **Advisor Requests:** Invite available advisors to supervise the project (`advisor_requests`).

### 🧑‍🏫 Advisors (Faculty Members)
* **Academic Profiles:** Manage academic titles, departments, expertise, research interests, and advising availability.
* **Category Preferences:** Choose which project categories (e.g., Artificial Intelligence, Web Development, IoT) to advise (`advisor_category_preferences`).
* **Request Supervision Management:** Accept or decline incoming supervision requests from student projects.
* **Capacity Tracking:** Manage advising quotas (maximum projects an advisor can supervise).

### 👑 Administrators (Admins)
* **Category Administration:** Create, read, update, and delete project categories.
* **Constraints Configuration:** Configure team size limits, estimated budgets, key event dates, and advisor quotas for each category.
* **Announcements Board:** Publish category-specific or system-wide announcements.
* **User & System Operations:** Oversee user registrations, role assignments, and database operations.

---

## 🛠️ Getting Started

Follow the instructions below to set up and run the project locally.

### 📌 Prerequisites
* [Docker Desktop](https://www.docker.com/) installed and running on your system.
* [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0) installed.
* [Node.js](https://nodejs.org/) (v18 or higher) with a package manager like `pnpm` or `npm` installed.

---

### 1. Database Setup with Docker
Open a terminal in the project's root directory and spin up the database container:

```bash
docker-compose up -d
```
*This command will pull and start a PostgreSQL instance, then automatically execute the scripts in `db-init/init.sql` and `db-init/seed-data.sql` to initialize the tables and seed mock data.*

---

### 2. Running the Backend API
Navigate to the `backend` folder:

```bash
cd backend
```

Restore NuGet packages:
```bash
dotnet restore
```

Run the application:
```bash
dotnet run
```
* The backend API runs locally by default at `http://localhost:5048`.
* You can explore and test the endpoints directly by opening `http://localhost:5048/scalar/v1` in your browser.

> 💡 **Tip:** To test email features (e.g., password reset tokens), you can update the `EmailSettings` section in `backend/appsettings.json` with your real SMTP configurations.

---

### 3. Running the Frontend App
Navigate to the `frontend` directory:

```bash
cd ../frontend
```

Install dependencies:
```bash
pnpm install
# or
npm install
```

Run the development server:
```bash
pnpm dev
# or
npm run dev
```
* The client web application will be accessible at `http://localhost:3000`.

---

## 📁 Project Folder Structure

```text
├── db-init/               # DB schema and initial data
│   ├── init.sql           # Database schema (tables, enums, etc.)
│   └── seed-data.sql      # Seed data for roles, users, and profiles
├── backend/               # ASP.NET Core Web API Project
│   ├── Controllers/       # REST API Endpoints (Controllers)
│   ├── Data/              # DbContext & Database Connection Layer
│   ├── Models/            # Database Entity Models
│   ├── DTOs/              # Data Transfer Objects
│   ├── Services/          # Business Logic (Email, Token, Profile Services)
│   └── Program.cs         # App configuration & Entry Point
├── frontend/              # Next.js Frontend Project
│   ├── app/               # Page routing (App Router)
│   ├── components/        # Reusable UI components (Shadcn)
│   ├── hooks/             # Custom React Hooks
│   └── lib/               # Utility functions and API configuration (Axios)
└── docker-compose.yml     # PostgreSQL service definition
```

---

## 🔐 Credentials for Testing
You can use the following mock accounts populated from the seed script. Passwords are set to `password123`.

* **Student Account:** `student@uskudar.edu.tr` / `password123`
* **Advisor Account:** `advisor@uskudar.edu.tr` / `password123`
* **Admin Account:** `admin@uskudar.edu.tr` / `password123`
