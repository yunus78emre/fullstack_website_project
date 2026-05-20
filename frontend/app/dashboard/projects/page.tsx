'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Plus, Send, DollarSign, Users2, Filter, Eye, Loader2, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  DialogTrigger,
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
import { useAuth } from '@/lib/auth-context'
import { student as studentApi, advisor as advisorApi, admin as adminApi } from '@/lib/api-client'

export default function ProjectsPage() {
  const { user } = useAuth()
  const isStudent = user?.role === 'student'
  const isAdvisor = user?.role === 'advisor'

  const [projects, setProjects] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [requestAdvisorOpen, setRequestAdvisorOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>('')
  const [advisorDetailOpen, setAdvisorDetailOpen] = useState(false)
  const [viewProjectDetail, setViewProjectDetail] = useState<any | null>(null)

  const [editProjectOpen, setEditProjectOpen] = useState(false)
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false)
  const [projectToEdit, setProjectToEdit] = useState<any | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<any | null>(null)

  const [availableAdvisors, setAvailableAdvisors] = useState<any[]>([])

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [cats, myProjs] = await Promise.all([
        adminApi.getCategories(),
        isStudent ? studentApi.getMyProjects() : isAdvisor ? advisorApi.getMyProjects() : Promise.resolve([]),
      ])
      setCategories(cats)
      setProjects(myProjs)
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoading(false)
    }
  }, [user, isStudent, isAdvisor])

  useEffect(() => {
    loadData()
  }, [loadData])

  const selectedCategory = useMemo(
    () => categories.find((c) => String(c.id) === selectedCategoryId),
    [categories, selectedCategoryId],
  )

  const filteredProjects = categoryFilter === 'all'
    ? projects
    : projects.filter(p => String(p.category?.id) === categoryFilter)

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !isStudent) return

    const formData = new FormData(e.currentTarget)
    const catId = parseInt(formData.get('category') as string, 10)

    try {
      await studentApi.createProject({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        categoryId: catId,
      })
      setCreateProjectOpen(false)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to create project.')
    }
  }

  const handleEditProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!projectToEdit) return

    const formData = new FormData(e.currentTarget)
    const catId = parseInt(formData.get('category') as string, 10)

    try {
      await studentApi.updateProject(projectToEdit.projectId, {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        categoryId: catId,
      })
      setEditProjectOpen(false)
      setProjectToEdit(null)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update project.')
    }
  }

  const handleDeleteProject = async () => {
    if (!projectToDelete) return
    try {
      await studentApi.deleteProject(projectToDelete.projectId)
      setDeleteProjectOpen(false)
      setProjectToDelete(null)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete project.')
    }
  }

  const loadAdvisors = async (projectId: number) => {
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
  }

  const handleRequestAdvisor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedProject || !user || !isStudent) return

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isStudent ? 'My Projects' : isAdvisor ? 'Advised Projects' : 'All Projects'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isStudent ? 'Manage your projects' : isAdvisor ? 'Projects you are advising' : 'All projects in the system'}
          </p>
        </div>
        <div className="flex items-center gap-4">
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
          {isStudent && (
            <Dialog
              open={createProjectOpen}
              onOpenChange={(open) => {
                setCreateProjectOpen(open)
                if (open && categories.length > 0) {
                  setSelectedCategoryId(String(categories[0].id))
                } else {
                  setSelectedCategoryId('')
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>Start a new project</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProject}>
                  <FieldGroup className="py-4">
                    <Field>
                      <FieldLabel htmlFor="title">Project Title</FieldLabel>
                      <Input id="title" name="title" placeholder="Enter project title" required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="description">Description</FieldLabel>
                      <Textarea id="description" name="description" placeholder="Describe your project" rows={4} required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="category">Category</FieldLabel>
                      <Select
                        name="category"
                        value={selectedCategoryId}
                        onValueChange={setSelectedCategoryId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedCategory && (
                        <div className="mt-2 rounded-md border bg-muted/40 p-3 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Category criteria (set by admin)
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Budget</p>
                                <p className="font-medium">
                                  {selectedCategory.defaultBudget != null
                                    ? `${selectedCategory.defaultBudget.toLocaleString()} TL`
                                    : '—'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users2 className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Team Size</p>
                                <p className="font-medium">
                                  {selectedCategory.defaultTeamSize != null ? selectedCategory.defaultTeamSize : '—'}
                                </p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Advisor Required</p>
                              <p className="font-medium">
                                {selectedCategory.advisorRequired ? 'Yes' : 'No'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </Field>
                  </FieldGroup>
                  <DialogFooter>
                    <Button type="submit">Create Project</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent className="[&_[data-slot=table-container]]:overflow-visible [&_[data-slot=table-cell]]:whitespace-normal [&_[data-slot=table-head]]:whitespace-normal">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[28%]">Project</TableHead>
                <TableHead className="w-[14%]">Category</TableHead>
                {!isStudent && <TableHead className="w-[14%]">Student</TableHead>}
                {!isAdvisor && <TableHead className="w-[14%]">Advisor</TableHead>}
                <TableHead className="w-[12%]">Status</TableHead>
                <TableHead className="w-[12%]">Created</TableHead>
                {isStudent && <TableHead className="w-[16%] text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow
                  key={project.projectId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setViewProjectDetail(project)}
                >
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium break-words">{project.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 break-words">{project.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.category ? <CategoryLabel name={project.category.name} color={project.category.color} /> : '—'}
                  </TableCell>
                  {!isStudent && <TableCell className="break-words">{project.owner?.fullName}</TableCell>}
                  {!isAdvisor && <TableCell className="text-muted-foreground break-words">{project.advisor?.fullName || '-'}</TableCell>}
                  <TableCell>{getStatusBadge(project.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(project.createdAt).toLocaleDateString()}</TableCell>
                  {isStudent && (
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                      {!project.advisor && project.status === 'OPEN' && String(project.owner?.userId) === String(user?.id) && (
                        <Dialog open={requestAdvisorOpen && selectedProject?.projectId === project.projectId} onOpenChange={(open) => {
                          setRequestAdvisorOpen(open)
                          if (open) {
                            setSelectedProject(project)
                            loadAdvisors(project.projectId)
                          } else {
                            setSelectedProject(null)
                            setSelectedAdvisorId('')
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedProject(project)
                                loadAdvisors(project.projectId)
                              }}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Request Advisor
                            </Button>
                          </DialogTrigger>
                          <DialogContent onClick={(e) => e.stopPropagation()}>
                            <DialogHeader>
                              <DialogTitle>Request Advisor</DialogTitle>
                              <DialogDescription>Select an advisor for &quot;{project.title}&quot;</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleRequestAdvisor}>
                              <FieldGroup className="py-4">
                                <Field>
                                  <FieldLabel htmlFor="advisor">Available Advisors</FieldLabel>
                                  <div className="flex items-center gap-2">
                                    <Select
                                      name="advisor"
                                      value={selectedAdvisorId}
                                      onValueChange={setSelectedAdvisorId}
                                    >
                                      <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select advisor" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableAdvisors.map((advisor) => (
                                          <SelectItem key={advisor.advisorProfileId} value={String(advisor.advisorProfileId)}>
                                            {advisor.fullName} - {advisor.department}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {selectedAdvisor && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setAdvisorDetailOpen(true)
                                        }}
                                      >
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
                      )}
                      
                      {String(project.owner?.userId) === String(user?.id) && (
                        <>
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setProjectToEdit(project); setEditProjectOpen(true); }}>
                            <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setProjectToDelete(project); setDeleteProjectOpen(true); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filteredProjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isStudent ? 6 : 5} className="text-center text-muted-foreground py-8">
                    No projects found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{viewProjectDetail && new Date(viewProjectDetail.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Advisor Detail Dialog */}
      <Dialog open={advisorDetailOpen} onOpenChange={setAdvisorDetailOpen}>
        <DialogContent className="max-w-lg" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{selectedAdvisor?.fullName}</DialogTitle>
            <DialogDescription>
              {selectedAdvisor?.department}
            </DialogDescription>
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

      {/* Edit Project Dialog */}
      <Dialog open={editProjectOpen} onOpenChange={setEditProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update your project details.</DialogDescription>
          </DialogHeader>
          {projectToEdit && (
            <form onSubmit={handleEditProject}>
              <FieldGroup className="py-4">
                <Field>
                  <FieldLabel htmlFor="edit-title">Project Title</FieldLabel>
                  <Input id="edit-title" name="title" defaultValue={projectToEdit.title} required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-description">Description</FieldLabel>
                  <Textarea id="edit-description" name="description" defaultValue={projectToEdit.description} rows={4} required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-category">Category</FieldLabel>
                  <Select name="category" defaultValue={String(projectToEdit.category?.id)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditProjectOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{projectToDelete?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => setDeleteProjectOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDeleteProject}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
