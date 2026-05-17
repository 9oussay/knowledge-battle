"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  Layers3,
  Loader2,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

type AdminUser = {
  id: string
  username: string
  email: string
  role: "USER" | "ADMIN"
  rank: string
  xp: number
  isSponsor: boolean
  sessionsCount: number
  createdAt: string
}

type AdminCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  questionCount: number
  createdAt: string
}

type AdminQuestion = {
  id: string
  category: string
  difficulty: string
  question: string
  choices: string[]
  answer: number
  points: number
}

type RecentSession = {
  id: string
  category: string
  score: number
  total: number
  xpEarned: number
  username: string
  createdAt: string
}

type AdminConsoleProps = {
  initialUsers: AdminUser[]
  initialCategories: AdminCategory[]
  initialQuestions: AdminQuestion[]
  initialRecentSessions: RecentSession[]
}

type FeedbackState = {
  type: "success" | "error"
  message: string
}

async function extractErrorMessage(response: Response, fallback: string) {
  try {
    const json = (await response.json()) as { error?: string }
    return json.error ?? fallback
  } catch {
    return fallback
  }
}

export function AdminConsole({
  initialUsers,
  initialCategories,
  initialQuestions,
  initialRecentSessions,
}: AdminConsoleProps) {
  const [users, setUsers] = useState(initialUsers)
  const [categories, setCategories] = useState(initialCategories)
  const [questions, setQuestions] = useState(initialQuestions)
  const [recentSessions] = useState(initialRecentSessions)

  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  const [searchUsers, setSearchUsers] = useState("")
  const [questionFilter, setQuestionFilter] = useState<string>("all")

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editRole, setEditRole] = useState<"USER" | "ADMIN">("USER")
  const [editRank, setEditRank] = useState("")
  const [editXp, setEditXp] = useState(0)
  const [editSponsor, setEditSponsor] = useState(false)
  const [savingUser, setSavingUser] = useState(false)

  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")
  const [creatingCategory, setCreatingCategory] = useState(false)

  const [newQuestionCategory, setNewQuestionCategory] = useState("")
  const [newQuestionDifficulty, setNewQuestionDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium")
  const [newQuestionText, setNewQuestionText] = useState("")
  const [newQuestionChoices, setNewQuestionChoices] = useState(["", "", "", ""])
  const [newQuestionAnswer, setNewQuestionAnswer] = useState("0")
  const [newQuestionPoints, setNewQuestionPoints] = useState("10")
  const [creatingQuestion, setCreatingQuestion] = useState(false)

  useEffect(() => {
    if (!newQuestionCategory && categories.length > 0) {
      setNewQuestionCategory(categories[0].name)
    }
  }, [categories, newQuestionCategory])

  const stats = useMemo(() => {
    const totalUsers = users.length
    const totalXp = users.reduce((acc, user) => acc + user.xp, 0)
    const totalSessions = users.reduce((acc, user) => acc + user.sessionsCount, 0)

    return {
      totalUsers,
      totalXp,
      totalSessions,
      avgXp: totalUsers > 0 ? Math.round(totalXp / totalUsers) : 0,
    }
  }, [users])

  const topPlayers = useMemo(
    () => [...users].sort((a, b) => b.xp - a.xp).slice(0, 5),
    [users],
  )

  const filteredUsers = useMemo(() => {
    const query = searchUsers.trim().toLowerCase()
    if (!query) return users

    return users.filter((user) => {
      return user.username.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
    })
  }, [users, searchUsers])

  const filteredQuestions = useMemo(() => {
    if (questionFilter === "all") return questions
    return questions.filter((question) => question.category === questionFilter)
  }, [questionFilter, questions])

  function openUserDialog(user: AdminUser) {
    setEditingUser(user)
    setEditRole(user.role)
    setEditRank(user.rank)
    setEditXp(user.xp)
    setEditSponsor(user.isSponsor)
  }

  function resetQuestionForm() {
    setNewQuestionText("")
    setNewQuestionChoices(["", "", "", ""])
    setNewQuestionAnswer("0")
    setNewQuestionPoints(newQuestionDifficulty === "Easy" ? "5" : newQuestionDifficulty === "Hard" ? "20" : "10")
  }

  async function refreshUsers() {
    setLoadingUsers(true)
    try {
      const response = await fetch("/api/admin/users")
      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, "Impossible de charger les utilisateurs"))
      }

      const data = (await response.json()) as { users: AdminUser[] }
      setUsers(data.users)
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Impossible de charger les utilisateurs",
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  async function refreshCategories() {
    setLoadingCategories(true)
    try {
      const response = await fetch("/api/admin/categories")
      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, "Impossible de charger les categories"))
      }

      const data = (await response.json()) as { categories: AdminCategory[] }
      setCategories(data.categories)
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Impossible de charger les categories",
      })
    } finally {
      setLoadingCategories(false)
    }
  }

  async function refreshQuestions() {
    setLoadingQuestions(true)
    try {
      const response = await fetch("/api/admin/questions?limit=200")
      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, "Impossible de charger les questions"))
      }

      const data = (await response.json()) as { questions: AdminQuestion[] }
      setQuestions(data.questions)
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Impossible de charger les questions",
      })
    } finally {
      setLoadingQuestions(false)
    }
  }

  async function saveUserChanges() {
    if (!editingUser) return

    setSavingUser(true)
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: editRole,
          rank: editRank,
          xp: editXp,
          isSponsor: editSponsor,
        }),
      })

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, "La mise a jour de l'utilisateur a echoue"))
      }

      await refreshUsers()
      setFeedback({ type: "success", message: `Profil ${editingUser.username} mis a jour.` })
      setEditingUser(null)
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "La mise a jour de l'utilisateur a echoue",
      })
    } finally {
      setSavingUser(false)
    }
  }

  async function createCategory() {
    const name = newCategoryName.trim()
    if (!name) {
      setFeedback({ type: "error", message: "Le nom de categorie est requis." })
      return
    }

    setCreatingCategory(true)
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: newCategoryDescription.trim() || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, "Creation de categorie impossible"))
      }

      const data = (await response.json()) as { category: AdminCategory }
      setCategories((prev) => [data.category, ...prev])
      if (!newQuestionCategory) {
        setNewQuestionCategory(data.category.name)
      }
      setNewCategoryName("")
      setNewCategoryDescription("")
      setFeedback({ type: "success", message: `Categorie ${data.category.name} creee.` })
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Creation de categorie impossible",
      })
    } finally {
      setCreatingCategory(false)
    }
  }

  async function createQuestion() {
    if (!newQuestionCategory) {
      setFeedback({ type: "error", message: "Selectionne une categorie pour cette question." })
      return
    }

    const normalizedChoices = newQuestionChoices.map((choice) => choice.trim())
    if (normalizedChoices.some((choice) => choice.length === 0)) {
      setFeedback({ type: "error", message: "Les 4 propositions doivent etre renseignees." })
      return
    }

    const parsedPoints = Number(newQuestionPoints)
    if (!Number.isInteger(parsedPoints) || parsedPoints < 1) {
      setFeedback({ type: "error", message: "Le nombre de points est invalide." })
      return
    }

    setCreatingQuestion(true)
    try {
      const response = await fetch("/api/admin/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: newQuestionCategory,
          difficulty: newQuestionDifficulty,
          question: newQuestionText,
          choices: normalizedChoices,
          answer: Number(newQuestionAnswer),
          points: parsedPoints,
        }),
      })

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, "Creation de question impossible"))
      }

      const data = (await response.json()) as { question: AdminQuestion }
      setQuestions((prev) => [data.question, ...prev])
      setCategories((prev) =>
        prev.map((category) =>
          category.name === data.question.category
            ? { ...category, questionCount: category.questionCount + 1 }
            : category,
        ),
      )
      resetQuestionForm()
      setFeedback({ type: "success", message: "Question ajoutee avec succes." })
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Creation de question impossible",
      })
    } finally {
      setCreatingQuestion(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <Card className="bg-card/70 border-border/80 backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl">Admin Control Center</CardTitle>
            <CardDescription>Gere les joueurs, categories et banques de questions depuis une seule interface.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full bg-transparent" onClick={refreshUsers} disabled={loadingUsers}>
              {loadingUsers ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
              Sync users
            </Button>
            <Button
              variant="outline"
              className="rounded-full bg-transparent"
              onClick={refreshCategories}
              disabled={loadingCategories}
            >
              {loadingCategories ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Layers3 className="mr-2 h-4 w-4" />}
              Sync categories
            </Button>
            <Button variant="outline" className="rounded-full bg-transparent" onClick={refreshQuestions} disabled={loadingQuestions}>
              {loadingQuestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Sync questions
            </Button>
          </div>
        </CardHeader>
      </Card>

      {feedback ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : null}
            <span>{feedback.message}</span>
          </div>
        </div>
      ) : null}

      <Tabs defaultValue="overview" className="gap-4">
        <TabsList className="h-10 w-full justify-start rounded-xl bg-card/60 p-1 sm:w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="bg-card/70 border-border/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{stats.totalUsers}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/70 border-border/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Duels joues</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{stats.totalSessions}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/70 border-border/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">XP cumulee</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{stats.totalXp}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/70 border-border/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">XP moyenne</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{stats.avgXp}</p>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2 bg-card/70 border-border/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Activite recente</CardTitle>
                <CardDescription>Derniers duels joues sur la plateforme.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune activite recente.</p>
                ) : (
                  recentSessions.map((session) => {
                    const percent = session.total > 0 ? Math.round((session.score / session.total) * 100) : 0
                    return (
                      <div key={session.id} className="rounded-xl border border-border bg-background/30 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{session.username}</p>
                            <p className="text-xs text-muted-foreground">{session.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{percent}%</p>
                            <p className="text-xs text-yellow-400">+{session.xpEarned} XP</p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-border/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Top joueurs</CardTitle>
                <CardDescription>Classement base sur l'XP actuelle.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topPlayers.map((player, index) => (
                  <div key={player.id} className="rounded-xl border border-border bg-background/30 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        #{index + 1} {player.username}
                      </p>
                      <Badge>{player.xp} XP</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{player.rank}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="bg-card/70 border-border/80 backdrop-blur-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Gestion utilisateurs</CardTitle>
                <CardDescription>Edite le role, le rang, l'XP et le statut sponsor.</CardDescription>
              </div>
              <Input
                value={searchUsers}
                onChange={(event) => setSearchUsers(event.target.value)}
                placeholder="Rechercher par pseudo ou email"
                className="w-full sm:max-w-xs"
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Rang</TableHead>
                    <TableHead>XP</TableHead>
                    <TableHead>Duels</TableHead>
                    <TableHead className="w-[60px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>{user.rank}</TableCell>
                      <TableCell>{user.xp}</TableCell>
                      <TableCell>{user.sessionsCount}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="rounded-full">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => openUserDialog(user)}>Modifier le profil</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="bg-card/70 border-border/80 backdrop-blur-sm xl:col-span-1">
            <CardHeader>
              <CardTitle>Creer une categorie</CardTitle>
              <CardDescription>Ajoute une nouvelle categorie visible dans les duels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Nom</Label>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="Ex: Kubernetes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-description">Description</Label>
                <Textarea
                  id="category-description"
                  value={newCategoryDescription}
                  onChange={(event) => setNewCategoryDescription(event.target.value)}
                  placeholder="Description courte pour l'interface duel"
                />
              </div>
              <Button className="w-full rounded-full" onClick={createCategory} disabled={creatingCategory}>
                {creatingCategory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Ajouter la categorie
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/70 border-border/80 backdrop-blur-sm xl:col-span-2">
            <CardHeader>
              <CardTitle>Catalogue categories</CardTitle>
              <CardDescription>Suivi des categories et volume de questions associees.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categorie</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-xs text-muted-foreground">{category.description || "Pas de description"}</p>
                        </div>
                      </TableCell>
                      <TableCell>{category.slug}</TableCell>
                      <TableCell>{category.questionCount}</TableCell>
                      <TableCell>
                        <Badge variant={category.isActive ? "default" : "outline"}>
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <Card className="bg-card/70 border-border/80 backdrop-blur-sm xl:col-span-2">
            <CardHeader>
              <CardTitle>Ajouter une question</CardTitle>
              <CardDescription>Construit une question avec 4 choix et une bonne reponse.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Categorie</Label>
                <Select value={newQuestionCategory} onValueChange={setNewQuestionCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selectionner une categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Difficulte</Label>
                  <Select
                    value={newQuestionDifficulty}
                    onValueChange={(value: "Easy" | "Medium" | "Hard") => {
                      setNewQuestionDifficulty(value)
                      setNewQuestionPoints(value === "Easy" ? "5" : value === "Hard" ? "20" : "10")
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Points</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={newQuestionPoints}
                    onChange={(event) => setNewQuestionPoints(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Question</Label>
                <Textarea
                  value={newQuestionText}
                  onChange={(event) => setNewQuestionText(event.target.value)}
                  placeholder="Ecris l'enonce complet de la question"
                />
              </div>

              <div className="space-y-3">
                <Label>Propositions</Label>
                {newQuestionChoices.map((choice, index) => (
                  <Input
                    key={index}
                    value={choice}
                    onChange={(event) =>
                      setNewQuestionChoices((prev) => prev.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
                    }
                    placeholder={`Choix ${index + 1}`}
                  />
                ))}
              </div>

              <div className="space-y-2">
                <Label>Bonne reponse</Label>
                <Select value={newQuestionAnswer} onValueChange={setNewQuestionAnswer}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Choix 1</SelectItem>
                    <SelectItem value="1">Choix 2</SelectItem>
                    <SelectItem value="2">Choix 3</SelectItem>
                    <SelectItem value="3">Choix 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full rounded-full" onClick={createQuestion} disabled={creatingQuestion}>
                {creatingQuestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Ajouter la question
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/70 border-border/80 backdrop-blur-sm xl:col-span-3">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Banque de questions</CardTitle>
                <CardDescription>Visualise les questions publiees et leur bonne reponse.</CardDescription>
              </div>
              <Select value={questionFilter} onValueChange={setQuestionFilter}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Filtrer par categorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead>Difficulte</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Reponse</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.slice(0, 80).map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="max-w-[360px] truncate" title={question.question}>
                        {question.question}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{question.category}</Badge>
                      </TableCell>
                      <TableCell>{question.difficulty}</TableCell>
                      <TableCell>{question.points}</TableCell>
                      <TableCell className="max-w-[220px] truncate" title={question.choices[question.answer]}>
                        {question.choices[question.answer]}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingUser} onOpenChange={(open) => (!open ? setEditingUser(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier {editingUser?.username}</DialogTitle>
            <DialogDescription>Adapte les droits et metadonnees du joueur.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(value: "USER" | "ADMIN") => setEditRole(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Rang</Label>
                <Input value={editRank} onChange={(event) => setEditRank(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>XP</Label>
                <Input
                  type="number"
                  min={0}
                  value={editXp}
                  onChange={(event) => setEditXp(Math.max(0, Number(event.target.value || "0")))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                Statut sponsor
              </div>
              <Switch checked={editSponsor} onCheckedChange={setEditSponsor} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="bg-transparent" onClick={() => setEditingUser(null)}>
              Annuler
            </Button>
            <Button onClick={saveUserChanges} disabled={savingUser}>
              {savingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
