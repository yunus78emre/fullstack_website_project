import type { Project, ProjectRequest, StudentRequest, Announcement, ProjectCategory, ScheduleItem, CourseGrade, StudentProfile } from './types'

// Category colors
export const categoryColors: Record<string, string> = {
  'TUBITAK': 'bg-blue-500',
  'Teknofest': 'bg-orange-500',
  'Graduation Project': 'bg-emerald-500',
  'Research Assistant': 'bg-purple-500',
}

export const categoryTextColors: Record<string, string> = {
  'TUBITAK': 'text-blue-600',
  'Teknofest': 'text-orange-600',
  'Graduation Project': 'text-emerald-600',
  'Research Assistant': 'text-purple-600',
}

export const categoryBgColors: Record<string, string> = {
  'TUBITAK': 'bg-blue-100',
  'Teknofest': 'bg-orange-100',
  'Graduation Project': 'bg-emerald-100',
  'Research Assistant': 'bg-purple-100',
}

export const projectCategories: ProjectCategory[] = [
  { id: '1', name: 'TUBITAK', description: 'TUBITAK research projects', budget: 50000, teamSize: 3, advisorRequired: true, color: 'bg-blue-500' },
  { id: '2', name: 'Teknofest', description: 'Teknofest competition projects', budget: 25000, teamSize: 5, advisorRequired: true, color: 'bg-orange-500' },
  { id: '3', name: 'Graduation Project', description: 'Senior year graduation projects', budget: 5000, teamSize: 2, advisorRequired: true, color: 'bg-emerald-500' },
  { id: '4', name: 'Research Assistant', description: 'Research assistant projects', budget: 15000, teamSize: 1, advisorRequired: false, color: 'bg-purple-500' },
]

export const announcements: Announcement[] = [
  {
    id: '1',
    title: 'TUBITAK 2209-A Application Period Open',
    detail: 'The application period for TUBITAK 2209-A Research Projects Support Program for Undergraduate Students has started. Students can submit their project proposals through the system. All proposals must include a detailed methodology section, expected outcomes, and a timeline. The budget should not exceed 50,000 TL. For more information, please contact your department coordinator.',
    category: 'TUBITAK',
    publishDate: '2026-03-01',
    deadline: '2026-04-15',
    createdBy: 'Admin',
  },
  {
    id: '2',
    title: 'Teknofest 2026 Registration',
    detail: 'Teknofest 2026 competition registrations are now open. Teams can register for various categories including software, AI, and robotics. Each team must have between 2-5 members. Teams must have an academic advisor from the university. Registration fee is waived for students. Preliminary rounds will be held online, and finals will be held in Istanbul.',
    category: 'Teknofest',
    publishDate: '2026-03-10',
    deadline: '2026-05-01',
    createdBy: 'Admin',
  },
  {
    id: '3',
    title: 'Graduation Project Advisor Selection',
    detail: 'Final year students must select their graduation project advisors by the end of this month. Please contact your preferred advisor and submit the advisor request form through the portal. Each advisor can accept a maximum of 5 students per semester. Make sure to have your project proposal ready before approaching advisors.',
    category: 'Graduation Project',
    publishDate: '2026-03-15',
    deadline: '2026-03-31',
    createdBy: 'Admin',
  },
]

export const projects: Project[] = [
  {
    id: '1',
    title: 'AI-Powered Student Assistant',
    description: 'Developing an AI chatbot to help students with academic queries. The system will use natural language processing to understand student questions and provide relevant answers from the university knowledge base. Features include course recommendations, deadline reminders, and FAQ responses.',
    category: 'TUBITAK',
    status: 'in-progress',
    studentId: '3',
    studentName: 'Mehmet Demir',
    advisorId: '2',
    advisorName: 'Dr. Ahmet Yilmaz',
    createdAt: '2026-02-15',
    budget: 45000,
    teamSize: 3,
    teamMembers: ['Mehmet Demir', 'Ayse Kara', 'Can Yildiz'],
  },
  {
    id: '2',
    title: 'Autonomous Drone Navigation',
    description: 'Building a drone that can navigate autonomously using computer vision. The drone will be equipped with cameras and sensors to detect obstacles and plan optimal routes. Applications include search and rescue, agricultural monitoring, and infrastructure inspection.',
    category: 'Teknofest',
    status: 'approved',
    studentId: '4',
    studentName: 'Ayse Kaya',
    advisorId: '2',
    advisorName: 'Dr. Ahmet Yilmaz',
    createdAt: '2026-01-20',
    budget: 22000,
    teamSize: 4,
    teamMembers: ['Ayse Kaya', 'Burak Sen', 'Deniz Yilmaz', 'Ece Ozkan'],
  },
  {
    id: '3',
    title: 'Smart Campus App',
    description: 'Mobile application for campus navigation and services. Features include interactive maps, building information, event calendar, cafeteria menus, and shuttle tracking. The app will use AR technology for indoor navigation.',
    category: 'Graduation Project',
    status: 'pending',
    studentId: '5',
    studentName: 'Ali Ozturk',
    createdAt: '2026-03-10',
    budget: 3000,
    teamSize: 2,
    teamMembers: ['Ali Ozturk', 'Selin Arslan'],
  },
  {
    id: '4',
    title: 'Blockchain Voting System',
    description: 'A secure and transparent voting system using blockchain technology. The system ensures vote integrity, prevents double voting, and provides verifiable results while maintaining voter anonymity.',
    category: 'TUBITAK',
    status: 'pending',
    studentId: '6',
    studentName: 'Zeynep Arslan',
    createdAt: '2026-03-12',
    budget: 35000,
    teamSize: 2,
    teamMembers: ['Zeynep Arslan', 'Emre Can'],
  },
]

