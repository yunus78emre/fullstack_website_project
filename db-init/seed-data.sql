-- Demo/Test seed data
-- UTF-8: This file must be saved as UTF-8.
SET client_encoding TO 'UTF8';

-- Clear tables and reset ID sequences
TRUNCATE TABLE
    password_reset_tokens,
    notifications,
    announcements,
    advisor_requests,
    student_requests,
    project_members,
    project_skills,
    user_skills,
    projects,
    advisor_category_preferences,
    project_categories,
    skills,
    advisor_profiles,
    student_profiles,
    users,
    roles
RESTART IDENTITY CASCADE;

-- ─── 1. ROLES ────────────────────────────────────────────────────────────────
INSERT INTO roles (id, role_name) VALUES
(1, 'Admin'),
(2, 'Advisor'),
(3, 'Student');
SELECT setval('roles_id_seq', 3);

-- ─── 2. USERS ────────────────────────────────────────────────────────────────
-- All users share the password: password123
INSERT INTO users (id, role_id, full_name, email, password_hash, created_at) VALUES
-- Admin (1)
(1, 1, 'System Administrator', 'admin@uskudar.edu.tr', '$2a$11$OEghZAa.nbpgYTFsYEJvGud3H9joH9TlcnW5MggJ/HDx69c5MRwGi', NOW() - INTERVAL '60 days'),

-- Advisors (2-8)
(2, 2, 'Prof. Dr. Ayse Ozkan', 'ayse.ozkan@ad.uskudar.edu.tr', '$2a$11$OEghZAa.nbpgYTFsYEJvGud3H9joH9TlcnW5MggJ/HDx69c5MRwGi', NOW() - INTERVAL '50 days'),
(3, 2, 'Assoc. Prof. Dr. Can Eraslan', 'can.eraslan@ad.uskudar.edu.tr', '$2a$11$OEghZAa.nbpgYTFsYEJvGud3H9joH9TlcnW5MggJ/HDx69c5MRwGi', NOW() - INTERVAL '50 days'),
(4, 2, 'Assist. Prof. Dr. Zeynep Aktas', 'zeynep.aktas@ad.uskudar.edu.tr', '$2a$11$OEghZAa.nbpgYTFsYEJvGud3H9joH9TlcnW5MggJ/HDx69c5MRwGi', NOW() - INTERVAL '49 days'),
(5, 2, 'Prof. Dr. Yilmaz Yilmaz', 'yilmaz.yilmaz@ad.uskudar.edu.tr', '$2a$11$OEghZAa.nbpgYTFsYEJvGud3H9joH9TlcnW5MggJ/HDx69c5MRwGi', NOW() - INTERVAL '48 days'),
(6, 2, 'Assist. Prof. Dr. Ayhan Bora', 'ayhan.bora@ad.uskudar.edu.tr', '$2a$11$OEghZAa.nbpgYTFsYEJvGud3H9joH9TlcnW5MggJ/HDx69c5MRwGi', NOW() - INTERVAL '47 days'),
(7, 2, 'Assoc. Prof. Dr. Sevgi Yilmaz', 'sevgi.yilmaz@ad.uskudar.edu.tr', '$2a$11$OEghZAa.nbpgYTFsYEJvGud3H9joH9TlcnW5MggJ/HDx69c5MRwGi', NOW() - INTERVAL '46 days'),
(8, 2, 'Assist. Prof. Dr. Kemalettin Mutlu', 'kemalettin.mutlu@ad.uskudar.edu.tr', '$2a$11$OEghZAa.nbpgYTFsYEJvGud3H9joH9TlcnW5MggJ/HDx69c5MRwGi', NOW() - INTERVAL '45 days'),

