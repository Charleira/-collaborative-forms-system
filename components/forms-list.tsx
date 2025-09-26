"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { MoreHorizontal, Eye, Edit, Share, Trash2, BarChart3 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface Form {
  id: string
  title: string
  description: string | null
  is_public: boolean
  is_active: boolean
  created_at: string
  form_items: { count: number }[]
  form_responses: { count: number }[]
}

interface FormsListProps {
  forms: Form[]
}

export function FormsList({ forms: initialForms }: FormsListProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [forms, setForms] = useState<Form[]>(initialForms)

  useEffect(() => {
    setForms(initialForms)
  }, [initialForms])

  const refreshForms = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: updatedForms } = await supabase
        .from("forms")
        .select(`
          *,
          form_items(count),
          form_responses(count)
        `)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })

      if (updatedForms) {
        setForms(updatedForms)
      }
    }
  }

  useEffect(() => {
    const interval = setInterval(refreshForms, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleDelete = async (formId: string) => {
    if (!confirm("Tem certeza que deseja excluir este formulário? Esta ação não pode ser desfeita.")) {
      return
    }

    setIsDeleting(formId)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("forms").delete().eq("id", formId)
      if (error) throw error

      setForms(forms.filter((form) => form.id !== formId))
      router.refresh()
      await refreshForms()
    } catch (error) {
      console.error("Erro ao excluir formulário:", error)
      alert("Erro ao excluir formulário. Tente novamente.")
    } finally {
      setIsDeleting(null)
    }
  }

  const copyShareLink = (formId: string) => {
    const shareUrl = `${window.location.origin}/form/${formId}`
    navigator.clipboard.writeText(shareUrl)
    alert("Link copiado para a área de transferência!")
  }

  if (forms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Você ainda não criou nenhum formulário.</p>
        <Button asChild>
          <Link href="/dashboard/forms/new">Criar Primeiro Formulário</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {forms.map((form) => (
        <Card key={form.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{form.title}</CardTitle>
                {form.description && <CardDescription>{form.description}</CardDescription>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={form.is_active ? "default" : "secondary"}>{form.is_active ? "Ativo" : "Inativo"}</Badge>
                <Badge variant={form.is_public ? "outline" : "secondary"}>
                  {form.is_public ? "Público" : "Privado"}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Abrir menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <Link href={`/form/${form.id}`} className="flex items-center">
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/forms/${form.id}/edit`} className="flex items-center">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/forms/${form.id}/analytics`} className="flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyShareLink(form.id)}>
                      <Share className="h-4 w-4 mr-2" />
                      Copiar Link
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(form.id)}
                      disabled={isDeleting === form.id}
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting === form.id ? "Excluindo..." : "Excluir"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span>{form.form_items?.[0]?.count || 0} itens</span>
                <span>{form.form_responses?.[0]?.count || 0} respostas</span>
              </div>
              <span>Criado em {new Date(form.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
