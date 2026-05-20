'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { FolderKanban, Megaphone, TrendingUp, Plus, Minus, Eye, Pencil, Trash2, Loader2, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CategoryLabel } from '@/components/category-label'
import type { User } from '@/lib/types'
import { admin as adminApi } from '@/lib/api-client'
import {
  CATEGORY_COLOR_PALETTE,
  getCategoryColorProps,
  normalizeHexColor,
} from '@/lib/category-colors'

interface AdminDashboardProps {
  user: User
}

// Backend category shape
interface ApiCategory {
  id: number
  name: string
  description: string
  defaultTeamSize?: number
  defaultBudget?: number
  advisorRequired: boolean
  maxProjectsPerAdvisor?: number
  eventDate?: string
  color?: string
}

// Backend announcement shape
interface ApiAnnouncement {
  id: number
  title: string
  description: string
  createdAt: string
  publisher?: { userId: number; fullName: string; email: string }
  category?: { id: number; name: string; color?: string }
}


export function AdminDashboard({ user }: AdminDashboardProps) {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [announcementsList, setAnnouncementsList] = useState<ApiAnnouncement[]>([])
  const [loading, setLoading] = useState(true)

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ApiCategory | null>(null)
  const [editingAnnouncement, setEditingAnnouncement] = useState<ApiAnnouncement | null>(null)
  const [showCategoryBudgetField, setShowCategoryBudgetField] = useState(false)
  const [showCategoryTeamSizeField, setShowCategoryTeamSizeField] = useState(false)
  const [showCategoryMaxProjectsField, setShowCategoryMaxProjectsField] = useState(false)
  const [advisorRequired, setAdvisorRequired] = useState(false)
  const [categorySubmitError, setCategorySubmitError] = useState('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [customColorOpen, setCustomColorOpen] = useState(false)

  // ─── Data loading ───────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [cats, anns] = await Promise.all([
        adminApi.getCategories(),
        adminApi.getAnnouncements(),
      ])
      setCategories(cats)
      setAnnouncementsList(anns)
    } catch (err) {
      console.error('Failed to load admin data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Total Categories', value: categories.length, icon: FolderKanban, color: 'bg-primary/10 text-primary' },
    { label: 'Active Announcements', value: announcementsList.length, icon: Megaphone, color: 'bg-accent/10 text-accent' },
    { label: 'Projects This Month', value: '—', icon: TrendingUp, color: 'bg-chart-3/10 text-chart-3' },
  ]

  // ─── Category handlers ──────────────────────────────────────────────────────

  // Colors already used by other categories (excludes the one being edited).
  // Used to prevent duplicate color selection in the UI.
  const usedColors = useMemo(() => {
    const set = new Set<string>()
    for (const c of categories) {
      if (editingCategory && c.id === editingCategory.id) continue
      const hex = normalizeHexColor(c.color)
      if (hex) set.add(hex)
    }
    return set
  }, [categories, editingCategory])

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCategorySubmitError('')
    const formData = new FormData(e.currentTarget)

    const budgetRaw = formData.get('budget')
    const teamRaw = formData.get('teamSize')
    const maxProjectsRaw = formData.get('maxProjectsPerAdvisor')
    const eventDateRaw = formData.get('eventDate') as string

    if (!eventDateRaw || eventDateRaw.trim() === '') {
      setCategorySubmitError('Event date is required.')
      return
    }

    const normalizedColor = normalizeHexColor(selectedColor)
    if (!normalizedColor) {
      setCategorySubmitError('Please pick a color for this category.')
      return
    }
    if (usedColors.has(normalizedColor)) {
      setCategorySubmitError('This color is already used by another category. Please pick a different one.')
      return
    }

    const payload: any = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      defaultBudget:
        showCategoryBudgetField && budgetRaw && String(budgetRaw).trim() !== ''
          ? parseInt(String(budgetRaw), 10) || null
          : null,
      defaultTeamSize:
        showCategoryTeamSizeField && teamRaw && String(teamRaw).trim() !== ''
          ? parseInt(String(teamRaw), 10) || null
          : null,
      advisorRequired,
      maxProjectsPerAdvisor:
        advisorRequired && showCategoryMaxProjectsField && maxProjectsRaw && String(maxProjectsRaw).trim() !== ''
          ? parseInt(String(maxProjectsRaw), 10) || null
          : null,
      eventDate: eventDateRaw,
      color: normalizedColor,
    }

    try {
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.id, payload)
      } else {
        await adminApi.createCategory(payload)
      }
      setCategoryDialogOpen(false)
      setEditingCategory(null)
      await loadData()
    } catch (err: any) {
      setCategorySubmitError(err.message || 'Failed to save category.')
    }
  }

  const handleDeleteCategory = async (id: number) => {
    try {
      await adminApi.deleteCategory(id)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete category.')
    }
  }

  // ─── Announcement handlers ──────────────────────────────────────────────────
  const handleAddAnnouncement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const categoryName = formData.get('category') as string
    const cat = categories.find((c) => c.name === categoryName)

    const payload: any = {
      title: formData.get('title') as string,
      description: formData.get('detail') as string,
      categoryId: cat?.id || null,
    }

    try {
      if (editingAnnouncement) {
        await adminApi.updateAnnouncement(editingAnnouncement.id, payload)
      } else {
        await adminApi.createAnnouncement(payload)
      }
      setAnnouncementDialogOpen(false)
      setEditingAnnouncement(null)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to save announcement.')
    }
  }

  const handleDeleteAnnouncement = async (id: number) => {
    try {
      await adminApi.deleteAnnouncement(id)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete announcement.')
    }
  }

  // ─── Loading state ──────────────────────────────────────────────────────────
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
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground">Administrator</p>
            </div>
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

      {/* Project Categories Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Project Categories</CardTitle>
            <CardDescription>Manage project groups and categories</CardDescription>
          </div>
          <Dialog
            open={categoryDialogOpen}
            onOpenChange={(open) => {
              setCategoryDialogOpen(open)
              if (!open) {
                setEditingCategory(null)
                setCategorySubmitError('')
                setShowCategoryBudgetField(false)
                setShowCategoryTeamSizeField(false)
                setShowCategoryMaxProjectsField(false)
                setAdvisorRequired(false)
                setSelectedColor('')
                setCustomColorOpen(false)
              }
            }}
          >
            <Button
              type="button"
              onClick={() => {
                setEditingCategory(null)
                setCategorySubmitError('')
                setShowCategoryBudgetField(false)
                setShowCategoryTeamSizeField(false)
                setShowCategoryMaxProjectsField(false)
                setAdvisorRequired(false)
                setSelectedColor('')
                setCustomColorOpen(false)
                setCategoryDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
            <DialogContent
              className={cn(
                'top-4 max-h-[min(92dvh,calc(100vh-2rem))] translate-y-0 gap-0 p-0 sm:max-w-lg',
                'flex flex-col overflow-hidden',
              )}
            >
              <DialogHeader className="shrink-0 space-y-2 px-6 pt-6 pb-2 pr-14 text-left sm:text-left">
                <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                <DialogDescription>
                  {editingCategory ? 'Update the project category details.' : 'Create a new project category for students to use.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCategory} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6">
                  <FieldGroup className="py-2 pb-4">
                  <Field>
                    <FieldLabel htmlFor="name">Category Name</FieldLabel>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingCategory?.name}
                      placeholder="e.g., TUBITAK"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="description">Description</FieldLabel>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editingCategory?.description}
                      placeholder="Brief description of this category"
                      required
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                      <div className="flex items-center justify-between gap-2">
                        <FieldLabel htmlFor="budget" className="text-foreground mb-0">
                          Budget (TL)
                        </FieldLabel>
                        {!showCategoryBudgetField ? (
                          <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
                            onClick={() => setShowCategoryBudgetField(true)} aria-label="Show budget field">
                            <Plus className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
                            onClick={() => setShowCategoryBudgetField(false)} aria-label="Hide budget field">
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {showCategoryBudgetField ? (
                        <Input id="budget" name="budget" type="number" className="mt-2"
                          key={`budget-${editingCategory?.id ?? 'new'}-${showCategoryBudgetField}`}
                          defaultValue={editingCategory?.defaultBudget ?? ''} placeholder="e.g., 50000" min={0} />
                      ) : null}
                    </Field>
                    <Field>
                      <div className="flex items-center justify-between gap-2">
                        <FieldLabel htmlFor="teamSize" className="text-foreground mb-0">
                          Team Size
                        </FieldLabel>
                        {!showCategoryTeamSizeField ? (
                          <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
                            onClick={() => setShowCategoryTeamSizeField(true)} aria-label="Show team size field">
                            <Plus className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
                            onClick={() => setShowCategoryTeamSizeField(false)} aria-label="Hide team size field">
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {showCategoryTeamSizeField ? (
                        <Input id="teamSize" name="teamSize" type="number" className="mt-2"
                          key={`team-${editingCategory?.id ?? 'new'}-${showCategoryTeamSizeField}`}
                          defaultValue={editingCategory?.defaultTeamSize ?? ''} placeholder="e.g., 3" min={1} />
                      ) : null}
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="eventDate">Event Date</FieldLabel>
                    <Input
                      id="eventDate"
                      name="eventDate"
                      type="date"
                      key={`event-${editingCategory?.id ?? 'new'}`}
                      defaultValue={editingCategory?.eventDate ?? ''}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>
                      Color <span className="text-destructive">*</span>
                    </FieldLabel>
                    <p className="text-xs text-muted-foreground mb-2">
                      Each category must have a unique color. It will be used everywhere
                      (admin, advisor, student) to identify this category.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORY_COLOR_PALETTE.map((hex) => {
                        const isUsed = usedColors.has(hex)
                        const isSelected = selectedColor.toLowerCase() === hex
                        return (
                          <button
                            key={hex}
                            type="button"
                            disabled={isUsed && !isSelected}
                            onClick={() => setSelectedColor(hex)}
                            title={isUsed && !isSelected ? `${hex} already used` : hex}
                            aria-label={`Select color ${hex}`}
                            className={cn(
                              'relative h-8 w-8 rounded-full border-2 transition-all',
                              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring',
                              isSelected
                                ? 'border-foreground scale-110 shadow-md'
                                : 'border-transparent hover:scale-105',
                              isUsed && !isSelected ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
                            )}
                            style={{ backgroundColor: hex }}
                          >
                            {isSelected ? (
                              <Check className="h-4 w-4 text-white mx-auto drop-shadow" />
                            ) : null}
                          </button>
                        )
                      })}
                      <button
                        type="button"
                        onClick={() => setCustomColorOpen((v) => !v)}
                        className={cn(
                          'h-8 px-3 rounded-full border text-xs font-medium transition',
                          'bg-background hover:bg-muted',
                          customColorOpen ? 'border-foreground' : 'border-border',
                        )}
                      >
                        {customColorOpen ? 'Hide custom' : 'Custom…'}
                      </button>
                    </div>
                    {customColorOpen ? (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="color"
                          value={normalizeHexColor(selectedColor) ?? '#3b82f6'}
                          onChange={(e) => setSelectedColor(e.target.value.toLowerCase())}
                          className="h-9 w-12 cursor-pointer rounded border bg-background"
                          aria-label="Pick a custom color"
                        />
                        <Input
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          placeholder="#3b82f6"
                          className="h-9 max-w-[140px] font-mono text-xs"
                        />
                        {selectedColor && usedColors.has(normalizeHexColor(selectedColor) ?? '') ? (
                          <span className="text-xs text-destructive">Already used</span>
                        ) : null}
                      </div>
                    ) : null}
                  </Field>
                  <Field>
                    <div className="flex items-center justify-between gap-2 rounded-md border p-3">
                      <div>
                        <FieldLabel htmlFor="advisor-required" className="mb-1">
                          Advisor Required
                        </FieldLabel>
                        <p className="text-xs text-muted-foreground">
                          Students must request an advisor for projects in this category.
                        </p>
                      </div>
                      <Switch
                        id="advisor-required"
                        checked={advisorRequired}
                        onCheckedChange={(checked) => {
                          setAdvisorRequired(checked)
                          if (!checked) setShowCategoryMaxProjectsField(false)
                        }}
                      />
                    </div>
                  </Field>
                  {advisorRequired ? (
                    <Field>
                      <div className="flex items-center justify-between gap-2">
                        <FieldLabel htmlFor="maxProjectsPerAdvisor" className="text-foreground mb-0">
                          Max Projects per Advisor
                        </FieldLabel>
                        {!showCategoryMaxProjectsField ? (
                          <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
                            onClick={() => setShowCategoryMaxProjectsField(true)} aria-label="Show max projects field">
                            <Plus className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
                            onClick={() => setShowCategoryMaxProjectsField(false)} aria-label="Hide max projects field">
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {showCategoryMaxProjectsField ? (
                        <Input
                          id="maxProjectsPerAdvisor"
                          name="maxProjectsPerAdvisor"
                          type="number"
                          className="mt-2"
                          key={`maxProjects-${editingCategory?.id ?? 'new'}-${showCategoryMaxProjectsField}`}
                          defaultValue={editingCategory?.maxProjectsPerAdvisor ?? ''}
                          placeholder="e.g., 5"
                          min={1}
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          Leave unset for unlimited projects per advisor.
                        </p>
                      )}
                    </Field>
                  ) : null}
                  {categorySubmitError ? (
                    <p className="text-sm text-destructive mt-2">{categorySubmitError}</p>
                  ) : null}
                </FieldGroup>
                </div>
                <DialogFooter className="shrink-0 gap-2 border-t bg-background px-6 py-4">
                  <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCategory ? 'Update' : 'Create'} Category
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Color</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Team Size</TableHead>
                <TableHead>Advisor Required</TableHead>
                <TableHead>Max / Advisor</TableHead>
                <TableHead>Event Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => {
                const dot = getCategoryColorProps({ color: cat.color, name: cat.name })
                return (
                <TableRow key={cat.id}>
                  <TableCell>
                    <div
                      className={cn('w-6 h-6 rounded-full ring-1 ring-border/40', dot.className)}
                      style={dot.style}
                      title={cat.color || undefined}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{cat.description}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {cat.defaultBudget != null ? `${cat.defaultBudget.toLocaleString()} TL` : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {cat.defaultTeamSize != null ? cat.defaultTeamSize : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {cat.advisorRequired ? 'Yes' : 'No'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {cat.maxProjectsPerAdvisor ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {cat.eventDate ? new Date(cat.eventDate).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCategorySubmitError('')
                          setEditingCategory(cat)
                          setShowCategoryBudgetField(cat.defaultBudget != null)
                          setShowCategoryTeamSizeField(cat.defaultTeamSize != null)
                          setShowCategoryMaxProjectsField(cat.maxProjectsPerAdvisor != null)
                          setAdvisorRequired(Boolean(cat.advisorRequired))
                          setSelectedColor(normalizeHexColor(cat.color) ?? '')
                          setCustomColorOpen(false)
                          setCategoryDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteCategory(cat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Announcements Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>Manage announcements and deadlines</CardDescription>
          </div>
          <Dialog open={announcementDialogOpen} onOpenChange={(open) => {
            setAnnouncementDialogOpen(open)
            if (!open) setEditingAnnouncement(null)
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</DialogTitle>
                <DialogDescription>
                  {editingAnnouncement ? 'Update the announcement details.' : 'Create a new announcement for students and advisors.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddAnnouncement}>
                <FieldGroup className="py-4">
                  <Field>
                    <FieldLabel htmlFor="title">Title</FieldLabel>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={editingAnnouncement?.title}
                      placeholder="Announcement title"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="detail">Detail</FieldLabel>
                    <Textarea
                      id="detail"
                      name="detail"
                      defaultValue={editingAnnouncement?.description}
                      placeholder="Full announcement details"
                      rows={4}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="category">Project Category</FieldLabel>
                    <Select name="category" defaultValue={editingAnnouncement?.category?.name || categories[0]?.name}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => {
                          const dot = getCategoryColorProps({ color: cat.color, name: cat.name })
                          return (
                            <SelectItem key={cat.id} value={cat.name}>
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn('w-3 h-3 rounded-full', dot.className)}
                                  style={dot.style}
                                />
                                {cat.name}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button type="submit">{editingAnnouncement ? 'Update' : 'Create'} Announcement</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Publisher</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcementsList.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell className="font-medium">{announcement.title}</TableCell>
                  <TableCell>
                    {announcement.category ? (
                      <CategoryLabel name={announcement.category.name} color={announcement.category.color} variant="solid" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {announcement.publisher?.fullName || '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{announcement.title}</DialogTitle>
                            <DialogDescription asChild>
                              <div className="mt-2">
                                {announcement.category && (
                                  <CategoryLabel name={announcement.category.name} color={announcement.category.color} variant="solid" />
                                )}
                              </div>
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <p className="text-foreground whitespace-pre-wrap">{announcement.description}</p>
                            <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                              <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingAnnouncement(announcement)
                          setAnnouncementDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