-- Students (9-15)
(9,  3, 'Hanne Meryem Özdoğan', 'hannemeryem.ozdogan@st.uskudar.edu.tr', '$2a$11$OEghZAa.nbpgYTFsYEJvGud3H9joH9TlcnW5MggJ/HDx69c5MRwGi', NOW() - INTERVAL '40 days'),
(10, 3, 'Ahmet Faruk Aksu', 'ahmetfaruk.aksu@st.uskudar.edu.tr', '$2a$11$OEghZAa.nbpgYTFsYEJvGud3H9joH9TlcnW5MggJ/HDx69c5MRwGi', NOW() - INTERVAL '39 days'),
(11, 3, 'Yunus Emre Öztürk', 'yunusemre.ozturk1@st.uskudar.edu.tr', '$2a$11$OEghZAa.nbpgYTFsYEJvGud3H9joH9TlcnW5MggJ/HDx69c5MRwGi', NOW() - INTERVAL '38 days'),
(12, 3, 'Ceren Su Palankalılar', 'cerensu.palankalilar@st.uskudar.edu.tr', '$2a$11$OEghZAa.nbpgYTFsYEJvGud3H9joH9TlcnW5MggJ/HDx69c5MRwGi', NOW() - INTERVAL '37 days'),
(13, 3, 'Gülsu Uçak', 'gulsu.ucak@st.uskudar.edu.tr', '$2a$11$OEghZAa.nbpgYTFsYEJvGud3H9joH9TlcnW5MggJ/HDx69c5MRwGi', NOW() - INTERVAL '36 days'),
(14, 3, 'Mohamad Ebaa Tayan', 'mohamadebaa.tayan@st.uskudar.edu.tr', '$2a$11$OEghZAa.nbpgYTFsYEJvGud3H9joH9TlcnW5MggJ/HDx69c5MRwGi', NOW() - INTERVAL '35 days'),
(15, 3, 'Nisanur Çeken', 'nisanur.ceken@st.uskudar.edu.tr', '$2a$11$OEghZAa.nbpgYTFsYEJvGud3H9joH9TlcnW5MggJ/HDx69c5MRwGi', NOW() - INTERVAL '34 days');
SELECT setval('users_id_seq', 15);

-- ─── 3. ADVISOR PROFILES ────────────────────────────────────────────────────
INSERT INTO advisor_profiles (id, user_id, department, academic_title, expertise, research_interests, available_for_advising) VALUES
(1, 2, 'Computer Engineering', 'Professor', 'Artificial Intelligence, Machine Learning', 'Deep Learning, NLP, Computer Vision', true),
(2, 3, 'Software Engineering', 'Associate Professor', 'Software Architecture, Cloud Computing', 'Microservices, Kubernetes, CI/CD', true),
(3, 4, 'Electrical and Electronics Engineering', 'Assistant Professor', 'IoT, Embedded Systems', 'Smart Cities, Sensor Networks', false),
(4, 5, 'Mechanical Engineering', 'Professor', 'Robotics, Automation', 'Autonomous Vehicles, Industry 4.0', true),
(5, 6, 'Computer Engineering', 'Assistant Professor', 'Cyber Security', 'Network Security, Cryptography', true),
(6, 7, 'Software Engineering', 'Associate Professor', 'Game Development, AR/VR', 'Virtual Reality, Graphics Programming', false),
(7, 8, 'Artificial Intelligence Engineering', 'Assistant Professor', 'Data Science, Big Data', 'Hadoop, Spark, Data Mining', true);
SELECT setval('advisor_profiles_id_seq', 7);

-- ─── 4. STUDENT PROFILES ────────────────────────────────────────────────────
INSERT INTO student_profiles (id, user_id, department, year, interests, bio, github_link, linkedin_link) VALUES
(1, 9,  'Computer Engineering', 3, 'Web Development, AI', 'I aim to become a full-stack developer.', 'https://github.com/hannemeryem', 'https://linkedin.com/in/hanne-meryem-ozdogan'),
(2, 10, 'Software Engineering', 4, 'Mobile Development, DevOps', 'I am passionate about mobile app development.', 'https://github.com/Ahmet-Faruk-AKSU', 'https://www.linkedin.com/in/ahmet-faruk-aksu/'),
(3, 11, 'Electrical and Electronics Engineering', 2, 'IoT, Embedded Systems', 'I build embedded systems and IoT projects.', 'https://github.com/yunus78emre', 'https://www.linkedin.com/in/yunus-emre-%C3%B6zt%C3%BCrk-500041258/'),
(4, 12, 'Mechanical Engineering', 4, 'Robotics, Mechatronics', 'I am working on autonomous systems.', 'https://github.com/cerensu', 'https://linkedin.com/in/ceren-su-palankalilar'),
(5, 13, 'Computer Engineering', 1, 'Cyber Security', 'I am improving myself in the field of security.', 'https://github.com/gulsuucak', 'https://linkedin.com/in/gulsu-ucak'),
(6, 14, 'Software Engineering', 3, 'Game Development, Unity', 'I am making my own indie game.', 'https://github.com/mohamadebaa', 'https://linkedin.com/in/mohamad-ebaa-tayan'),
(7, 15, 'Artificial Intelligence Engineering', 2, 'Data Science, Python', 'I am specializing in data analysis.', 'https://github.com/nisanurceken', 'https://linkedin.com/in/nisanur-ceken');
SELECT setval('student_profiles_id_seq', 7);

