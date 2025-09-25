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
import { Plus, Trash2, Save, Edit } from "lucide-react"

interface FormItem {
  id: string
  name: string
  description: string | null
  initial_stock: number
  current_stock: number
  max_per_response: number
  price: number // Added price field
  is_active: boolean
}

interface Form {
  id: string
  title: string
  description: string | null
  is_public: boolean
  is_active: boolean
  form_items: FormItem[]
}

interface FormEditorProps {
  form: Form
}

export function FormEditor({ form }: FormEditorProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: form.title,
    description: form.description || "",
    isPublic: form.is_public,
    isActive: form.is_active,
  })
  const [items, setItems] = useState<FormItem[]>(form.form_items)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    initialStock: 1,
    maxPerResponse: 1,
    minSaleValue: 0, // Added minSaleValue field
  })

  const addItem = async () => {
    if (!newItem.name.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("form_items")
        .insert({
          form_id: form.id,
          name: newItem.name,
          description: newItem.description || null,
          initial_stock: newItem.initialStock,
          current_stock: newItem.initialStock,
          max_per_response: newItem.maxPerResponse,
          price: newItem.minSaleValue, // Added price field
        })
        .select()
        .single()

      if (error) throw error

      setItems([...items, data])
      setNewItem({
        name: "",
        description: "",
        initialStock: 1,
        maxPerResponse: 1,
        minSaleValue: 0, // Reset minSaleValue
      })
    } catch (error) {
      console.error("Erro ao adicionar item:", error)
      alert("Erro ao adicionar item. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const updateItem = async (itemId: string, updates: Partial<FormItem>) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("form_items").update(updates).eq("id", itemId)

      if (error) throw error

      setItems(items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)))
      setEditingItem(null)
    } catch (error) {
      console.error("Erro ao atualizar item:", error)
      alert("Erro ao atualizar item. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteItem = async (itemId: string) => {
    if (!confirm("Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.")) {
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("form_items").delete().eq("id", itemId)

      if (error) throw error

      setItems(items.filter((item) => item.id !== itemId))
    } catch (error) {
      console.error("Erro ao excluir item:", error)
      alert("Erro ao excluir item. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert("Por favor, preencha o título do formulário.")
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("forms")
        .update({
          title: formData.title,
          description: formData.description || null,
          is_public: formData.isPublic,
          is_active: formData.isActive,
        })
        .eq("id", form.id)

      if (error) throw error

      router.push("/dashboard")
    } catch (error) {
      console.error("Erro ao atualizar formulário:", error)
      alert("Erro ao atualizar formulário. Tente novamente.")
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
          <CardDescription>Atualize as informações básicas do seu formulário</CardDescription>
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

      {/* Existing Items */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Formulário ({items.length})</CardTitle>
          <CardDescription>Gerencie os itens disponíveis no formulário</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <Badge variant="secondary">Estoque: {item.current_stock}</Badge>
                    <Badge variant="outline">Máx: {item.max_per_response}</Badge>
                    <Badge variant="default">Mín: R$ {item.price?.toFixed(2) || "0.00"}</Badge>{" "}
                    {/* Added price badge */}
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateItem(item.id, { is_active: !item.is_active })}
                  >
                    <Switch checked={item.is_active} />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => deleteItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add New Item */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Item</CardTitle>
          <CardDescription>Adicione mais itens ao formulário</CardDescription>
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
              {" "}
              {/* Added minSaleValue field */}
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
            className="w-full bg-transparent"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  )
}
