'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Minus, Pencil, Trash2, Loader2, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import {
  CATEGORY_COLOR_PALETTE,
  getCategoryColorProps,
  normalizeHexColor,
} from '@/lib/category-colors'
import { cn } from '@/lib/utils'
import { admin as adminApi } from '@/lib/api-client'

export default function CategoriesPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [showBudgetField, setShowBudgetField] = useState(false)
  const [showTeamSizeField, setShowTeamSizeField] = useState(false)
  const [showMaxProjectsField, setShowMaxProjectsField] = useState(false)
  const [advisorRequired, setAdvisorRequired] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [customColorOpen, setCustomColorOpen] = useState(false)

  const loadData = useCallback(async () => {
    if (user?.role !== 'admin') return
    setLoading(true)
    try {
      const cats = await adminApi.getCategories()
      setCategories(cats)
    } catch (err) {
      console.error('Failed to load categories:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    loadData()
  }, [user, isLoading, router, loadData])

  if (isLoading || user?.role !== 'admin') return null

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError('')
    const formData = new FormData(e.currentTarget)

    const budgetRaw = formData.get('budget')
    const teamRaw = formData.get('teamSize')
    const maxProjectsRaw = formData.get('maxProjectsPerAdvisor')
    const eventDateRaw = formData.get('eventDate') as string

    if (!eventDateRaw || eventDateRaw.trim() === '') {
      setSubmitError('Event date is required.')
      return
    }

    const normalizedColor = normalizeHexColor(selectedColor)
    if (!normalizedColor) {
      setSubmitError('Please pick a color for this category.')
      return
    }
    if (usedColors.has(normalizedColor)) {
      setSubmitError('This color is already used by another category. Please pick a different one.')
      return
    }

    const payload = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      defaultBudget:
        showBudgetField && budgetRaw && String(budgetRaw).trim() !== ''
          ? parseInt(String(budgetRaw), 10) || null
          : null,
      defaultTeamSize:
        showTeamSizeField && teamRaw && String(teamRaw).trim() !== ''
          ? parseInt(String(teamRaw), 10) || null
          : null,
      advisorRequired,
      maxProjectsPerAdvisor:
        advisorRequired && showMaxProjectsField && maxProjectsRaw && String(maxProjectsRaw).trim() !== ''
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
      setDialogOpen(false)
      setEditingCategory(null)
      await loadData()
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save category.')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteCategory(id)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete category.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading categories...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Project Categories</h1>
          <p className="text-muted-foreground mt-1">Manage project groups and categories</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              setEditingCategory(null)
              setSubmitError('')
              setShowBudgetField(false)
              setShowTeamSizeField(false)
              setShowMaxProjectsField(false)
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
              setSubmitError('')
              setShowBudgetField(false)
              setShowTeamSizeField(false)
              setShowMaxProjectsField(false)
              setAdvisorRequired(false)
              setSelectedColor('')
              setCustomColorOpen(false)
              setDialogOpen(true)
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
                {editingCategory ? 'Update the project category details.' : 'Create a new project category.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
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
                    placeholder="Brief description"
                    required
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <div className="flex items-center justify-between gap-2">
                      <FieldLabel htmlFor="budget" className="text-foreground mb-0">
                        Budget (TL)
                      </FieldLabel>
                      {!showBudgetField ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => setShowBudgetField(true)}
                          aria-label="Show budget field"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => setShowBudgetField(false)}
                          aria-label="Hide budget field"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {showBudgetField ? (
                      <Input
                        id="budget"
                        name="budget"
                        type="number"
                        className="mt-2"
                        key={`budget-${editingCategory?.id ?? 'new'}-${showBudgetField}`}
                        defaultValue={editingCategory?.defaultBudget ?? ''}
                        placeholder="e.g., 50000"
                        min={0}
                      />
                    ) : null}
                  </Field>
                  <Field>
                    <div className="flex items-center justify-between gap-2">
                      <FieldLabel htmlFor="teamSize" className="text-foreground mb-0">
                        Team Size
                      </FieldLabel>
                      {!showTeamSizeField ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => setShowTeamSizeField(true)}
                          aria-label="Show team size field"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => setShowTeamSizeField(false)}
                          aria-label="Hide team size field"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {showTeamSizeField ? (
                      <Input
                        id="teamSize"
                        name="teamSize"
                        type="number"
                        className="mt-2"
                        key={`team-${editingCategory?.id ?? 'new'}-${showTeamSizeField}`}
                        defaultValue={editingCategory?.defaultTeamSize ?? ''}
                        placeholder="e.g., 3"
                        min={1}
                      />
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
                      <FieldLabel htmlFor="advisorRequired" className="mb-1">
                        Advisor Required
                      </FieldLabel>
                      <p className="text-xs text-muted-foreground">
                        Students must request an advisor for projects in this category.
                      </p>
                    </div>
                    <Switch
                      id="advisorRequired"
                      checked={advisorRequired}
                      onCheckedChange={(checked) => {
                        setAdvisorRequired(checked)
                        if (!checked) setShowMaxProjectsField(false)
                        else setShowMaxProjectsField(true)
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
                      {!showMaxProjectsField ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => setShowMaxProjectsField(true)}
                          aria-label="Show max projects field"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => setShowMaxProjectsField(false)}
                          aria-label="Hide max projects field"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {showMaxProjectsField ? (
                      <Input
                        id="maxProjectsPerAdvisor"
                        name="maxProjectsPerAdvisor"
                        type="number"
                        className="mt-2"
                        key={`maxProjects-${editingCategory?.id ?? 'new'}-${showMaxProjectsField}`}
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
                {submitError ? (
                  <p className="text-sm text-destructive mt-2">{submitError}</p>
                ) : null}
              </FieldGroup>
              </div>
              <DialogFooter className="shrink-0 gap-2 border-t bg-background px-6 py-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>List of all project categories in the system</CardDescription>
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
              {categories.map((category) => {
                const dot = getCategoryColorProps({ color: category.color, name: category.name })
                return (
                <TableRow key={category.id}>
                  <TableCell>
                    <div
                      className={cn('w-6 h-6 rounded-full ring-1 ring-border/40', dot.className)}
                      style={dot.style}
                      title={category.color || undefined}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{category.description}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.defaultBudget != null ? `${category.defaultBudget.toLocaleString()} TL` : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.defaultTeamSize != null ? category.defaultTeamSize : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.advisorRequired ? 'Yes' : 'No'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.maxProjectsPerAdvisor ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.eventDate ? new Date(category.eventDate).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSubmitError('')
                          setEditingCategory(category)
                          setShowBudgetField(category.defaultBudget != null)
                          setShowTeamSizeField(category.defaultTeamSize != null)
                          setShowMaxProjectsField(category.maxProjectsPerAdvisor != null)
                          setAdvisorRequired(!!category.advisorRequired)
                          setSelectedColor(normalizeHexColor(category.color) ?? '')
                          setCustomColorOpen(false)
                          setDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                )
              })}
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
