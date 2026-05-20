'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { FolderKanban, FileText, Bell, Send, DollarSign, Users2, Eye, Loader2, Mail, GraduationCap, Github, Linkedin, BookOpen } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { CategoryLabel } from '@/components/category-label'
import type { User, Announcement } from '@/lib/types'
import { student as studentApi } from '@/lib/api-client'

interface StudentDashboardProps {
  user: User
}

function normalizeSkills(input?: string[] | string): string[] {
  if (!input) return []
  if (Array.isArray(input)) return input.filter((s) => s && s.trim().length > 0)
  return input
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

// API response types
interface ApiProject {
  projectId: number
  title: string
  description: string
  teamSize: number
  status: string
  createdAt: string
  updatedAt?: string
  category?: { id: number; name: string; description?: string; defaultTeamSize?: number; defaultBudget?: number; advisorRequired?: boolean; color?: string }
  owner?: { profileId: number; userId: number; fullName: string; email: string; department?: string; year?: number }
  advisor?: { profileId: number; userId: number; fullName: string; email: string; department?: string } | null
  members?: any[]
  totalMemberCount?: number
}

interface ApiFeedItem {
  announcementType: string
  itemId: number
  title: string
  description: string
  createdAt: string
  publisher?: { userId: number; fullName: string }
  category?: { id: number; name: string; color?: string }
  advisor?: any
  project?: any
}

interface ApiAdvisor {
  advisorProfileId: number
  userId: number
  fullName: string
  email: string
  department?: string
  academicTitle?: string
  expertise?: string
  researchInterests?: string
  availableForAdvising: boolean
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  const [myProjects, setMyProjects] = useState<ApiProject[]>([])
  const [feedItems, setFeedItems] = useState<ApiFeedItem[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [requestAdvisorOpen, setRequestAdvisorOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ApiProject | null>(null)
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>('')
  const [advisorDetailOpen, setAdvisorDetailOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<ApiFeedItem | null>(null)
  const [viewProjectDetail, setViewProjectDetail] = useState<ApiProject | null>(null)

  // Available advisors for request
  const [availableAdvisors, setAvailableAdvisors] = useState<ApiAdvisor[]>([])

  // ─── Data loading ───────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [projects, feed] = await Promise.all([
        studentApi.getMyProjects(),
        studentApi.getAnnouncementsFeed(),
      ])
      setMyProjects(projects)
      setFeedItems(feed.items || [])
    } catch (err) {
      console.error('Failed to load student data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ─── Request advisor ────────────────────────────────────────────────────────
  const loadAdvisors = useCallback(async (projectId: number) => {
    try {
      const result = await studentApi.searchAdvisors({ projectId: String(projectId), availableForAdvising: 'true' })
      setAvailableAdvisors(result.items || [])
      if (result.items?.length > 0) {
        setSelectedAdvisorId(String(result.items[0].advisorProfileId))
      }
    } catch (err) {
      console.error('Failed to load advisors:', err)
      setAvailableAdvisors([])
    }
  }, [])

  const handleRequestAdvisor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedProject) return

    try {
      await studentApi.sendAdvisorRequest({
        projectId: selectedProject.projectId,
        advisorId: parseInt(selectedAdvisorId, 10),
      })
      setRequestAdvisorOpen(false)
      setSelectedProject(null)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to send advisor request.')
    }
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const stats = [
    { label: 'My Projects', value: myProjects.length, icon: FolderKanban, color: 'bg-primary/10 text-primary' },
    { label: 'Pending', value: myProjects.filter(p => p.status === 'OPEN').length, icon: FileText, color: 'bg-accent/10 text-accent' },
  ]

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      'OPEN': { variant: 'secondary', label: 'Open' },
      'IN_PROGRESS': { variant: 'default', label: 'In Progress' },
      'COMPLETED': { variant: 'outline', label: 'Completed' },
      'CANCELLED': { variant: 'destructive', label: 'Cancelled' },
    }
    const { variant, label } = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={variant}>{label}</Badge>
  }

  const selectedAdvisor = availableAdvisors.find((a) => String(a.advisorProfileId) === selectedAdvisorId)
  const userSkills = useMemo(() => normalizeSkills(user.skills), [user.skills])

  // ─── Announcements (only direct announcements from feed) ────────────────────
  const announcements = feedItems.filter(f => f.announcementType === 'DirectAnnouncement')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 ring-2 ring-primary/25">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {user.email}
                    </span>
                    {user.department && (
                      <Badge variant="outline" className="font-normal">
                        {user.department}
                      </Badge>
                    )}
                    {user.year && (
                      <Badge variant="secondary" className="inline-flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5" />
                        Year {user.year}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="w-fit">Student Profile</Badge>
            </div>
            {(user.biography || user.interests || user.githubLink || user.linkedinLink) && (
              <div className="mt-4 border-t pt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {user.biography && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Biography</p>
                      <p className="text-sm text-foreground">{user.biography}</p>
                    </div>
                  )}
                  {user.interests && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5"/> Interests</p>
                      <p className="text-sm text-foreground">{user.interests}</p>
                    </div>
                  )}
                  {(user.githubLink || user.linkedinLink) && (
                    <div className="md:col-span-2 flex items-center gap-4 mt-2">
                      {user.githubLink && (
                        <a href={user.githubLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                          <Github className="h-4 w-4" />
                          GitHub
                        </a>
                      )}
                      {user.linkedinLink && (
                        <a href={user.linkedinLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {userSkills.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {userSkills.map((skill, idx) => (
                    <Badge key={`${skill}-${idx}`} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              My Projects
            </CardTitle>
            <CardDescription>Your active and past projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myProjects.map((project) => (
                <div
                  key={project.projectId}
                  className="p-4 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setViewProjectDetail(project)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{project.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {project.category && <CategoryLabel name={project.category.name} color={project.category.color} />}
                        {getStatusBadge(project.status)}
                      </div>
                      {project.advisor && (
                        <p className="text-xs text-muted-foreground mt-2">Advisor: {project.advisor.fullName}</p>
                      )}
                    </div>
                    {!project.advisor && project.status === 'OPEN' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedProject(project)
                          loadAdvisors(project.projectId)
                          setRequestAdvisorOpen(true)
                        }}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Request Advisor
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {myProjects.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No projects yet. Create your first project!</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Announcements
            </CardTitle>
            <CardDescription>Latest announcements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.slice(0, 5).map((item) => (
                <div
                  key={item.itemId}
                  className="p-4 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedAnnouncement(item)}
                >
                  {item.category && (
                    <div className="flex items-start justify-between mb-2">
                      <CategoryLabel name={item.category.name} color={item.category.color} variant="solid" />
                    </div>
                  )}
                  <h4 className="font-medium text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span>Published: {new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No announcements yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Advisor Dialog */}
      <Dialog open={requestAdvisorOpen} onOpenChange={(open) => {
        setRequestAdvisorOpen(open)
        if (!open) {
          setSelectedProject(null)
          setSelectedAdvisorId('')
        }
      }}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Request Advisor</DialogTitle>
            <DialogDescription>
              Select an available advisor for &quot;{selectedProject?.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequestAdvisor}>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="advisor">Available Advisors</FieldLabel>
                <div className="flex items-center gap-2">
                  <Select name="advisor" value={selectedAdvisorId} onValueChange={setSelectedAdvisorId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select advisor" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAdvisors.map((adv) => (
                        <SelectItem key={adv.advisorProfileId} value={String(adv.advisorProfileId)}>
                          <div className="flex flex-col">
                            <span>{adv.fullName}</span>
                            <span className="text-xs text-muted-foreground">{adv.department}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedAdvisor && (
                    <Button type="button" variant="outline" size="icon"
                      onClick={(e) => { e.stopPropagation(); setAdvisorDetailOpen(true) }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="submit" disabled={!selectedAdvisorId}>Send Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Advisor Detail Dialog */}
      <Dialog open={advisorDetailOpen} onOpenChange={setAdvisorDetailOpen}>
        <DialogContent className="max-w-lg" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{selectedAdvisor?.fullName}</DialogTitle>
            <DialogDescription>{selectedAdvisor?.department}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Academic Title</p>
              <p className="text-foreground">{selectedAdvisor?.academicTitle || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Areas of Expertise</p>
              <p className="text-foreground">{selectedAdvisor?.expertise || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Research Interests</p>
              <p className="text-foreground">{selectedAdvisor?.researchInterests || '—'}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Announcement Detail Dialog */}
      <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedAnnouncement?.title}</DialogTitle>
            <DialogDescription asChild>
              <div className="mt-2">
                {selectedAnnouncement?.category && (
                  <CategoryLabel name={selectedAnnouncement.category.name} color={selectedAnnouncement.category.color} variant="solid" />
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Detail</h4>
              <p className="text-foreground whitespace-pre-wrap">{selectedAnnouncement?.description}</p>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground border-t pt-4">
              <span>Published: {selectedAnnouncement && new Date(selectedAnnouncement.createdAt).toLocaleDateString()}</span>
              {selectedAnnouncement?.publisher && <span>By: {selectedAnnouncement.publisher.fullName}</span>}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Detail Dialog */}
      <Dialog open={!!viewProjectDetail} onOpenChange={() => setViewProjectDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewProjectDetail?.title}</DialogTitle>
            <DialogDescription>
              {viewProjectDetail?.category && <CategoryLabel name={viewProjectDetail.category.name} color={viewProjectDetail.category.color} />}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
              <p className="text-foreground">{viewProjectDetail?.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium">
                    {viewProjectDetail?.category?.defaultBudget?.toLocaleString() || '-'} TL
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Team Size</p>
                  <p className="font-medium">{viewProjectDetail?.teamSize || '-'} members</p>
                </div>
              </div>
            </div>
            {viewProjectDetail?.members && viewProjectDetail.members.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Team Members</h4>
                <div className="flex flex-wrap gap-2">
                  {viewProjectDetail.members.map((member: any, i: number) => (
                    <Badge key={i} variant="outline">{member.fullName}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-4 text-sm text-muted-foreground border-t pt-4">
              <span>Status: {viewProjectDetail?.status}</span>
              <span>Created: {viewProjectDetail && new Date(viewProjectDetail.createdAt).toLocaleDateString()}</span>
            </div>
            {viewProjectDetail?.advisor && (
              <p className="text-sm">Advisor: <span className="font-medium">{viewProjectDetail.advisor.fullName}</span></p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