-- ─── 5. PROJECT CATEGORIES ──────────────────────────────────────────────────
INSERT INTO project_categories (id, name, description, default_team_size, default_budget, advisor_required, max_projects_per_advisor, event_date, color) VALUES
(1, 'Graduation Project', 'Senior year graduation projects', 4, 5000.00, true, 3, '2026-06-15', '#FF5733'),
(2, 'TUBITAK 2209-A', 'University Students Research Projects', 3, 10000.00, true, 5, '2026-09-01', '#33FF57'),
(3, 'Teknofest', 'Aviation, Space and Technology Festival Projects', 5, NULL, false, NULL, '2026-05-20', '#3357FF');
SELECT setval('project_categories_id_seq', 3);

-- ─── 6. ADVISOR CATEGORY PREFERENCES ────────────────────────────────────────
INSERT INTO advisor_category_preferences (advisor_id, category_id) VALUES
(1, 1), (1, 2), -- Prof. Ayse: Graduation, TUBITAK
(2, 1), (2, 3), -- Assoc. Prof. Can: Graduation, Teknofest
(3, 2), (3, 3), -- Assist. Prof. Zeynep: TUBITAK, Teknofest
(4, 1),         -- Prof. Yilmaz: Only Graduation
(5, 1), (5, 2), (5, 3), -- Assist. Prof. Ayhan: All
(6, 2),         -- Assoc. Prof. Sevgi: Only TUBITAK
(7, 3);         -- Assist. Prof. Kemalettin: Only Teknofest

-- ─── 7. SKILLS ──────────────────────────────────────────────────────────────
INSERT INTO skills (id, skill_name) VALUES
(1, 'C#/.NET'), (2, 'React.js'), (3, 'Python'), (4, 'IoT'), (5, 'Machine Learning'),
(6, 'Docker'), (7, 'Unity'), (8, 'Data Analysis'), (9, 'C++'), (10, 'ROS');
SELECT setval('skills_id_seq', 10);

-- ─── 8. USER SKILLS ─────────────────────────────────────────────────────────
INSERT INTO user_skills (user_id, skill_id) VALUES
(9, 1), (9, 2), (9, 6), -- Ahmet
(10, 2), (10, 3), (10, 6), -- Elif
(11, 4), (11, 9), -- Mehmet
(12, 10), (12, 9), -- Ayse D.
(13, 3), (13, 6), -- Canan
(14, 1), (14, 7), -- Burak
(15, 3), (15, 5), (15, 8); -- Deniz

