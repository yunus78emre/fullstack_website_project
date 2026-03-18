CREATE TYPE project_status_enum AS ENUM (
'OPEN',
'FULL',
'IN_PROGRESS',
'COMPLETED',
'CANCELLED'
);

CREATE TYPE request_status_enum AS ENUM (
'PENDING',
'ACCEPTED',
'REJECTED',
'CANCELLED'
);

-- ROLES TABLE
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

-- USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- STUDENT PROFILES
CREATE TABLE student_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(120),
    year INT,
    interests TEXT,
    bio TEXT,
    github_link VARCHAR(200),
    linkedin_link VARCHAR(200)
);

-- ADVISOR PROFILES
CREATE TABLE advisor_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(120),
    academic_title VARCHAR(100),
    expertise TEXT,
    research_interests TEXT,
    available_for_advising BOOLEAN DEFAULT TRUE
);

CREATE TABLE project_categories (
id SERIAL PRIMARY KEY,
name VARCHAR(100) UNIQUE NOT NULL,
description TEXT,
default_team_size INT,
default_budget NUMERIC(12,2),
advisor_required BOOLEAN DEFAULT FALSE,
event_date DATE
);

-- PROJECTS
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    team_size INT,
    status project_status_enum DEFAULT 'OPEN',
    category_id INT REFERENCES project_categories(id) ON DELETE SET NULL,
    owner_student_id INT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    advisor_assigned_id INT REFERENCES advisor_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- SKILLS
CREATE TABLE skills (
id SERIAL PRIMARY KEY,
skill_name VARCHAR(120) UNIQUE NOT NULL
);

-- USER SKILLS
CREATE TABLE user_skills (
id SERIAL PRIMARY KEY,
user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
UNIQUE (user_id, skill_id),
level VARCHAR(50)
);

-- PROJECT SKILLS
CREATE TABLE project_skills (
id SERIAL PRIMARY KEY,
project_id INT REFERENCES projects(id) ON DELETE CASCADE,
skill_id INT REFERENCES skills(id) ON DELETE CASCADE,
UNIQUE (project_id, skill_id)
);

-- PROJECT MEMBERS ROLES
CREATE TABLE project_members (
id SERIAL PRIMARY KEY,
project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
student_id INT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
UNIQUE (project_id, student_id),
member_role VARCHAR(120) NOT NULL
);

-- STUDENT REQUEST (apply to project)
CREATE TABLE student_requests (
id SERIAL PRIMARY KEY,
project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
applicant_student_id INT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
UNIQUE (project_id, applicant_student_id),
message TEXT,
status request_status_enum DEFAULT 'PENDING',
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ADVISOR REQUEST
CREATE TABLE advisor_requests (
id SERIAL PRIMARY KEY,
project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
advisor_id INT NOT NULL REFERENCES advisor_profiles(id) ON DELETE CASCADE,
UNIQUE (project_id, advisor_id),
message TEXT,
status request_status_enum DEFAULT 'PENDING',
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ANNOUNCEMENTS
CREATE TABLE announcements (
id SERIAL PRIMARY KEY,
category_id INT REFERENCES project_categories(id) ON DELETE SET NULL,
published_by INT REFERENCES users(id),
title VARCHAR(200),
description TEXT,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);




