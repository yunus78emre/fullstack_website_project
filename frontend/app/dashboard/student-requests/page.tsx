'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Building2, CheckCircle, Github, Linkedin, Loader2, Mail, Search, User, XCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { student as studentApi } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
} from '@/components/ui/dialog'
import { CategoryLabel } from '@/components/category-label'

export default function StudentRequestsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [respondingRequestId, setRespondingRequestId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [requests, setRequests] = useState<any[]>([])
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)

  const loadData = useCallback(async () => {
    if (!user || user.role !== 'student') return
    setLoading(true)
    try {
      const incoming = await studentApi.getIncomingRequests()
      const studentRequests = (incoming || []).filter((r: any) => r.requestType === 'StudentRequest')
      setRequests(studentRequests)
    } catch (err) {
      console.error('Failed to load incoming student requests:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return requests

    return requests.filter((r) => {
      const fields = [
        r.senderStudent?.fullName,
        r.senderStudent?.email,
        r.project?.title,
        r.project?.category?.name,
        r.status,
        r.message,
      ]
      return fields.some((f) => (f ?? '').toString().toLowerCase().includes(q))
    })
  }, [requests, searchQuery])

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === 'PENDING').length,
    [requests],
  )

  const handleRequestAction = async (requestId: number, approved: boolean) => {
    if (respondingRequestId !== null) return
    setRespondingRequestId(requestId)

    try {
      await studentApi.respondToRequest(requestId, { approved })
      await loadData()
    } catch (err: any) {
      alert(err?.message || 'Failed to respond to request.')
    } finally {
      setRespondingRequestId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      PENDING: { variant: 'secondary', label: 'Pending' },
      ACCEPTED: { variant: 'default', label: 'Accepted' },
      REJECTED: { variant: 'destructive', label: 'Rejected' },
    }
    const { variant, label } = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={variant}>{label}</Badge>
  }

  const getInitials = (name?: string) =>
    (name || 'U')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading incoming student requests...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Incoming Student Requests</h1>
        <p className="text-muted-foreground mt-1">
          Students who requested to join projects that you own
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
          <CardDescription>
            {searchQuery ? `${filteredRequests.length} of ` : ''}
            {requests.length} request{requests.length !== 1 ? 's' : ''} total · {pendingCount} pending
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by student, project, category, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No incoming student requests found.
            </p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No requests match &quot;{searchQuery}&quot;.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow
                    key={`student-request-${request.requestId}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <TableCell className="font-medium">{request.senderStudent?.fullName || '—'}</TableCell>
                    <TableCell>{request.project?.title || '—'}</TableCell>
                    <TableCell>
                      {request.project?.category ? (
                        <CategoryLabel
                          name={request.project.category.name}
                          color={request.project.category.color}
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      {request.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-chart-2"
                            disabled={respondingRequestId === request.requestId}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRequestAction(request.requestId, true)
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            disabled={respondingRequestId === request.requestId}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRequestAction(request.requestId, false)
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.project?.title}</DialogTitle>
            <DialogDescription asChild>
              <div className="mt-2 flex items-center gap-2">
                {selectedRequest?.project?.category && (
                  <CategoryLabel
                    name={selectedRequest.project.category.name}
                    color={selectedRequest.project.category.color}
                  />
                )}
                {selectedRequest && getStatusBadge(selectedRequest.status)}
              </div>
            </DialogDescription>
          </DialogHeader>

          {selectedRequest?.senderStudent && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(selectedRequest.senderStudent.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{selectedRequest.senderStudent.fullName}</p>
                  <p className="text-sm text-muted-foreground">Requested on {new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedRequest.senderStudent.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedRequest.senderStudent.department || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedRequest.senderStudent.year ? `Year ${selectedRequest.senderStudent.year}` : 'Year —'}</span>
                </div>
              </div>

              {selectedRequest.senderStudent.interests && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Interests</p>
                  <p className="text-sm">{selectedRequest.senderStudent.interests}</p>
                </div>
              )}

              {selectedRequest.senderStudent.bio && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Biography</p>
                  <p className="whitespace-pre-wrap text-sm">{selectedRequest.senderStudent.bio}</p>
                </div>
              )}

              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Skills</p>
                {Array.isArray(selectedRequest.senderStudent.skills) && selectedRequest.senderStudent.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRequest.senderStudent.skills.map((skill: string, idx: number) => (
                      <Badge key={`${skill}-${idx}`} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills added yet.</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm">
                {selectedRequest.senderStudent.githubLink && (
                  <a
                    href={selectedRequest.senderStudent.githubLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                )}
                {selectedRequest.senderStudent.linkedinLink && (
                  <a
                    href={selectedRequest.senderStudent.linkedinLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
              </div>

              {selectedRequest.status === 'PENDING' && (
                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    className="text-chart-2"
                    onClick={() => handleRequestAction(selectedRequest.requestId, true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive"
                    onClick={() => handleRequestAction(selectedRequest.requestId, false)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
