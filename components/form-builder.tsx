"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Save } from "lucide-react"
import { QuestionEditor, type CustomQuestion } from "@/components/question-editor"

interface FormItem {
  id: string
  name: string
  description: string
  initialStock: number
  maxPerResponse: number
  price: number
}

export function FormBuilder() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isPublic: true,
    isActive: true,
  })
  const [items, setItems] = useState<FormItem[]>([])
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([])
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    initialStock: 1,
    maxPerResponse: 1,
    minSaleValue: 0,
  })

  const addItem = () => {
    if (!newItem.name.trim()) return

    const item: FormItem = {
      id: crypto.randomUUID(),
      name: newItem.name,
      description: newItem.description,
      initialStock: newItem.initialStock,
      maxPerResponse: newItem.maxPerResponse,
      price: newItem.minSaleValue,
    }

    setItems([...items, item])
    setNewItem({
      name: "",
      description: "",
      initialStock: 1,
      maxPerResponse: 1,
      minSaleValue: 0,
    })
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || items.length === 0) {
      alert("Por favor, preencha o título do formulário e adicione pelo menos um item.")
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      // Create form
      const { data: form, error: formError } = await supabase
        .from("forms")
        .insert({
          title: formData.title,
          description: formData.description || null,
          is_public: formData.isPublic,
          is_active: formData.isActive,
          owner_id: user.id,
          custom_questions: customQuestions,
        })
        .select()
        .single()

      if (formError) throw formError

      // Create form items
      const formItems = items.map((item) => ({
        form_id: form.id,
        name: item.name,
        description: item.description || null,
        initial_stock: item.initialStock,
        current_stock: item.initialStock,
        max_per_response: item.maxPerResponse,
        price: item.price,
      }))

      const { error: itemsError } = await supabase.from("form_items").insert(formItems)

      if (itemsError) throw itemsError

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Erro ao criar formulário:", error)
      alert("Erro ao criar formulário. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Formulário</CardTitle>
          <CardDescription>Configure as informações básicas do seu formulário</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Pedido de materiais de escritório"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o propósito do formulário..."
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Formulário Público</Label>
              <p className="text-sm text-muted-foreground">Permite acesso sem login</p>
            </div>
            <Switch
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Formulário Ativo</Label>
              <p className="text-sm text-muted-foreground">Aceita novas respostas</p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add New Item */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Item</CardTitle>
          <CardDescription>Configure os itens disponíveis no formulário</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="itemName">Nome do Item</Label>
              <Input
                id="itemName"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Ex: Caneta azul"
              />
            </div>
            <div>
              <Label htmlFor="itemDescription">Descrição</Label>
              <Input
                id="itemDescription"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Ex: Caneta esferográfica azul"
              />
            </div>
            <div>
              <Label htmlFor="initialStock">Estoque Inicial</Label>
              <Input
                id="initialStock"
                type="number"
                min="0"
                value={newItem.initialStock}
                onChange={(e) => setNewItem({ ...newItem, initialStock: Number.parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="maxPerResponse">Máximo por Resposta</Label>
              <Input
                id="maxPerResponse"
                type="number"
                min="1"
                value={newItem.maxPerResponse}
                onChange={(e) => setNewItem({ ...newItem, maxPerResponse: Number.parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="itemMinSaleValue">Valor Mínimo de Venda (R$)</Label>
              <Input
                id="itemMinSaleValue"
                type="number"
                min="0"
                step="0.01"
                value={newItem.minSaleValue}
                onChange={(e) => setNewItem({ ...newItem, minSaleValue: Number.parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cliente precisa informar valor de venda igual ou superior para acessar este item
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={addItem}
            variant="outline"
            className="w-full bg-[#7cb342] hover:bg-[#5a9f2e] text-white border-[#7cb342]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        </CardContent>
      </Card>

      {/* Custom Questions Editor */}
      <QuestionEditor questions={customQuestions} onChange={setCustomQuestions} />

      {/* Items List */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Itens do Formulário ({items.length})</CardTitle>
            <CardDescription>Itens que estarão disponíveis no formulário</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <Badge variant="secondary">Estoque: {item.initialStock}</Badge>
                      <Badge variant="outline">Máx: {item.maxPerResponse}</Badge>
                      <Badge variant="default">Mín: R$ {item.price.toFixed(2)}</Badge>
                    </div>
                    {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-[#7cb342] hover:bg-[#5a9f2e] text-white">
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Criando..." : "Criar Formulário"}
        </Button>
      </div>
    </form>
  )
}
