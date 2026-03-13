-- Kullanıcılar (Admin, Instructor, Student) [cite: 11, 14]
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('Admin', 'Instructor', 'Student')),
    department VARCHAR(100)
);

-- Projeler (Course, TÜBİTAK, Teknofest) [cite: 5, 6, 7]
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    project_type VARCHAR(50),
    description TEXT,
    team_size_limit INTEGER,
    creator_id INTEGER REFERENCES users(id)
);

-- Duyurular (Admin tarafından yönetilen) [cite: 33, 34]
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    deadline_date DATE
);