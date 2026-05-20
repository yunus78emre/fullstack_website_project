'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { FolderKanban, Users, CheckCircle, XCircle, Bell, DollarSign, Users2, Loader2, Mail, BriefcaseBusiness, Github, Linkedin, BookOpen } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CategoryLabel } from '@/components/category-label'
import { getCategoryColorProps, normalizeHexColor } from '@/lib/category-colors'
import type { User } from '@/lib/types'
import { advisor as advisorApi } from '@/lib/api-client'

interface AdvisorDashboardProps {
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
interface ApiAdvisorProject {
  projectId: number
  title: string
  description: string
  teamSize: number
  status: string
  createdAt: string
  updatedAt?: string
  category?: { id: number; name: string; color?: string }
  owner?: { profileId: number; userId: number; fullName: string; email: string; department?: string }
  members?: any[]
}

interface ApiIncomingRequest {
  advisorRequestId?: number
  requestId?: number
  message: string
  status: string
  createdAt: string
  project?: { id: number; title: string; description?: string; status?: string; teamSize?: number; category?: { id: number; name: string; color?: string } }
  senderStudent?: { profileId: number; userId: number; fullName: string; email: string; department?: string }
}

interface ApiFeedItem {
  announcementType: string
  itemId: number
  title: string
  description: string
  createdAt: string
  publisher?: { userId: number; fullName: string }
  category?: { id: number; name: string; color?: string }
}

interface ApiAdvisorAvailability {
  categoryId: number
  categoryName: string
  categoryColor?: string | null
  isSelected: boolean
  advisorId: number
  currentAssignedProjectCount: number
  maxAllowedProjectCount?: number | null
  availabilityText: string
  isAvailable: boolean
}

export function AdvisorDashboard({ user }: AdvisorDashboardProps) {
  const [myProjects, setMyProjects] = useState<ApiAdvisorProject[]>([])
  const [incomingRequests, setIncomingRequests] = useState<ApiIncomingRequest[]>([])
  const [feedItems, setFeedItems] = useState<ApiFeedItem[]>([])
  const [availabilityItems, setAvailabilityItems] = useState<ApiAdvisorAvailability[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [savingAvailability, setSavingAvailability] = useState(false)
  const [availabilityMessage, setAvailabilityMessage] = useState('')
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<ApiFeedItem | null>(null)
  const [selectedProject, setSelectedProject] = useState<ApiAdvisorProject | null>(null)

  // ─── Data loading ───────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [projects, requests, feed, availability] = await Promise.all([
        advisorApi.getMyProjects(),
        advisorApi.getIncomingRequests(),
        advisorApi.getAnnouncementsFeed(),
        advisorApi.getAvailability(),
      ])
      setMyProjects(Array.isArray(projects) ? projects : [])
      setIncomingRequests(Array.isArray(requests) ? requests : [])
      setFeedItems(Array.isArray(feed?.items) ? feed.items : [])
      const normalizedAvailability = Array.isArray(availability) ? availability : []
      setAvailabilityItems(normalizedAvailability)
      setSelectedCategoryIds(
        normalizedAvailability
          .filter((item) => item.isSelected)
          .map((item) => item.categoryId),
      )
    } catch (err) {
      console.error('Failed to load advisor data:', err)
      setMyProjects([])
      setIncomingRequests([])
      setFeedItems([])
      setAvailabilityItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Active Projects', value: myProjects.length, icon: FolderKanban, color: 'bg-primary/10 text-primary' },
    { label: 'Pending Requests', value: incomingRequests.filter(r => r.status === 'PENDING').length, icon: Users, color: 'bg-accent/10 text-accent' },
    { label: 'Completed', value: myProjects.filter(p => p.status === 'COMPLETED').length, icon: CheckCircle, color: 'bg-chart-2/10 text-chart-2' },
  ]

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      'PENDING': { variant: 'secondary', label: 'Pending' },
      'ACCEPTED': { variant: 'default', label: 'Accepted' },
      'REJECTED': { variant: 'destructive', label: 'Rejected' },
      'OPEN': { variant: 'secondary', label: 'Open' },
      'IN_PROGRESS': { variant: 'default', label: 'In Progress' },
      'COMPLETED': { variant: 'outline', label: 'Completed' },
    }
    const { variant, label } = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={variant}>{label}</Badge>
  }

  // Direct announcements from feed
  const announcements = feedItems.filter(f => f.announcementType === 'DirectAnnouncement')
  const userSkills = useMemo(() => normalizeSkills(user.skills), [user.skills])

  const handleToggleCategory = async (categoryId: number, checked: boolean) => {
    if (savingAvailability) return
    const previousIds = selectedCategoryIds
    const nextIds = checked
      ? previousIds.includes(categoryId)
        ? previousIds
        : [...previousIds, categoryId]
      : previousIds.filter((id) => id !== categoryId)

    setSelectedCategoryIds(nextIds)
    setSavingAvailability(true)
    setAvailabilityMessage('')
    try {
      const response = await advisorApi.updateAvailability(nextIds)
      const items = Array.isArray(response?.items) ? response.items : []
      setAvailabilityItems(items)
      setSelectedCategoryIds(
        items.filter((item) => item.isSelected).map((item) => item.categoryId),
      )
      setAvailabilityMessage(response?.message || 'Availability updated.')
    } catch (err: any) {
      setSelectedCategoryIds(previousIds)
      setAvailabilityMessage(err?.message || 'Failed to update availability.')
    } finally {
      setSavingAvailability(false)
    }
  }

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
                    {user.academicTitle && (
                      <Badge variant="outline" className="font-normal">
                        {user.academicTitle}
                      </Badge>
                    )}
                    {user.department && (
                      <Badge variant="outline" className="font-normal">
                        {user.department}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="inline-flex w-fit items-center gap-1.5">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                Academic Advisor
              </Badge>
            </div>
            {(user.biography || user.areasOfExpertise || user.researchInterests || user.githubLink || user.linkedinLink) && (
              <div className="mt-4 border-t pt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {user.biography && (
                    <div className="md:col-span-2">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Biography</p>
                      <p className="text-sm text-foreground">{user.biography}</p>
                    </div>
                  )}
                  {user.areasOfExpertise && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><BriefcaseBusiness className="h-3.5 w-3.5"/> Areas of Expertise</p>
                      <p className="text-sm text-foreground">{user.areasOfExpertise}</p>
                    </div>
                  )}
                  {user.researchInterests && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5"/> Research Interests</p>
                      <p className="text-sm text-foreground">{user.researchInterests}</p>
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
      <div className="grid gap-4 md:grid-cols-3">
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

      <Card>
        <CardHeader>
          <CardTitle>Advisor Availability</CardTitle>
          <CardDescription>
          Select your preferred project categories. Students will use these to filter advisors during the selection process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {availabilityItems.map((item) => {
              const isSelected = selectedCategoryIds.includes(item.categoryId)
              const colorProps = getCategoryColorProps({
                color: item.categoryColor,
                name: item.categoryName,
              })
              return (
                <label
                  key={item.categoryId}
                  className={cn(
                    'flex w-fit items-center gap-2 py-1 text-sm transition-colors',
                    isSelected ? 'text-foreground' : 'text-muted-foreground',
                    !item.isAvailable && 'opacity-70',
                  )}
                >
                  <div className="inline-flex items-center gap-2">
                    <Switch
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        handleToggleCategory(item.categoryId, checked)
                      }}
                      disabled={savingAvailability}
                      style={{
                        backgroundColor: isSelected
                          ? (normalizeHexColor(item.categoryColor) ?? undefined)
                          : undefined,
                      }}
                      className="data-[state=checked]:bg-transparent"
                    />
                    <span
                      className={cn('h-2.5 w-2.5 rounded-full shrink-0', colorProps.className)}
                      style={colorProps.style}
                      aria-hidden
                    />
                    <span className="font-medium">{item.categoryName}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{item.availabilityText}</span>
                    {!item.isAvailable ? <span>(Full)</span> : null}
                  </div>
                </label>
              )
            })}
            {availabilityItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories found.</p>
            ) : null}
          </div>
          {availabilityMessage ? (
            <p className="mt-3 text-sm text-muted-foreground">{availabilityMessage}</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Announcements */}
        <Card className="lg:col-span-3">
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
                  {item.category ? (
                    <div className="mb-2">
                      <CategoryLabel name={item.category.name} color={item.category.color} variant="solid" />
                    </div>
                  ) : null}
                  <h4 className="font-medium text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {item.description}
                  </p>
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

      {/* Student Request */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Project Requests
          </CardTitle>
          <CardDescription>Incoming advisor requests from students</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomingRequests.map((request) => (
                <TableRow key={request.requestId}>
                  <TableCell className="font-medium">
                    {request.senderStudent?.fullName || '—'}
                  </TableCell>
                  <TableCell>{request.project?.title || '—'}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {request.message || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                </TableRow>
              ))}
              {incomingRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No requests yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Advised Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Advised Projects
          </CardTitle>
          <CardDescription>Projects you are currently advising</CardDescription>
        </CardHeader>
        <CardContent className="[&_[data-slot=table-container]]:overflow-visible [&_[data-slot=table-cell]]:whitespace-normal [&_[data-slot=table-head]]:whitespace-normal">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[32%]">Project</TableHead>
                <TableHead className="w-[20%]">Student</TableHead>
                <TableHead className="w-[18%]">Category</TableHead>
                <TableHead className="w-[15%]">Status</TableHead>
                <TableHead className="w-[15%]">Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myProjects.map((project) => (
                <TableRow
                  key={project.projectId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedProject(project)}
                >
                  <TableCell className="font-medium break-words">{project.title}</TableCell>
                  <TableCell className="break-words">{project.owner?.fullName || '—'}</TableCell>
                  <TableCell>
                    {project.category ? <CategoryLabel name={project.category.name} color={project.category.color} /> : '—'}
                  </TableCell>
                  <TableCell>{getStatusBadge(project.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {myProjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No advised projects yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title}</DialogTitle>
            <DialogDescription>
              {selectedProject?.category && <CategoryLabel name={selectedProject.category.name} color={selectedProject.category.color} />}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
              <p className="text-foreground">{selectedProject?.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Users2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Team Size</p>
                  <p className="font-medium">{selectedProject?.teamSize} members</p>
                </div>
              </div>
            </div>
            {selectedProject?.members && selectedProject.members.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Team Members</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.members.map((member: any, i: number) => (
                    <Badge key={i} variant="outline">{member.fullName || member}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-4 text-sm text-muted-foreground border-t pt-4">
              <span>Student: {selectedProject?.owner?.fullName}</span>
              <span>Started: {selectedProject && new Date(selectedProject.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
