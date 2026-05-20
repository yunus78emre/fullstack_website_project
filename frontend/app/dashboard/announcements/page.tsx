'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Bell, Calendar, User as UserIcon, Loader2 } from 'lucide-react'
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CategoryLabel } from '@/components/category-label'
import { useAuth } from '@/lib/auth-context'
import { admin as adminApi, student as studentApi, advisor as advisorApi } from '@/lib/api-client'
import { normalizeHexColor } from '@/lib/category-colors'

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isStudent = user?.role === 'student'
  const isAdvisor = user?.role === 'advisor'

  const [categories, setCategories] = useState<any[]>([])
  const [announcementsList, setAnnouncementsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const cats = await adminApi.getCategories()
      setCategories(cats)

      let anns: any[] = []
      if (isAdmin) {
        anns = await adminApi.getAnnouncements()
      } else if (isStudent) {
        const feed = await studentApi.getAnnouncementsFeed()
        anns = feed.items.filter((i: any) => i.announcementType === 'DirectAnnouncement')
      } else if (isAdvisor) {
        const feed = await advisorApi.getAnnouncementsFeed()
        anns = (feed.items || [])
          .filter((i: any) => i.announcementType === 'DirectAnnouncement')
          .map((i: any) => {
            const categoryId = i.directDetail?.categoryId
            const matchedCategory = categoryId
              ? cats.find((c: any) => c.id === categoryId)
              : null

            return {
              ...i,
              category: matchedCategory
                ? {
                    id: matchedCategory.id,
                    name: matchedCategory.name,
                    color: matchedCategory.color,
                  }
                : null,
              publisher: i.directDetail?.publisherFullName
                ? { fullName: i.directDetail.publisherFullName }
                : undefined,
            }
          })
      }
      setAnnouncementsList(anns)
    } catch (err) {
      console.error('Failed to load announcements:', err)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isStudent, isAdvisor])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isAdmin) return

    const formData = new FormData(e.currentTarget)
    const categoryValue = formData.get('category') as string
    const cat =
      categoryValue && categoryValue !== '__none__'
        ? categories.find((c) => c.name === categoryValue)
        : null

    const payload = {
      title: formData.get('title') as string,
      description: formData.get('detail') as string,
      categoryId: cat?.id ?? null,
    }

    try {
      if (editingAnnouncement) {
        await adminApi.updateAnnouncement(editingAnnouncement.id, payload)
      } else {
        await adminApi.createAnnouncement(payload)
      }
      setDialogOpen(false)
      setEditingAnnouncement(null)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to save announcement.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!isAdmin) return
    try {
      await adminApi.deleteAnnouncement(id)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete announcement.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading announcements...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? 'Manage announcements and deadlines' : 'View announcements and upcoming deadlines'}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
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
                  {editingAnnouncement ? 'Update the announcement details.' : 'Create a new announcement.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
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
                    <Select
                      name="category"
                      defaultValue={editingAnnouncement?.category?.name || '__none__'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— No category (general) —</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave as general for announcements not tied to a specific category.
                    </p>
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button type="submit">{editingAnnouncement ? 'Update' : 'Create'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Card View for Students/Advisors */}
      {!isAdmin && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {announcementsList.map((announcement) => (
            <Card
              key={announcement.itemId || announcement.id}
              className="cursor-pointer hover:bg-muted/30 transition-colors"
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: normalizeHexColor(announcement.category?.color ?? null) ?? undefined,
              }}
              onClick={() => setSelectedAnnouncement(announcement)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  {announcement.category ? (
                    <CategoryLabel name={announcement.category.name} color={announcement.category.color} variant="solid" />
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg mt-2">{announcement.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {announcement.description}
                </p>
                <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                  <p>Published: {new Date(announcement.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {announcementsList.length === 0 && (
            <p className="text-muted-foreground col-span-3 text-center py-8">No announcements available.</p>
          )}
        </div>
      )}

      {/* Table View for Admin */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>All Announcements</CardTitle>
            <CardDescription>Manage system announcements</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Publish Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcementsList.map((announcement) => (
                  <TableRow
                    key={announcement.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedAnnouncement(announcement)}
                  >
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingAnnouncement(announcement)
                            setDialogOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(announcement.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {announcementsList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No announcements available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
              <p className="text-foreground whitespace-pre-wrap">
                {selectedAnnouncement?.description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm border-t pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Published</p>
                  <p className="font-medium">
                    {selectedAnnouncement && new Date(selectedAnnouncement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Created by</p>
                  <p className="font-medium">{selectedAnnouncement?.publisher?.fullName || 'Admin'}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
