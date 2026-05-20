'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { CheckCircle, Search, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CategoryLabel } from '@/components/category-label'
import { useAuth } from '@/lib/auth-context'
import { student as studentApi, advisor as advisorApi } from '@/lib/api-client'

/** Student /incoming list merges two tables; numeric ids can collide (e.g. both id 1). */
function getRequestRowKey(request: any): string {
  const type = request.requestType ?? 'AdvisorRequest'
  const id = request.requestId ?? request.advisorRequestId ?? 'unknown'
  return `${type}-${id}`
}

export default function RequestsPage() {
  const { user } = useAuth()
  const isStudent = user?.role === 'student'
  const isAdvisor = user?.role === 'advisor'

  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [respondingRequestId, setRespondingRequestId] = useState<number | null>(null)
  
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      let reqs = []
      if (isStudent) {
        reqs = await studentApi.getMyAdvisorRequests()
      } else if (isAdvisor) {
        reqs = await advisorApi.getIncomingRequests()
      }
      setRequests(reqs)
    } catch (err) {
      console.error('Failed to load requests:', err)
    } finally {
      setLoading(false)
    }
  }, [user, isStudent, isAdvisor])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return requests
    return requests.filter((r) => {
      const pTitle = r.project?.title || r.projectTitle
      const cat = r.project?.category?.name || r.projectCategory
      const personName = isStudent
        ? (r.advisorSender?.fullName || r.advisorName)
        : (r.senderStudent?.fullName || r.studentName)
      
      const fields = [pTitle, cat, personName, r.status, r.message]
      return fields.some((f) => (f ?? '').toString().toLowerCase().includes(q))
    })
  }, [requests, searchQuery, isStudent])

  const handleRequestAction = async (requestId: number, action: 'approved' | 'rejected') => {
    if (respondingRequestId !== null) return
    setRespondingRequestId(requestId)
    try {
      const approved = action === 'approved'
      if (isAdvisor) {
        await advisorApi.respondToRequest(requestId, { approved })
      } else if (isStudent) {
        await studentApi.respondToRequest(requestId, { approved })
      } else {
        return
      }

      const newStatus = approved ? 'ACCEPTED' : 'REJECTED'
      setRequests((prev) =>
        prev.map((r) => (r.requestId === requestId ? { ...r, status: newStatus } : r)),
      )
      if (selectedRequest && selectedRequest.requestId === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus })
      }
    } catch (err: any) {
      console.error('Failed to respond to request:', err)
      alert(err?.message || 'Failed to respond to request.')
    } finally {
      setRespondingRequestId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      'PENDING': { variant: 'secondary', label: 'Pending' },
      'ACCEPTED': { variant: 'default', label: 'Accepted' },
      'REJECTED': { variant: 'destructive', label: 'Rejected' },
    }
    const { variant, label } = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={variant}>{label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">
          {isStudent ? 'Loading advisor requests...' : 'Loading project requests from students...'}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {isStudent ? 'My Advisor Requests' : 'Project Request'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isStudent ? 'Track advisor requests you sent for your projects' : 'Manage project requests from students'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isAdvisor ? 'Project Requests' : 'Requests'}</CardTitle>
          <CardDescription>
            {filteredRequests.length} of {requests.length} request{requests.length !== 1 ? 's' : ''}
            {searchQuery ? ' match your search' : ' found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={
                isAdvisor
                  ? 'Search by project, student, or status...'
                  : 'Search by project, category, or status...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {isStudent
                ? 'No advisor requests found.'
                : 'No project requests from students found.'}
            </p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No requests match &quot;{searchQuery}&quot;.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>{isStudent ? 'Advisor' : 'Student'}</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdvisor && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={getRequestRowKey(request)}>
                    <TableCell 
                      className="font-medium cursor-pointer hover:text-primary"
                      onClick={() => setSelectedRequest(request)}
                    >
                      {request.project?.title || '—'}
                    </TableCell>
                    <TableCell 
                      className="cursor-pointer hover:text-primary"
                      onClick={() => setSelectedStudent(isStudent ? request.advisorSender : request.senderStudent)}
                    >
                      {isStudent
                        ? (request.advisorSender?.fullName || '—')
                        : (request.senderStudent?.fullName || '—')}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {request.message || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    {isAdvisor && (
                      <TableCell className="text-right">
                        {request.status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-chart-2"
                              disabled={respondingRequestId === request.requestId}
                              onClick={() => handleRequestAction(request.requestId, 'approved')}
                            >
                              {respondingRequestId === request.requestId ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-1" />
                              )}
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              disabled={respondingRequestId === request.requestId}
                              onClick={() => handleRequestAction(request.requestId, 'rejected')}
                            >
                              {respondingRequestId === request.requestId ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4 mr-1" />
                              )}
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Request Project Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.project?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedRequest?.project?.category && (
              <div className="flex items-center gap-2">
                <CategoryLabel name={selectedRequest.project.category.name} color={selectedRequest.project.category.color} />
                {getStatusBadge(selectedRequest.status)}
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Message</h4>
              <p className="text-foreground">{selectedRequest?.message || 'No message available'}</p>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground border-t pt-4">
              <span 
                className="cursor-pointer hover:text-primary"
                onClick={() => {
                  const person = isStudent ? selectedRequest?.advisorSender : selectedRequest?.senderStudent
                  if (person) {
                    setSelectedStudent(person)
                  }
                }}
              >
                {isStudent ? 'Advisor' : 'Student'}:{' '}
                <span className="font-medium text-foreground">
                  {isStudent ? selectedRequest?.advisorSender?.fullName : selectedRequest?.senderStudent?.fullName}
                </span>
              </span>
              <span>Requested: {selectedRequest && new Date(selectedRequest.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Profile Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isStudent ? 'Advisor Profile' : 'Student Profile'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {selectedStudent?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'ST'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{selectedStudent?.fullName}</h3>
                <p className="text-sm text-muted-foreground">{selectedStudent?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{selectedStudent?.department || '—'}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
