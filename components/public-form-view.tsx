// public-form-view.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Send, AlertCircle, HelpCircle } from "lucide-react"
import { CustomQuestionsRenderer } from "@/components/custom-questions-renderer"
import type { CustomQuestion } from "@/components/question-editor"

// --- Driver.js (tour) ---

import { driver } from "driver.js"
import type { DriveStep } from "driver.js" // ✅ importa o tipo
import "driver.js/dist/driver.css"

interface FormItem {
  id: string
  name: string
  description: string | null
  current_stock: number
  max_per_response: number
  price: number
}
interface Form {
  id: string
  title: string
  description: string | null
  created_at: string
  custom_questions?: CustomQuestion[]
}
interface PublicFormViewProps {
  form: Form
  items: FormItem[]
}

export function PublicFormView({ form, items }: PublicFormViewProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [availableItems, setAvailableItems] = useState<FormItem[]>([])
  const [respostas_personalizadas, setrespostas_personalizadas] = useState<Record<string, any>>({})
  const [respondentData, setRespondentData] = useState({
    customerName: "",
    customerCNPJ: "",
    orderAmount: 0,
    representativeName: "",
    representativeEmail: "",
    customerEmail: "",
    notes: "",
    brinde_negociado: "",
    respostas_personalizadas: "",
  })

  useEffect(() => {
    console.log("[v0] PublicFormView component mounted/remounted")
    console.log("[v0] Initial respondentData:", respondentData)
  }, [])

  const resetForm = () => {
    console.log("[v0] Resetting form...")
    setRespondentData({
      customerName: "",
      customerCNPJ: "",
      orderAmount: 0,
      representativeName: "",
      representativeEmail: "",
      customerEmail: "",
      notes: "",
      brinde_negociado: "",
      respostas_personalizadas: "",
    })
    setSelectedItems({})
    setAvailableItems([])
    setrespostas_personalizadas({})
    console.log("[v0] Form reset completed")
  }

  useEffect(() => {
    if (respondentData.orderAmount > 0) {
      const filtered = items.filter(
        (item) => item.price <= respondentData.orderAmount && item.current_stock > 0,
      )
      setAvailableItems(filtered)

      // Remove selected items que não estão mais disponíveis
      const newSelectedItems: Record<string, number> = {}
      Object.entries(selectedItems).forEach(([itemId, quantity]) => {
        if (filtered.some((item) => item.id === itemId)) {
          newSelectedItems[itemId] = quantity
        }
      })
      setSelectedItems(newSelectedItems)
    } else {
      setAvailableItems([])
      setSelectedItems({})
    }
  }, [respondentData.orderAmount, items]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleItemToggle = (itemId: string, checked: boolean) => {
    if (checked) {
      // Seleciona apenas o item atual, removendo os demais
      setSelectedItems({ [itemId]: 1 })
    } else {
      // Desmarca o item
      const updatedItems = { ...selectedItems }
      delete updatedItems[itemId]
      setSelectedItems(updatedItems)
    }
  }

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const item = availableItems.find((i) => i.id === itemId)
    if (!item) return
    const maxQuantity = Math.min(item.max_per_response, item.current_stock)
    const validQuantity = Math.max(1, Math.min(quantity, maxQuantity))
    setSelectedItems({ ...selectedItems, [itemId]: validQuantity })
  }

  const getTotalValue = () => {
    return Object.entries(selectedItems).reduce((total, [itemId, quantity]) => {
      const item = availableItems.find((i) => i.id === itemId)
      return total + (item ? item.price * quantity : 0)
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] handleSubmit called")
    console.log("[v0] Current respondentData:", respondentData)
    console.log("[v0] Custom answers:", respostas_personalizadas)

    const customQuestions = form.custom_questions ?? []
    for (const question of customQuestions) {
      if (question.required) {
        const answer = respostas_personalizadas[question.id]
        if (
          !answer ||
          (Array.isArray(answer) && answer.length === 0) ||
          answer.toString().trim() === ""
        ) {
          alert(`Por favor, responda a pergunta obrigatória: ${question.label}`)
          return
        }
      }
    }

    if (!respondentData.customerName.trim()) {
      console.log("[v0] Validation failed: customerName empty")
      alert("Por favor, preencha o nome do cliente.")
      return
    }
    if (!respondentData.customerCNPJ.trim()) {
      console.log("[v0] Validation failed: customerCNPJ empty")
      alert("Por favor, preencha o CNPJ e/ou Grupo Econômico.")
      return
    }
    if (respondentData.orderAmount <= 0) {
      console.log("[v0] Validation failed: orderAmount invalid")
      alert("Por favor, informe o valor do pedido negociado.")
      return
    }
    if (!respondentData.representativeName.trim()) {
      console.log("[v0] Validation failed: representativeName empty")
      alert("Por favor, preencha o nome do representante responsável.")
      return
    }
    if (!respondentData.representativeEmail.trim()) {
      console.log("[v0] Validation failed: representativeEmail empty")
      alert("Por favor, preencha o email do representante responsável.")
      return
    }
    if (!respondentData.customerEmail.trim()) {
      console.log("[v0] Validation failed: customerEmail empty")
      alert("Por favor, preencha o email do cliente.")
      return
    }
    if (Object.keys(selectedItems).length === 0) {
      console.log("[v0] Validation failed: no items selected")
      alert("Por favor, selecione pelo menos um item.")
      return
    }

    const totalValue = getTotalValue()
    if (totalValue > respondentData.orderAmount) {
      console.log("[v0] Validation failed: total value exceeds order amount")
      alert(
        `O valor total dos itens selecionados (R$ ${totalValue.toFixed(
          2,
        )}) excede o valor do pedido negociado (R$ ${respondentData.orderAmount.toFixed(2)}).`,
      )
      return
    }

    console.log("[v0] All validations passed, proceeding with submission")
    setIsLoading(true)
    const supabase = createClient()

    const brindeNegociado = Object.keys(selectedItems).map((itemId) => {
      const item = availableItems.find((i) => i.id === itemId)
      return item?.name ?? itemId // usa o nome se encontrar, senão mantém o ID
    })

    try {
      const formData = {
        form_id: form.id,
        nome_cliente: respondentData.customerName.trim(),
        cnpj_grupo_economico: respondentData.customerCNPJ.trim(),
        valor_venda: respondentData.orderAmount,
        representante_email: respondentData.representativeEmail.trim(),
        nome_vendedor: respondentData.representativeName.trim(), // Always use representative name
        cliente_email: respondentData.customerEmail.trim(),
        observações: respondentData.notes?.trim() ?? null,
        brinde_negociado: JSON.stringify(brindeNegociado),
        respostas_personalizadas: respostas_personalizadas,
      }

      console.log("[v0] Form data being sent:", formData)
      console.log("[v0] Representative name:", formData.nome_vendedor)
      console.log("[v0] Seller name (should be same as representative):", formData.nome_vendedor)

      if (!formData.nome_vendedor || formData.nome_vendedor.trim() === "") {
        console.error("[v0] CRITICAL ERROR: seller_name is empty!")
        throw new Error("Nome do representante não pode estar vazio")
      }

      // Create form response
      const { data: response, error: responseError } = await supabase
        .from("form_responses")
        .insert(formData)
        .select()
        .single()

      if (responseError) {
        console.error("[v0] Database error:", responseError)
        throw responseError
      }

      console.log("[v0] Form response created successfully:", response)

      // Create response items
      const responseItems = Object.entries(selectedItems).map(([itemId, quantity]) => ({
        response_id: response!.id,
        form_item_id: itemId,
        quantity,
      }))

      const { error: itemsError } = await supabase.from("response_items").insert(responseItems)
      if (itemsError) {
        console.error("[v0] Items error:", itemsError)
        throw itemsError
      }

    for (const [itemId, quantity] of Object.entries(selectedItems)) {
      const { data: itemData, error: fetchError } = await supabase
        .from("form_items") // substitua pelo nome correto da tabela
        .select("current_stock")
        .eq("id", itemId)
        .single()

      if (fetchError || !itemData || typeof itemData.current_stock !== "number") {
        console.error(`[v0] Erro ao buscar estoque do item ${itemId}:`, fetchError)
        alert(`Erro ao buscar estoque do item ${itemId}.`)
        return
      }

      const novoEstoque = Math.max(0, itemData.current_stock - quantity)

      const { error: updateError } = await supabase
        .from("form_items")
        .update({ current_stock: novoEstoque })
        .eq("id", itemId)

      if (updateError) {
        console.error(`[v0] Erro ao atualizar estoque do item ${itemId}:`, updateError)
        alert(`Erro ao atualizar o estoque do item ${itemId}.`)
        return
      }
    }


      console.log("[v0] Response items created successfully")
      console.log("[v0] Navigating to success page...")
      router.push(`/form/${form.id}/success`)
    } catch (error) {
      console.error("[v0] Error submitting form:", error)
      alert(
        `Erro ao enviar resposta: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }. Tente novamente.`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  // --------------- TUTORIAL (driver.js) ---------------

  const TOUR_KEY = `public-form-${form.id}-lastTourAt`
  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000

  function buildTourSteps(): DriveStep[] {
  const hasCustomQuestions =
    !!(form.custom_questions && form.custom_questions.length > 0)

  const hasItemsSection =
    typeof window !== "undefined" && !!document.querySelector("#items-section")

  const steps: DriveStep[] = []

  steps.push({
    element: "#customerName",
    popover: {
      title: "Nome do cliente",
      description: "Informe o nome completo do cliente.",
      side: "bottom",
      align: "start",
    },
  })

  steps.push({
    element: "#customerCNPJ",
    popover: {
      title: "CNPJ / Grupo Econômico",
      description:
        "Inclua os CNPJs ou nomes dos grupos econômicos envolvidos (um por linha ou separados por vírgula).",
      side: "bottom",
      align: "start",
    },
  })

  steps.push({
    element: "#orderAmount",
    popover: {
      title: "Valor do pedido negociado",
      description:
        "Defina o valor negociado. Os itens elegíveis aparecerão de acordo com este valor.",
      side: "bottom",
      align: "start",
    },
  })

  if (hasCustomQuestions) {
    steps.push({
      element: "#custom-questions",
      popover: {
        title: "Informações adicionais",
        description:
          "Responda às perguntas personalizadas do formulário (se houver).",
        side: "top",
        align: "start",
      },
    })
  }

  if (hasItemsSection) {
    steps.push({
      element: "#items-section",
      popover: {
        title: "Seleção de itens",
        description:
          "Selecione o item e, quando permitido, ajuste a quantidade. O total não pode exceder o valor do pedido.",
        side: "top",
        align: "start",
      },
    })
  } else {
    steps.push({
      element: "#orderAmount",
      popover: {
        title: "Seleção de itens",
        description:
          "Após informar o valor do pedido, a seção de itens aparecerá logo abaixo.",
        side: "bottom",
        align: "start",
      },
    })
  }

  steps.push(
    {
      element: "#representativeName",
      popover: {
        title: "Representante responsável",
        description: "Nome do representante responsável pelo cliente.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#representativeEmail",
      popover: {
        title: "E-mail do representante",
        description: "O representante será incluído automaticamente no circuito de e-mails.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#customerEmail",
      popover: {
        title: "E-mail do cliente",
        description: "O cliente receberá o código de resgate do brinde neste e-mail.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#notes",
      popover: {
        title: "Observações",
        description: "Inclua aqui qualquer observação adicional, se necessário.",
        side: "top",
        align: "start",
      },
    },
    {
      element: "#submit-btn",
      popover: {
        title: "Enviar resposta",
        description: "Após preencher tudo e escolher o item, clique para enviar.",
        side: "top",
        align: "end",
      },
    },
    {
      element: "#open-tour",
      popover: {
        title: "Precisa rever?",
        description:
          "Use este botão (?) no topo direito para reabrir o tutorial a qualquer momento.",
        side: "left",
        align: "center",
      },
    },
  )

  return steps
}


  const startTour = () => {
    const d = driver({
      showProgress: true,
      allowClose: true,
      overlayClickBehavior: "nextStep",
      smoothScroll: true,
      overlayOpacity: 0.5,
      stagePadding: 8,
      popoverClass: "driverjs-shadcn",
      steps: buildTourSteps(),
    })
    d.drive()
    try {
      localStorage.setItem(TOUR_KEY, String(Date.now()))
    } catch {}
  }

  useEffect(() => {
    try {
      const last = Number(localStorage.getItem(TOUR_KEY) || 0)
      const now = Date.now()
      if (!last || now - last > TWELVE_HOURS_MS) {
        setTimeout(() => startTour(), 300) // garante DOM pronto
      }
    } catch {
      // se localStorage indisponível, apenas ignora
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --------------- /TUTORIAL ---------------

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Botão flutuante: abre tutorial */}
      <Button
        id="open-tour"
        type="button"
        variant="outline"
        size="icon"
        onClick={startTour}
        className="fixed top-4 right-4 z-[60] rounded-full"
        aria-label="Abrir tutorial"
        title="Abrir tutorial"
      >
        <HelpCircle className="h-5 w-5" />
        <span className="sr-only">Abrir tutorial</span>
      </Button>

      {/* Form Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{form.title}</CardTitle>
          {form.description && (
            <CardDescription className="text-base">{form.description}</CardDescription>
          )}
          <div className="text-sm text-muted-foreground">
            Criado em {new Date(form.created_at).toLocaleDateString("pt-BR")}
          </div>
        </CardHeader>
      </Card>

      {/* Card de Informações da Negociação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações da Negociação *</CardTitle>
          <CardDescription>Todos os campos são obrigatórios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">1. Informe o nome do cliente *</Label>
              <Input
                id="customerName"
                value={respondentData.customerName}
                onChange={(e) =>
                  setRespondentData({ ...respondentData, customerName: e.target.value })
                }
                placeholder="Nome completo do cliente"
                required
              />
            </div>

            <div>
              <Label htmlFor="customerCNPJ">2. Informe o CNPJ e/ou Grupo Econômico *</Label>
              <Textarea
                id="customerCNPJ"
                value={respondentData.customerCNPJ}
                onChange={(e) =>
                  setRespondentData({ ...respondentData, customerCNPJ: e.target.value })
                }
                placeholder="Inclua os CNPJs ou nomes dos grupos econômicos envolvidos, separados por vírgula ou linha"
                required
                rows={4}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="orderAmount">
                4. Informe o valor do pedido negociado com o cliente *
              </Label>
              <Input 
              id="orderAmount"
              type="number"
              min="0"
              step="0.01"
              value={Number.isFinite(respondentData.orderAmount) ? respondentData.orderAmount : 0}
              onFocus={(e) => {
                if (respondentData.orderAmount === 0) {
                  e.currentTarget.select(); // seleciona o "0" para ser substituído
                }
              }}
              onChange={(e) =>
                setRespondentData({
                  ...respondentData,
                  orderAmount: Number.parseFloat(e.target.value.replace(",", ".")) || 0,
                })
              }
              required
              />
              {respondentData.orderAmount > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Apenas itens com valor mínimo igual ou inferior a R$ {respondentData.orderAmount.toFixed(2)} estarão
                  disponíveis
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="representativeName">
                5. Informe o nome do representante responsável pelo cliente *
              </Label>
              <Input
                id="representativeName"
                value={respondentData.representativeName}
                onChange={(e) =>
                  setRespondentData({ ...respondentData, representativeName: e.target.value })
                }
                placeholder="Nome do representante"
                required
              />
            </div>

            <div>
              <Label htmlFor="representativeEmail">
                6. Informe o email do representante responsável pelo cliente *
              </Label>
              <Input
                id="representativeEmail"
                type="email"
                value={respondentData.representativeEmail}
                onChange={(e) =>
                  setRespondentData({
                    ...respondentData,
                    representativeEmail: e.target.value,
                  })
                }
                placeholder="O representante será incluído no circuito de e-mails"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="customerEmail">7. Informe o e-mail do cliente *</Label>
              <Input
                id="customerEmail"
                type="email"
                value={respondentData.customerEmail}
                onChange={(e) =>
                  setRespondentData({ ...respondentData, customerEmail: e.target.value })
                }
                placeholder="O cliente receberá o código de resgate do brinde"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={respondentData.notes}
              onChange={(e) => setRespondentData({ ...respondentData, notes: e.target.value })}
              placeholder="Alguma observação adicional..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      {form.custom_questions && form.custom_questions.length > 0 && (
        <Card id="custom-questions">
          <CardHeader>
            <CardTitle className="text-lg">Informações Adicionais</CardTitle>
            <CardDescription>Responda às perguntas personalizadas do formulário</CardDescription>
          </CardHeader>
          <CardContent>
            <CustomQuestionsRenderer
              questions={form.custom_questions}
              answers={respostas_personalizadas}
              onChange={setrespostas_personalizadas}
              disabled={isLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Items Selection */}
      {respondentData.orderAmount > 0 && (
        <Card id="items-section">
          <CardHeader>
            <CardTitle className="text-lg">Selecione o Item</CardTitle>
            <CardDescription>
              {availableItems.length > 0
                ? `${availableItems.length} item(ns) disponível(eis) para o valor de venda de R$ ${respondentData.orderAmount.toFixed(2)}`
                : "Nenhum item disponível para este valor de venda"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableItems.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhum item disponível
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Não há itens disponíveis para o valor de venda informado ou todos estão esgotados.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableItems.map((item) => {
                  const isSelected = selectedItems[item.id] !== undefined
                  const quantity = selectedItems[item.id] ?? 1
                  const maxQuantity = Math.min(item.max_per_response, item.current_stock)

                  return (
                    <div key={item.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                      <Checkbox
                        id={item.id}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleItemToggle(item.id, checked as boolean)}
                      />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={item.id} className="text-base font-medium cursor-pointer">
                          {item.name}
                        </Label>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">Disponível: {item.current_stock}</Badge>
                          <Badge variant="outline">Máx por pessoa: {item.max_per_response}</Badge>
                          <Badge variant="default">Valor mín: R$ {item.price.toFixed(2)}</Badge>
                        </div>

                        {isSelected && maxQuantity > 1 && (
                          <div className="mt-3 flex items-center gap-2">
                            <Label htmlFor={`quantity-${item.id}`} className="text-sm">
                              Quantidade:
                            </Label>
                            <Input
                              id={`quantity-${item.id}`}
                              type="number"
                              min="1"
                              max={maxQuantity}
                              value={quantity}
                              onChange={(e) =>
                                handleQuantityChange(item.id, Number.parseInt(e.target.value) || 1)
                              }
                              className="w-20"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {Object.keys(selectedItems).length > 0 && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Valor total dos itens selecionados:</span>
                      <span className="text-lg font-bold">R$ {getTotalValue().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Valor do pedido negociado:</span>
                      <span>R$ {respondentData.orderAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          id="submit-btn"
          type="submit"
          disabled={
            isLoading ||
            Object.keys(selectedItems).length === 0 ||
            !respondentData.customerName ||
            !respondentData.customerCNPJ ||
            respondentData.orderAmount <= 0 ||
            !respondentData.representativeName ||
            !respondentData.representativeEmail ||
            !respondentData.customerEmail
          }
          size="lg"
        >
          <Send className="h-4 w-4 mr-2" />
          {isLoading ? "Enviando..." : "Enviar Resposta"}
        </Button>
      </div>
    </form>
  )}
