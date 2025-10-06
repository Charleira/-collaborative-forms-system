"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { duplicate } from '@/components/duplicate'
import { MoreHorizontal, Eye, Edit, Share, Trash2, BarChart3, ForwardIcon, PlusIcon, QrCodeIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { QRCodeCustomizer } from "@/components/qrcode"

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
  
  // Estado para controlar qual dropdown está aberto (apenas um por vez)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  
  
// ✅ Estado para o QRCodeCustomizer
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  // Estado para armazenar a posição calculada do dropdown
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)

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

  /**
   * Função para calcular e definir a posição do dropdown menu
   * Solução implementada para resolver o problema de posicionamento do menu
   * que aparecia no canto superior esquerdo em vez de próximo aos 3 pontinhos
   */
  const handleDropdownOpen = (formId: string, event: React.MouseEvent) => {
    const button = event.currentTarget as HTMLElement
    const rect = button.getBoundingClientRect()
    
    // Calcular posição: ao lado direito dos 3 pontinhos
    // top: mesma altura do botão (não embaixo)
    // left: 4px de espaçamento à direita do botão
    const top = rect.top
    const left = rect.left - 20
    
    setDropdownPosition({ top, left })
    setOpenDropdown(formId)
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
                {/* 
                  DropdownMenu com estado controlado para garantir que apenas um menu esteja aberto por vez
                */}
                <DropdownMenu 
                  open={openDropdown === form.id}
                  onOpenChange={(open) => {
                    // Fechar dropdown e limpar posição quando o menu é fechado
                    if (!open) {
                      setOpenDropdown(null);
                      setDropdownPosition(null);
                    }
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        handleDropdownOpen(form.id, e);
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Abrir menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  {/* 
                    DropdownMenuContent com posicionamento customizado
                    Usa position: fixed com coordenadas calculadas dinamicamente
                    para garantir que o menu apareça próximo aos 3 pontinhos clicados
                  */}
                  <DropdownMenuContent 
                    align="end" 
                    side="bottom" 
                    sideOffset={4}
                    collisionPadding={8}
                    avoidCollisions={true}
                    style={dropdownPosition ? {
                      position: "fixed",
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                      zIndex: 9999,
                    } : undefined}
                  >
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
                    <DropdownMenuItem onClick={async () => {
                      try {
                        const newId = await duplicate(form.id);
                        // Se quiser apenas atualizar a lista:
                        // router.refresh();
                        // Ou redirecionar para edição do novo formulário:
                        // router.push(`/forms/${newId}/edit`);
                      } catch (err) {
                        console.error(err);
                        alert('Erro ao duplicar formulário. Tente novamente.');
                      }
                     }}>

                    <PlusIcon className="h-4 w-4 mr-2"/>
                       Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={() => {
                          setSelectedFormId(form.id);
                          setQrOpen(true);
                        }}
                        className="flex items-center"
                      >
                        <QrCodeIcon className="h-4 w-4 mr-2" />
                        Gerar QRCODE
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