export const projectRequests: ProjectRequest[] = [
  {
    id: '1',
    projectId: '3',
    projectTitle: 'Smart Campus App',
    studentId: '5',
    studentName: 'Ali Ozturk',
    advisorId: '2',
    status: 'pending',
    createdAt: '2026-03-10',
    projectDescription: 'Mobile application for campus navigation and services. Features include interactive maps, building information, event calendar, cafeteria menus, and shuttle tracking.',
    projectCategory: 'Graduation Project',
  },
  {
    id: '2',
    projectId: '4',
    projectTitle: 'Blockchain Voting System',
    studentId: '6',
    studentName: 'Zeynep Arslan',
    advisorId: '2',
    status: 'pending',
    createdAt: '2026-03-12',
    projectDescription: 'A secure and transparent voting system using blockchain technology. The system ensures vote integrity, prevents double voting, and provides verifiable results.',
    projectCategory: 'TUBITAK',
  },
]

export const studentRequests: StudentRequest[] = [
  {
    id: 'sr-1',
    projectId: '1',
    projectTitle: 'AI-Powered Student Assistant',
    projectCategory: 'TUBITAK',
    ownerStudentId: '3',
    requesterStudentId: '5',
    requesterStudentName: 'Ali Ozturk',
    requesterEmail: 'ali.ozturk@st.uskudar.edu.tr',
    requesterDepartment: 'Computer Engineering',
    message: 'I would love to contribute with NLP and backend experience.',
    status: 'pending',
    createdAt: '2026-03-14',
  },
  {
    id: 'sr-2',
    projectId: '1',
    projectTitle: 'AI-Powered Student Assistant',
    projectCategory: 'TUBITAK',
    ownerStudentId: '3',
    requesterStudentId: '6',
    requesterStudentName: 'Zeynep Arslan',
    requesterEmail: 'zeynep.arslan@st.uskudar.edu.tr',
    requesterDepartment: 'Software Engineering',
    message: 'I have experience with React and data visualization and would like to join.',
    status: 'pending',
    createdAt: '2026-03-15',
  },
  {
    id: 'sr-3',
    projectId: '3',
    projectTitle: 'Smart Campus App',
    projectCategory: 'Graduation Project',
    ownerStudentId: '5',
    requesterStudentId: '6',
    requesterStudentName: 'Zeynep Arslan',
    requesterEmail: 'zeynep.arslan@st.uskudar.edu.tr',
    requesterDepartment: 'Software Engineering',
    message: 'I can help with the mobile AR indoor navigation part.',
    status: 'approved',
    createdAt: '2026-03-11',
  },
]

export const weeklySchedule: ScheduleItem[] = [
  { id: '1', day: 'Pazartesi', time: '09:00-10:30', course: 'Veri Yapilari', location: 'D-201' },
  { id: '2', day: 'Pazartesi', time: '11:00-12:30', course: 'Algoritma Analizi', location: 'D-305' },
  { id: '3', day: 'Sali', time: '09:00-10:30', course: 'Veritabani Yonetimi', location: 'Lab-1' },
  { id: '4', day: 'Sali', time: '14:00-15:30', course: 'Yazilim Muhendisligi', location: 'D-102' },
  { id: '5', day: 'Carsamba', time: '10:00-11:30', course: 'Bilgisayar Aglari', location: 'D-201' },
  { id: '6', day: 'Persembe', time: '09:00-10:30', course: 'Veri Yapilari Lab', location: 'Lab-2' },
  { id: '7', day: 'Persembe', time: '13:00-14:30', course: 'Isletim Sistemleri', location: 'D-305' },
  { id: '8', day: 'Cuma', time: '11:00-12:30', course: 'Yapay Zeka', location: 'D-102' },
]