-- ─── 9. PROJECTS ────────────────────────────────────────────────────────────
INSERT INTO projects (id, title, description, team_size, status, category_id, owner_student_id, advisor_assigned_id, created_at, updated_at) VALUES
-- Category 1: Graduation Project
(1, 'AI-Powered University Chatbot', 'AI-based Q&A system to assist university students.', 4, 'IN_PROGRESS', 1, 1, 1, NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),
(2, 'Smart Home Automation Management Panel', 'Web interface to centrally manage smart home devices.', 2, 'OPEN', 1, 3, 4, NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days'),
(3, 'Financial Forecasting Algorithm', 'Stock forecasting using machine learning.', 3, 'COMPLETED', 1, 7, 5, NOW() - INTERVAL '60 days', NOW() - INTERVAL '2 days'),

-- Category 2: TUBITAK 2209-A
(4, 'Autonomous Drone Swarm', 'Drone swarm establishing communication networks in disaster scenarios.', 3, 'IN_PROGRESS', 2, 4, 3, NOW() - INTERVAL '20 days', NOW() - INTERVAL '12 days'),
(5, 'Early Diagnosis Health Application', 'Cancer diagnosis assistant using image processing.', 3, 'OPEN', 2, 2, 6, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 days'),

-- Category 3: Teknofest
(6, 'Model Rocket Design', 'High altitude model rocket design and avionics system.', 5, 'IN_PROGRESS', 3, 3, NULL, NOW() - INTERVAL '40 days', NOW() - INTERVAL '3 days'),
(7, 'Autonomous Electric Vehicle', 'Electric racing vehicle with autonomous driving capabilities.', 6, 'OPEN', 3, 6, 7, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 days'),
(8, 'Unmanned Underwater Vehicle', 'ROV designed for deep water research.', 4, 'COMPLETED', 3, 5, NULL, NOW() - INTERVAL '90 days', NOW() - INTERVAL '5 days');
SELECT setval('projects_id_seq', 8);

-- ─── 10. PROJECT SKILLS ─────────────────────────────────────────────────────
INSERT INTO project_skills (project_id, skill_id) VALUES
(1, 3), (1, 5), (1, 2), -- P1: Python, ML, React
(2, 1), (2, 2), (2, 4), -- P2: C#, React, IoT
(3, 3), (3, 8), (3, 5), -- P3: Python, Data, ML
(4, 9), (4, 10), (4, 4),-- P4: C++, ROS, IoT
(5, 3), (5, 5),         -- P5: Python, ML
(6, 9), (6, 4),         -- P6: C++, IoT
(7, 10), (7, 5), (7, 3),-- P7: ROS, ML, Python
(8, 9), (8, 4), (8, 6); -- P8: C++, IoT, Docker

-- ─── 11. PROJECT MEMBERS ────────────────────────────────────────────────────
INSERT INTO project_members (project_id, student_id, member_role) VALUES
(1, 1, 'Project Owner'), (1, 2, 'Frontend Developer'),
(2, 3, 'Project Owner'),
(3, 7, 'Project Owner'), (3, 1, 'Backend Developer'), (3, 6, 'Data Analyst'),
(4, 4, 'Project Owner'), (4, 3, 'Embedded Systems Engineer'), (4, 5, 'Security Analyst'),
(5, 2, 'Project Owner'),
(6, 3, 'Project Owner'), (6, 4, 'Avionics Engineer'),
(7, 6, 'Project Owner'), (7, 2, 'Software Developer'),
(8, 5, 'Project Owner'), (8, 1, 'Full Stack Developer'), (8, 7, 'Data Engineer');

-- ─── 12. STUDENT REQUESTS ───────────────────────────────────────────────────
INSERT INTO student_requests (project_id, applicant_student_id, message, status, created_at) VALUES
(2, 5, 'I can help with the security aspect.', 'PENDING', NOW() - INTERVAL '2 days'),
(5, 7, 'This data science project is perfect for me.', 'REJECTED', NOW() - INTERVAL '4 days'),
(7, 1, 'I can take on the React development.', 'PENDING', NOW() - INTERVAL '1 days'),
(1, 2, 'I would love to join the project.', 'ACCEPTED', NOW() - INTERVAL '25 days');

-- ─── 13. ADVISOR REQUESTS ───────────────────────────────────────────────────
INSERT INTO advisor_requests (project_id, advisor_id, message, status, created_at) VALUES
(2, 1, 'Would you be our advisor for this smart home project?', 'PENDING', NOW() - INTERVAL '5 days'),
(7, 5, 'We need your help with secure communication in our autonomous vehicle project.', 'REJECTED', NOW() - INTERVAL '3 days'),
(1, 1, 'We are looking for an advisor for the chatbot project.', 'ACCEPTED', NOW() - INTERVAL '28 days');

-- ─── 14. ANNOUNCEMENTS ──────────────────────────────────────────────────────
INSERT INTO announcements (category_id, published_by, title, description, created_at) VALUES
(1, 1, 'Graduation Project Submission Dates Announced', 'The final submission deadline for graduation projects is set to June 15.', NOW() - INTERVAL '7 days'),
(3, 1, 'Teknofest Applications Are Starting', 'Team registrations for the Teknofest competition will open next week.', NOW() - INTERVAL '3 days'),
(2, 1, 'TUBITAK 2209-A Budget Update', 'The maximum support limit for projects has been increased.', NOW() - INTERVAL '1 days'),
(NULL, 1, 'System Maintenance', 'Server maintenance will be performed this weekend, brief outages may occur.', NOW() - INTERVAL '10 hours');

-- ─── 15. NOTIFICATIONS ──────────────────────────────────────────────────────
INSERT INTO notifications (user_id, title, body, is_read, kind, project_category, created_at) VALUES
(9, 'Graduation Project Submission Dates Announced', 'The final submission deadline for graduation projects is set to June 15.', false, 'announcement', 'Graduation Project', NOW() - INTERVAL '7 days'),
(10, 'Accepted to Project', 'You have been accepted to the AI-Powered University Chatbot project.', true, 'project', 'Graduation Project', NOW() - INTERVAL '25 days'),
(2, 'Advisor Request', 'Hanne Meryem Özdoğan has requested you as an advisor for the AI-Powered University Chatbot project.', true, 'project', 'Graduation Project', NOW() - INTERVAL '28 days');

-- ─── 16. PASSWORD RESET TOKENS ──────────────────────────────────────────────
INSERT INTO password_reset_tokens (user_id, token, expires_at, is_used, created_at) VALUES
(9, '482910', NOW() + INTERVAL '1 hour', false, NOW()),
(10, '735261', NOW() - INTERVAL '2 hours', true, NOW() - INTERVAL '3 hours');
