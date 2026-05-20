'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, Filter, DollarSign, Users2, Send, CheckCircle2, Loader2, UserPlus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CategoryLabel } from '@/components/category-label'
import { useAuth } from '@/lib/auth-context'
import { student as studentApi, advisor as advisorApi, admin as adminApi } from '@/lib/api-client'

export default function SearchProjectsPage() {
  const { user } = useAuth()
  const isStudent = user?.role === 'student'
  const isAdvisor = user?.role === 'advisor'

  const [categories, setCategories] = useState<any[]>([])
  const [allProjects, setAllProjects] = useState<any[]>([])
  const [allAdvisors, setAllAdvisors] = useState<any[]>([])
  const [myOwnedProjects, setMyOwnedProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchMode, setSearchMode] = useState<'projects' | 'advisors'>('projects')

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [viewProjectDetail, setViewProjectDetail] = useState<any | null>(null)
  
  const [sendMessage, setSendMessage] = useState('')
  const [sendingOpen, setSendingOpen] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [justSentProjectId, setJustSentProjectId] = useState<number | null>(null)
  const [advisorSearchQuery, setAdvisorSearchQuery] = useState('')
  const [advisorProjectId, setAdvisorProjectId] = useState<string>('')
  const [selectedAdvisor, setSelectedAdvisor] = useState<any | null>(null)
  const [advisorSendingOpen, setAdvisorSendingOpen] = useState(false)
  const [advisorSendMessage, setAdvisorSendMessage] = useState('')
  const [advisorSendError, setAdvisorSendError] = useState<string | null>(null)
  const [justSentAdvisorId, setJustSentAdvisorId] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const cats = await adminApi.getCategories()
      setCategories(cats)

      let res
      if (isStudent) {
        const [projectsRes, advisorsRes, myProjectsRes] = await Promise.all([
          studentApi.searchProjects(),
          studentApi.searchAdvisors({ availableForAdvising: 'true' }),
          studentApi.getMyProjects(),
        ])
        res = projectsRes
        setAllAdvisors(advisorsRes.items || [])
        setMyOwnedProjects((myProjectsRes || []).filter((p: any) => p.owner?.userId === user.id))
      } else if (isAdvisor) {
        res = await advisorApi.searchProjects()
      } else {
        res = { items: [] }
      }
      setAllProjects(res.items || [])
    } catch (err) {
      console.error('Failed to load search data:', err)
    } finally {
      setLoading(false)
    }
  }, [user, isStudent, isAdvisor])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredProjects = useMemo(() => {
    return allProjects.filter(project => {
      const matchesCategory = categoryFilter === 'all' || String(project.category?.id) === categoryFilter
      const q = searchQuery.toLowerCase()
      const matchesSearch = q === '' || 
        project.title?.toLowerCase().includes(q) ||
        project.description?.toLowerCase().includes(q) ||
        project.owner?.fullName?.toLowerCase().includes(q)
      
      return matchesCategory && matchesSearch
    })
  }, [allProjects, categoryFilter, searchQuery])

  const filteredAdvisors = useMemo(() => {
    const q = advisorSearchQuery.toLowerCase()
    return allAdvisors.filter((advisor) => {
      if (!q) return true
      return (
        advisor.fullName?.toLowerCase().includes(q) ||
        advisor.department?.toLowerCase().includes(q) ||
        advisor.academicTitle?.toLowerCase().includes(q) ||
        advisor.expertise?.toLowerCase().includes(q)
      )
    })
  }, [allAdvisors, advisorSearchQuery])

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

  const isAdvisorNeeded = (project: any) => {
    return Boolean(project.category?.advisorRequired) && !project.advisor
  }

  const handleSendJoinRequest = async () => {
    if (!user || !viewProjectDetail || !isStudent) return
    
    try {
      await studentApi.sendJoinRequest({
        projectId: viewProjectDetail.projectId,
        message: sendMessage.trim() || undefined,
      })
      
      setSendingOpen(false)
      setSendMessage('')
      setSendError(null)
      setJustSentProjectId(viewProjectDetail.projectId)
    } catch (err: any) {
      setSendError(err.message || 'Failed to send request.')
    }
  }

  const handleSendAdvisorRequest = async () => {
    if (!selectedAdvisor || !advisorProjectId || !isStudent) return

    try {
      await studentApi.sendAdvisorRequest({
        projectId: Number(advisorProjectId),
        advisorId: selectedAdvisor.advisorProfileId,
        message: advisorSendMessage.trim() || undefined,
      })
      setAdvisorSendingOpen(false)
      setAdvisorSendMessage('')
      setAdvisorSendError(null)
      setAdvisorProjectId('')
      setJustSentAdvisorId(selectedAdvisor.advisorProfileId)
    } catch (err: any) {
      setAdvisorSendError(err.message || 'Failed to send advisor request.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading projects...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Search</h1>
        <p className="text-muted-foreground mt-1">Search projects and advisors from one place</p>
      </div>

      {isStudent && (
        <div className="inline-flex rounded-lg border bg-background p-1">
          <Button
            type="button"
            variant={searchMode === 'projects' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSearchMode('projects')}
          >
            Projects
          </Button>
          <Button
            type="button"
            variant={searchMode === 'advisors' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSearchMode('advisors')}
          >
            Advisors
          </Button>
        </div>
      )}

      {/* Search and Filter */}
      <Card className={searchMode === 'advisors' ? 'hidden' : ''}>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by project name, description, or student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advisor Search (Student only) */}
      {isStudent && searchMode === 'advisors' && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search advisor by name, title, department, expertise..."
                  value={advisorSearchQuery}
                  onChange={(e) => setAdvisorSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Advisors</CardTitle>
              <CardDescription>
                {filteredAdvisors.length} advisor{filteredAdvisors.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAdvisors.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No advisors found matching your criteria</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredAdvisors.map((advisor) => (
                    <div key={advisor.advisorProfileId} className="rounded-lg border bg-card p-4">
                      <h3 className="font-semibold text-foreground">{advisor.fullName}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{advisor.academicTitle || 'Advisor'}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{advisor.department || '—'}</p>
                      {advisor.expertise ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{advisor.expertise}</p>
                      ) : null}
                      <div className="mt-3">
                        {justSentAdvisorId === advisor.advisorProfileId ? (
                          <Button variant="outline" disabled className="w-full gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Request sent
                          </Button>
                        ) : (
                          <Button
                            className="w-full gap-2"
                            onClick={() => {
                              setSelectedAdvisor(advisor)
                              setAdvisorSendMessage('')
                              setAdvisorSendError(null)
                              setAdvisorProjectId('')
                              setAdvisorSendingOpen(true)
                            }}
                          >
                            <UserPlus className="h-4 w-4" />
                            Send Advisor Request
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Results */}
      <Card className={searchMode === 'advisors' ? 'hidden' : ''}>
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
          <CardDescription>
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No projects found matching your criteria</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <div
                  key={project.projectId}
                  className="p-4 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setViewProjectDetail(project)}
                >
                  <div className="flex items-start justify-between mb-2">
                    {project.category ? <CategoryLabel name={project.category.name} color={project.category.color} /> : <span />}
                    <div className="flex items-center gap-2">
                      {isAdvisorNeeded(project) ? <Badge variant="destructive">Advisor Needed</Badge> : null}
                      {getStatusBadge(project.status)}
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{project.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {project.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>By: {project.owner?.fullName}</span>
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                  {project.advisor && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Advisor: {project.advisor.fullName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Detail Dialog */}
      <Dialog open={!!viewProjectDetail} onOpenChange={(o) => {
        if (!o) {
          setViewProjectDetail(null)
          setJustSentProjectId(null)
          setSendError(null)
        }
      }}>
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
                  <p className="font-medium">{viewProjectDetail?.category?.defaultBudget?.toLocaleString() || '-'} TL</p>
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
            <div className="flex flex-col gap-2 text-sm border-t pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Student:</span>
                <span className="font-medium">{viewProjectDetail?.owner?.fullName}</span>
              </div>
              {viewProjectDetail?.advisor && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Advisor:</span>
                  <span className="font-medium">{viewProjectDetail.advisor.fullName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                {viewProjectDetail && getStatusBadge(viewProjectDetail.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{viewProjectDetail && new Date(viewProjectDetail.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {viewProjectDetail && isStudent && viewProjectDetail.owner?.userId !== user?.id && (
              <div className="flex items-center justify-end pt-2">
                {justSentProjectId === viewProjectDetail.projectId || viewProjectDetail.alreadyRequested ? (
                  <Button variant="outline" disabled className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Request sent
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setSendMessage('')
                      setSendError(null)
                      setSendingOpen(true)
                    }}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send Request
                  </Button>
                )}
              </div>
            )}
            
            {viewProjectDetail && isAdvisor && (
              <div className="flex items-center justify-end pt-2">
                <Button variant="outline" disabled className="gap-2">
                  To advise this project, use Request Advisor action in My Projects
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Request Dialog */}
      <Dialog open={sendingOpen} onOpenChange={setSendingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send a join request</DialogTitle>
            <DialogDescription>
              Your request will be sent to{' '}
              <span className="font-medium text-foreground">
                {viewProjectDetail?.owner?.fullName}
              </span>{' '}
              for the project &quot;{viewProjectDetail?.title}&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium text-foreground">Message (optional)</label>
            <Textarea
              rows={4}
              placeholder="Tell the project owner why you'd like to join..."
              value={sendMessage}
              onChange={(e) => setSendMessage(e.target.value)}
            />
            {sendError && <p className="text-sm text-destructive">{sendError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendingOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendJoinRequest} className="gap-2">
              <Send className="h-4 w-4" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Advisor Request Dialog */}
      <Dialog open={advisorSendingOpen} onOpenChange={setAdvisorSendingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send advisor request</DialogTitle>
            <DialogDescription>
              Send a request to{' '}
              <span className="font-medium text-foreground">
                {selectedAdvisor?.fullName}
              </span>{' '}
              for one of your projects.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Select your project</label>
              <Select value={advisorProjectId} onValueChange={setAdvisorProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose project" />
                </SelectTrigger>
                <SelectContent>
                  {myOwnedProjects.map((project) => (
                    <SelectItem key={project.projectId} value={String(project.projectId)}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Message (optional)</label>
              <Textarea
                rows={3}
                placeholder="Tell the advisor about your project briefly..."
                value={advisorSendMessage}
                onChange={(e) => setAdvisorSendMessage(e.target.value)}
              />
            </div>
            {advisorSendError ? <p className="text-sm text-destructive">{advisorSendError}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdvisorSendingOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendAdvisorRequest} disabled={!advisorProjectId} className="gap-2">
              <Send className="h-4 w-4" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
