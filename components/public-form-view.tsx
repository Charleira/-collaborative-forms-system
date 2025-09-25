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
import { Send, AlertCircle } from "lucide-react"

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
  const [respondentData, setRespondentData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    sellerName: "",
    saleAmount: 0,
    notes: "",
  })

  useEffect(() => {
    if (respondentData.saleAmount > 0) {
      const filtered = items.filter((item) => item.price <= respondentData.saleAmount && item.current_stock > 0)
      setAvailableItems(filtered)

      // Remove selected items that are no longer available
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
  }, [respondentData.saleAmount, items])

  const handleItemToggle = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems({ ...selectedItems, [itemId]: 1 })
    } else {
      const newSelected = { ...selectedItems }
      delete newSelected[itemId]
      setSelectedItems(newSelected)
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

    if (!respondentData.customerName.trim()) {
      alert("Por favor, preencha o nome do cliente.")
      return
    }
    if (!respondentData.customerEmail.trim()) {
      alert("Por favor, preencha o email do cliente.")
      return
    }
    if (!respondentData.customerPhone.trim()) {
      alert("Por favor, preencha o telefone do cliente.")
      return
    }
    if (!respondentData.sellerName.trim()) {
      alert("Por favor, preencha o nome do vendedor.")
      return
    }
    if (respondentData.saleAmount <= 0) {
      alert("Por favor, informe o valor da venda.")
      return
    }
    if (Object.keys(selectedItems).length === 0) {
      alert("Por favor, selecione pelo menos um item.")
      return
    }

    const totalValue = getTotalValue()
    if (totalValue > respondentData.saleAmount) {
      alert(
        `O valor total dos itens selecionados (R$ ${totalValue.toFixed(2)}) excede o valor da venda (R$ ${respondentData.saleAmount.toFixed(2)}).`,
      )
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      // Create form response
      const { data: response, error: responseError } = await supabase
        .from("form_responses")
        .insert({
          form_id: form.id,
          customer_name: respondentData.customerName,
          customer_email: respondentData.customerEmail,
          customer_phone: respondentData.customerPhone,
          seller_name: respondentData.sellerName,
          sale_amount: respondentData.saleAmount,
          notes: respondentData.notes || null,
        })
        .select()
        .single()

      if (responseError) throw responseError

      // Create response items
      const responseItems = Object.entries(selectedItems).map(([itemId, quantity]) => ({
        response_id: response.id,
        form_item_id: itemId,
        quantity,
      }))

      const { error: itemsError } = await supabase.from("response_items").insert(responseItems)

      if (itemsError) throw itemsError

      router.push(`/form/${form.id}/success`)
    } catch (error) {
      console.error("Erro ao enviar resposta:", error)
      alert("Erro ao enviar resposta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{form.title}</CardTitle>
          {form.description && <CardDescription className="text-base">{form.description}</CardDescription>}
          <div className="text-sm text-muted-foreground">
            Criado em {new Date(form.created_at).toLocaleDateString("pt-BR")}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações da Venda *</CardTitle>
          <CardDescription>Todos os campos são obrigatórios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Nome do Cliente *</Label>
              <Input
                id="customerName"
                value={respondentData.customerName}
                onChange={(e) => setRespondentData({ ...respondentData, customerName: e.target.value })}
                placeholder="Nome completo do cliente"
                required
              />
            </div>
            <div>
              <Label htmlFor="customerEmail">Email do Cliente *</Label>
              <Input
                id="customerEmail"
                type="email"
                value={respondentData.customerEmail}
                onChange={(e) => setRespondentData({ ...respondentData, customerEmail: e.target.value })}
                placeholder="cliente@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Telefone do Cliente *</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={respondentData.customerPhone}
                onChange={(e) => setRespondentData({ ...respondentData, customerPhone: e.target.value })}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
            <div>
              <Label htmlFor="sellerName">Nome do Vendedor *</Label>
              <Input
                id="sellerName"
                value={respondentData.sellerName}
                onChange={(e) => setRespondentData({ ...respondentData, sellerName: e.target.value })}
                placeholder="Nome do vendedor"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="saleAmount">Valor da Venda (R$) *</Label>
              <Input
                id="saleAmount"
                type="number"
                min="0"
                step="0.01"
                value={respondentData.saleAmount}
                onChange={(e) =>
                  setRespondentData({ ...respondentData, saleAmount: Number.parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
                required
              />
              {respondentData.saleAmount > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Apenas itens com valor mínimo igual ou inferior a R$ {respondentData.saleAmount.toFixed(2)} estarão
                  disponíveis
                </p>
              )}
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

      {/* Items Selection */}
      {respondentData.saleAmount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selecione os Itens</CardTitle>
            <CardDescription>
              {availableItems.length > 0
                ? `${availableItems.length} item(ns) disponível(eis) para o valor de venda de R$ ${respondentData.saleAmount.toFixed(2)}`
                : "Nenhum item disponível para este valor de venda"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableItems.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum item disponível</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Não há itens disponíveis para o valor de venda informado ou todos estão esgotados.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableItems.map((item) => {
                  const isSelected = selectedItems[item.id] !== undefined
                  const quantity = selectedItems[item.id] || 1
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
                        {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
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
                              onChange={(e) => handleQuantityChange(item.id, Number.parseInt(e.target.value) || 1)}
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
                      <span>Valor da venda:</span>
                      <span>R$ {respondentData.saleAmount.toFixed(2)}</span>
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
          type="submit"
          disabled={
            isLoading ||
            Object.keys(selectedItems).length === 0 ||
            !respondentData.customerName ||
            !respondentData.customerEmail ||
            !respondentData.customerPhone ||
            !respondentData.sellerName ||
            respondentData.saleAmount <= 0
          }
          size="lg"
        >
          <Send className="h-4 w-4 mr-2" />
          {isLoading ? "Enviando..." : "Enviar Resposta"}
        </Button>
      </div>
    </form>
  )
}
