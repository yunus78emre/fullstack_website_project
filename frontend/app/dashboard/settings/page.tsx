'use client'

import { useEffect, useState } from 'react'
import { User, Bell, Plus, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { FieldGroup, Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth-context'

function normalizeSkills(input?: string[] | string): string[] {
  if (!input) return []
  if (Array.isArray(input)) return input.filter((s) => s && s.trim().length > 0)
  return input
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const [notifications, setNotifications] = useState({
    email: true,
    announcements: true,
    requests: true,
    deadlines: true,
  })

  const isAdmin = user?.role === 'admin'
  const [saveMessage, setSaveMessage] = useState('')
  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    department: user?.department ?? '',
    year: user?.year?.toString() ?? '',
    interests: user?.interests ?? '',
    githubLink: user?.githubLink ?? '',
    linkedinLink: user?.linkedinLink ?? '',
    biography: user?.biography ?? '',
    academicTitle: user?.academicTitle ?? '',
    areasOfExpertise: user?.areasOfExpertise ?? user?.department ?? '',
    researchInterests: user?.researchInterests ?? '',
  })
  const [skills, setSkills] = useState<string[]>(() => normalizeSkills(user?.skills))

  useEffect(() => {
    if (!user) return
    setProfile({
      name: user.name,
      department: user.department ?? '',
      year: user.year?.toString() ?? '',
      interests: user.interests ?? '',
      githubLink: user.githubLink ?? '',
      linkedinLink: user.linkedinLink ?? '',
      biography: user.biography ?? '',
      academicTitle: user.academicTitle ?? '',
      areasOfExpertise: user.areasOfExpertise ?? user.department ?? '',
      researchInterests: user.researchInterests ?? '',
    })
    setSkills(normalizeSkills(user.skills))
  }, [user])

  const handleAddSkill = () => setSkills((prev) => [...prev, ''])
  const handleSkillChange = (idx: number, value: string) =>
    setSkills((prev) => prev.map((s, i) => (i === idx ? value : s)))
  const handleRemoveSkill = (idx: number) =>
    setSkills((prev) => prev.filter((_, i) => i !== idx))

  if (!user) return null

  const hasDuplicateSkillsCaseInsensitive = (items: string[]) => {
    const normalized = items
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => s.toLowerCase())
    return normalized.length !== new Set(normalized).size
  }

  const handleSaveProfile = async () => {
    const cleanedSkills = skills.map((s) => s.trim()).filter((s) => s.length > 0)
    if (hasDuplicateSkillsCaseInsensitive(cleanedSkills)) {
      alert('You cannot add the same skill more than once (case-insensitive).')
      setSaveMessage('')
      return
    }

    setSaveMessage('')

    if (user.role === 'advisor') {
      await updateUser({
        name: profile.name,
        academicTitle: profile.academicTitle,
        areasOfExpertise: profile.areasOfExpertise,
        researchInterests: profile.researchInterests,
        skills: cleanedSkills,
        department: undefined,
      })
    } else {
      await updateUser({
        name: profile.name,
        department: profile.department,
        year: user.role === 'student' && profile.year ? Number(profile.year) : undefined,
        interests: user.role === 'student' ? profile.interests : undefined,
        githubLink: user.role === 'student' ? profile.githubLink : undefined,
        linkedinLink: user.role === 'student' ? profile.linkedinLink : undefined,
        biography: user.role === 'student' ? profile.biography : undefined,
        skills: user.role === 'student' ? cleanedSkills : undefined,
      })
    }
    setSkills(cleanedSkills)
    setSaveMessage('Your profile has been saved.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        {!isAdmin ? (
          <TabsList>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>
        ) : null}

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="name">Full Name</FieldLabel>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" defaultValue={user.email} disabled />
                  </Field>
                </div>
                {user.role === 'advisor' ? (
                  <>
                    <Field>
                      <FieldLabel htmlFor="academic-title">Academic title</FieldLabel>
                      <Input
                        id="academic-title"
                        placeholder="e.g. Assoc. Prof. Dr., Prof. Dr."
                        value={profile.academicTitle}
                        onChange={(e) => setProfile((p) => ({ ...p, academicTitle: e.target.value }))}
                      />
                    </Field>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="areas-of-expertise">Areas of expertise</FieldLabel>
                        <Input
                          id="areas-of-expertise"
                          placeholder="e.g. AI, software engineering"
                          value={profile.areasOfExpertise}
                          onChange={(e) => setProfile((p) => ({ ...p, areasOfExpertise: e.target.value }))}
                        />
                      </Field>
                      <Field className="md:col-span-2">
                        <FieldLabel htmlFor="research-interests">Research interests</FieldLabel>
                        <Textarea
                          id="research-interests"
                          rows={3}
                          placeholder="Your research interests..."
                          value={profile.researchInterests}
                          onChange={(e) => setProfile((p) => ({ ...p, researchInterests: e.target.value }))}
                        />
                      </Field>
                    </div>
                  </>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {user.role !== 'admin' && (
                      <Field>
                        <FieldLabel htmlFor="department">Department</FieldLabel>
                        <Input
                          id="department"
                          value={profile.department}
                          onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))}
                        />
                      </Field>
                    )}
                    {user.role === 'student' && (
                      <Field>
                        <FieldLabel htmlFor="year">Year</FieldLabel>
                        <Input
                          id="year"
                          type="number"
                          value={profile.year}
                          onChange={(e) => setProfile((p) => ({ ...p, year: e.target.value }))}
                        />
                      </Field>
                    )}
                  </div>
                )}
                {(user.role === 'student' || user.role === 'advisor') && (
                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel>Skills</FieldLabel>
                      {skills.length === 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1"
                          onClick={handleAddSkill}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add skill
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {skills.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No skills added yet. Click &quot;Add skill&quot; to add one.
                        </p>
                      ) : (
                        <>
                          {skills.map((skill, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Input
                                placeholder="e.g. Python, React, UX Research..."
                                value={skill}
                                onChange={(e) => handleSkillChange(idx, e.target.value)}
                                aria-label={`Skill ${idx + 1}`}
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveSkill(idx)}
                                aria-label={`Remove skill ${idx + 1}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-center gap-2 border-dashed"
                            onClick={handleAddSkill}
                          >
                            <Plus className="h-4 w-4" />
                            Add another skill
                          </Button>
                        </>
                      )}
                    </div>
                  </Field>
                )}
                {user.role === 'student' && (
                  <>
                    <Field>
                      <FieldLabel htmlFor="interests">Interests</FieldLabel>
                      <Input
                        id="interests"
                        placeholder="AI, Web Development, Data Science..."
                        value={profile.interests}
                        onChange={(e) => setProfile((p) => ({ ...p, interests: e.target.value }))}
                      />
                    </Field>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="github-link">GitHub Link</FieldLabel>
                        <Input
                          id="github-link"
                          placeholder="https://github.com/username"
                          value={profile.githubLink}
                          onChange={(e) => setProfile((p) => ({ ...p, githubLink: e.target.value }))}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="linkedin-link">LinkedIn Link</FieldLabel>
                        <Input
                          id="linkedin-link"
                          placeholder="https://linkedin.com/in/username"
                          value={profile.linkedinLink}
                          onChange={(e) => setProfile((p) => ({ ...p, linkedinLink: e.target.value }))}
                        />
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="biography">Biography</FieldLabel>
                      <Textarea
                        id="biography"
                        rows={4}
                        placeholder="A short bio about yourself..."
                        value={profile.biography}
                        onChange={(e) => setProfile((p) => ({ ...p, biography: e.target.value }))}
                      />
                    </Field>
                  </>
                )}
              </FieldGroup>

              {saveMessage ? <p className="text-sm text-accent">{saveMessage}</p> : null}
              <Button onClick={handleSaveProfile}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {!isAdmin ? (
          <>
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose what notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup className="gap-5">
                    <Field orientation="horizontal" className="items-center gap-3">
                      <FieldContent className="min-w-0">
                        <FieldLabel className="text-base">Email Notifications</FieldLabel>
                        <FieldDescription>Receive notifications via email</FieldDescription>
                      </FieldContent>
                      <Switch
                        className="shrink-0"
                        checked={notifications.email}
                        onCheckedChange={(checked) => setNotifications((n) => ({ ...n, email: checked }))}
                      />
                    </Field>
                    <Field orientation="horizontal" className="items-center gap-3">
                      <FieldContent className="min-w-0">
                        <FieldLabel className="text-base">Announcements</FieldLabel>
                        <FieldDescription>Get notified about new announcements</FieldDescription>
                      </FieldContent>
                      <Switch
                        className="shrink-0"
                        checked={notifications.announcements}
                        onCheckedChange={(checked) =>
                          setNotifications((n) => ({ ...n, announcements: checked }))
                        }
                      />
                    </Field>
                    <Field orientation="horizontal" className="items-center gap-3">
                      <FieldContent className="min-w-0">
                        <FieldLabel className="text-base">Request Updates</FieldLabel>
                        <FieldDescription>Get notified about advisor request updates</FieldDescription>
                      </FieldContent>
                      <Switch
                        className="shrink-0"
                        checked={notifications.requests}
                        onCheckedChange={(checked) =>
                          setNotifications((n) => ({ ...n, requests: checked }))
                        }
                      />
                    </Field>
                    <Field orientation="horizontal" className="items-center gap-3">
                      <FieldContent className="min-w-0">
                        <FieldLabel className="text-base">Deadline Reminders</FieldLabel>
                        <FieldDescription>Get reminded about upcoming deadlines</FieldDescription>
                      </FieldContent>
                      <Switch
                        className="shrink-0"
                        checked={notifications.deadlines}
                        onCheckedChange={(checked) =>
                          setNotifications((n) => ({ ...n, deadlines: checked }))
                        }
                      />
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        ) : null}

      </Tabs>
    </div>
  )
}
