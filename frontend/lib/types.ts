export type UserRole = 'admin' | 'advisor' | 'student'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  department?: string
  year?: number
  avatar?: string
  interests?: string
  githubLink?: string
  linkedinLink?: string
  biography?: string
  /** Advisor profile fields */
  academicTitle?: string
  areasOfExpertise?: string
  researchInterests?: string
  /** Skills. Stored as an array but legacy comma-separated strings are still accepted. */
  skills?: string[] | string
}

export interface Project {
  id: string
  title: string
  description: string
  category: string
  status: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed'
  studentId: string
  studentName: string
  advisorId?: string
  advisorName?: string
  createdAt: string
  budget?: number
  teamSize?: number
  advisorRequired?: boolean
  teamMembers?: string[]
}

export interface ProjectRequest {
  id: string
  projectId: string
  projectTitle: string
  studentId: string
  studentName: string
  advisorId: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  projectDescription?: string
  projectCategory?: string
}

/** Another student's request to join a project owned by the current student. */
export interface StudentRequest {
  id: string
  projectId: string
  projectTitle: string
  projectCategory?: string
  /** Owner of the project (the current student receiving this request). */
  ownerStudentId: string
  /** The student who is requesting to join the project. */
  requesterStudentId: string
  requesterStudentName: string
  requesterEmail?: string
  requesterDepartment?: string
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface Announcement {
  id: string
  title: string
  detail: string
  category: string
  publishDate: string
  deadline: string
  createdBy: string
}

export interface ProjectCategory {
  id: string
  name: string
  description: string
  budget?: number
  teamSize?: number
  advisorRequired?: boolean
  color: string
}

export interface ScheduleItem {
  id: string
  day: string
  time: string
  course: string
  location: string
}

export interface CourseGrade {
  id: string
  code: string
  name: string
  credit: number
  midterm?: number
  final?: number
  grade?: string
}

export interface StudentProfile {
  id: string
  name: string
  email: string
  department: string
  year: number
  gpa: number
  projectCount: number
  completedProjects: number
  interests?: string
  skills?: string[] | string
  biography?: string
  githubLink?: string
  linkedinLink?: string
}

/** Notification (fields can map 1:1 to an API). */
export interface UserNotification {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
  kind?: 'project' | 'system' | 'announcement'
  /** The related project's category (used to colorize the notification). */
  projectCategory?: string
}

export type NewUserNotificationInput = Pick<UserNotification, 'title' | 'body'> & {
  kind?: UserNotification['kind']
  projectCategory?: string
  id?: string
}