export const courseGrades: CourseGrade[] = [
  { id: '1', code: 'BIL201', name: 'Veri Yapilari', credit: 4, midterm: 85, final: 90, grade: 'AA' },
  { id: '2', code: 'BIL301', name: 'Algoritma Analizi', credit: 3, midterm: 78, final: 82, grade: 'BA' },
  { id: '3', code: 'BIL302', name: 'Veritabani Yonetimi', credit: 3, midterm: 92, final: 88, grade: 'AA' },
  { id: '4', code: 'BIL303', name: 'Yazilim Muhendisligi', credit: 3, midterm: 75, final: 80, grade: 'BB' },
  { id: '5', code: 'BIL304', name: 'Bilgisayar Aglari', credit: 3, midterm: 88, final: 85, grade: 'BA' },
  { id: '6', code: 'BIL305', name: 'Isletim Sistemleri', credit: 3, midterm: 70, final: 75, grade: 'CB' },
  { id: '7', code: 'BIL401', name: 'Yapay Zeka', credit: 3, midterm: 95, final: 92, grade: 'AA' },
]

export interface AdvisorInfo {
  id: string
  name: string
  department: string
  available: boolean
  categories: string[]
  academicTitle?: string
  areasOfExpertise?: string
  researchInterests?: string
  skills?: string[] | string
}

export const advisors: AdvisorInfo[] = [
  {
    id: '2',
    name: 'Dr. Ahmet Yilmaz',
    department: 'Computer Engineering',
    available: true,
    categories: ['TUBITAK', 'Teknofest'],
    academicTitle: 'Assoc. Prof. Dr.',
    areasOfExpertise: 'Computer Engineering, Artificial Intelligence',
    researchInterests: 'Machine learning, distributed systems, NLP',
    skills: 'Python, TensorFlow, Kubernetes, Research Methodology',
  },
  {
    id: '7',
    name: 'Dr. Fatma Celik',
    department: 'Software Engineering',
    available: true,
    categories: ['Graduation Project', 'TUBITAK'],
    academicTitle: 'Asst. Prof. Dr.',
    areasOfExpertise: 'Software Engineering, Human-Computer Interaction',
    researchInterests: 'Software architecture, usability engineering, agile methods',
    skills: 'Java, TypeScript, UX Research, Clean Architecture',
  },
  {
    id: '8',
    name: 'Dr. Mustafa Sahin',
    department: 'Computer Engineering',
    available: false,
    categories: ['Teknofest'],
    academicTitle: 'Prof. Dr.',
    areasOfExpertise: 'Robotics, Control Systems',
    researchInterests: 'Autonomous systems, embedded robotics, sensor fusion',
    skills: 'C/C++, ROS, MATLAB, Embedded Systems',
  },
]

export const studentProfiles: StudentProfile[] = [
  {
    id: '5',
    name: 'Ali Ozturk',
    email: 'ali.ozturk@st.uskudar.edu.tr',
    department: 'Computer Engineering',
    year: 4,
    gpa: 3.45,
    projectCount: 2,
    completedProjects: 1,
    interests: 'AI, Computer Vision, Robotics',
    skills: ['Python', 'TensorFlow', 'OpenCV', 'ROS'],
    biography:
      'Senior CE student passionate about computer vision and autonomous systems. Looking for meaningful graduation projects.',
    githubLink: 'https://github.com/aliozturk',
    linkedinLink: 'https://linkedin.com/in/aliozturk',
  },
  {
    id: '6',
    name: 'Zeynep Arslan',
    email: 'zeynep.arslan@st.uskudar.edu.tr',
    department: 'Software Engineering',
    year: 3,
    gpa: 3.72,
    projectCount: 1,
    completedProjects: 0,
    interests: 'Web Development, UX/UI, Cloud',
    skills: ['TypeScript', 'React', 'Next.js', 'Figma', 'AWS'],
    biography:
      'SE junior who loves building accessible, well-designed web apps. Interested in cloud and modern frontend stacks.',
    githubLink: 'https://github.com/zeyneparslan',
    linkedinLink: 'https://linkedin.com/in/zeyneparslan',
  },
  {
    id: '9',
    name: 'Emre Kaya',
    email: 'emre.kaya@st.uskudar.edu.tr',
    department: 'Electrical Engineering',
    year: 4,
    gpa: 3.20,
    projectCount: 3,
    completedProjects: 2,
    interests: 'Embedded Systems, IoT, Signal Processing',
    skills: ['C', 'C++', 'STM32', 'MATLAB', 'Kicad'],
    biography: 'Hardware-leaning EE student with an interest in low-power IoT devices and embedded firmware.',
  },
  {
    id: '10',
    name: 'Ayse Demir',
    email: 'ayse.demir@st.uskudar.edu.tr',
    department: 'Data Science',
    year: 3,
    gpa: 3.88,
    projectCount: 2,
    completedProjects: 1,
    interests: 'Machine Learning, NLP, Data Visualization',
    skills: ['Python', 'Pandas', 'PyTorch', 'Tableau', 'SQL'],
    biography: 'Data science student focused on NLP and applied ML for social good projects.',
    githubLink: 'https://github.com/aysedemir',
  },
]
