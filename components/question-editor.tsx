"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit, Save, X } from "lucide-react"

export interface CustomQuestion {
  id: string
  type: "text" | "textarea" | "select" | "radio" | "checkbox" | "number" | "email" | "phone"
  label: string
  placeholder?: string
  required: boolean
  options?: string[] // Para select, radio, checkbox
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

interface QuestionEditorProps {
  questions: CustomQuestion[]
  onChange: (questions: CustomQuestion[]) => void
}

export function QuestionEditor({ questions, onChange }: QuestionEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newQuestion, setNewQuestion] = useState<Partial<CustomQuestion>>({
    type: "text",
    label: "",
    required: false,
    options: [],
  })

  const questionTypes = [
    { value: "text", label: "Texto Curto" },
    { value: "textarea", label: "Texto Longo" },
    { value: "select", label: "Lista Suspensa" },
    { value: "radio", label: "Múltipla Escolha (Uma opção)" },
    { value: "checkbox", label: "Múltipla Escolha (Várias opções)" },
    { value: "number", label: "Número" },
    { value: "email", label: "E-mail" },
    { value: "phone", label: "Telefone" },
  ]

  const addQuestion = () => {
    if (!newQuestion.label?.trim()) return

    const question: CustomQuestion = {
      id: crypto.randomUUID(),
      type: newQuestion.type as CustomQuestion["type"],
      label: newQuestion.label,
      placeholder: newQuestion.placeholder || "",
      required: newQuestion.required || false,
      options: newQuestion.options || [],
      validation: newQuestion.validation,
    }

    onChange([...questions, question])
    setNewQuestion({
      type: "text",
      label: "",
      required: false,
      options: [],
    })
  }

  const updateQuestion = (id: string, updates: Partial<CustomQuestion>) => {
    onChange(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  const deleteQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id))
  }

  const moveQuestion = (id: string, direction: "up" | "down") => {
    const index = questions.findIndex((q) => q.id === id)
    if (index === -1) return

    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= questions.length) return

    const newQuestions = [...questions]
    const [movedQuestion] = newQuestions.splice(index, 1)
    newQuestions.splice(newIndex, 0, movedQuestion)
    onChange(newQuestions)
  }

  const needsOptions = (type: string) => ["select", "radio", "checkbox"].includes(type)

  return (
    <div className="space-y-6">
      {/* Existing Questions */}
      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Perguntas Personalizadas ({questions.length})</CardTitle>
            <CardDescription>Gerencie as perguntas adicionais do formulário</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {questions.map((question, index) => (
                <div key={question.id} className="p-4 border rounded-lg">
                  {editingId === question.id ? (
                    <EditQuestionForm
                      question={question}
                      onSave={(updates) => {
                        updateQuestion(question.id, updates)
                        setEditingId(null)
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{question.label}</h4>
                          <Badge variant="outline">{questionTypes.find((t) => t.value === question.type)?.label}</Badge>
                          {question.required && <Badge variant="secondary">Obrigatório</Badge>}
                        </div>
                        {question.placeholder && (
                          <p className="text-sm text-muted-foreground">Placeholder: {question.placeholder}</p>
                        )}
                        {question.options && question.options.length > 0 && (
                          <p className="text-sm text-muted-foreground">Opções: {question.options.join(", ")}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveQuestion(question.id, "up")}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveQuestion(question.id, "down")}
                          disabled={index === questions.length - 1}
                        >
                          ↓
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(question.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => deleteQuestion(question.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Question */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Nova Pergunta</CardTitle>
          <CardDescription>Configure uma pergunta personalizada para o formulário</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="questionLabel">Pergunta *</Label>
              <Input
                id="questionLabel"
                value={newQuestion.label || ""}
                onChange={(e) => setNewQuestion({ ...newQuestion, label: e.target.value })}
                placeholder="Ex: Qual é o seu cargo?"
              />
            </div>
            <div>
              <Label htmlFor="questionType">Tipo de Resposta</Label>
              <Select
                value={newQuestion.type}
                onValueChange={(value) =>
                  setNewQuestion({
                    ...newQuestion,
                    type: value as CustomQuestion["type"],
                    options: needsOptions(value) ? [""] : [],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="questionPlaceholder">Texto de Ajuda (Placeholder)</Label>
              <Input
                id="questionPlaceholder"
                value={newQuestion.placeholder || ""}
                onChange={(e) => setNewQuestion({ ...newQuestion, placeholder: e.target.value })}
                placeholder="Ex: Digite seu cargo atual na empresa"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Pergunta Obrigatória</Label>
                <p className="text-sm text-muted-foreground">Usuário deve responder</p>
              </div>
              <Switch
                checked={newQuestion.required || false}
                onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, required: checked })}
              />
            </div>
          </div>

          {/* Options for select/radio/checkbox */}
          {needsOptions(newQuestion.type || "") && (
            <div>
              <Label>Opções de Resposta</Label>
              <div className="space-y-2 mt-2">
                {(newQuestion.options || []).map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(newQuestion.options || [])]
                        newOptions[index] = e.target.value
                        setNewQuestion({ ...newQuestion, options: newOptions })
                      }}
                      placeholder={`Opção ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newOptions = (newQuestion.options || []).filter((_, i) => i !== index)
                        setNewQuestion({ ...newQuestion, options: newOptions })
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewQuestion({
                      ...newQuestion,
                      options: [...(newQuestion.options || []), ""],
                    })
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Opção
                </Button>
              </div>
            </div>
          )}

          <Button
            type="button"
            onClick={addQuestion}
            variant="outline"
            className="w-full bg-transparent"
            disabled={!newQuestion.label?.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Pergunta
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

interface EditQuestionFormProps {
  question: CustomQuestion
  onSave: (updates: Partial<CustomQuestion>) => void
  onCancel: () => void
}

function EditQuestionForm({ question, onSave, onCancel }: EditQuestionFormProps) {
  const [editData, setEditData] = useState<CustomQuestion>({ ...question })

  const questionTypes = [
    { value: "text", label: "Texto Curto" },
    { value: "textarea", label: "Texto Longo" },
    { value: "select", label: "Lista Suspensa" },
    { value: "radio", label: "Múltipla Escolha (Uma opção)" },
    { value: "checkbox", label: "Múltipla Escolha (Várias opções)" },
    { value: "number", label: "Número" },
    { value: "email", label: "E-mail" },
    { value: "phone", label: "Telefone" },
  ]

  const needsOptions = (type: string) => ["select", "radio", "checkbox"].includes(type)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="editLabel">Pergunta *</Label>
          <Input
            id="editLabel"
            value={editData.label}
            onChange={(e) => setEditData({ ...editData, label: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="editType">Tipo de Resposta</Label>
          <Select
            value={editData.type}
            onValueChange={(value) =>
              setEditData({
                ...editData,
                type: value as CustomQuestion["type"],
                options: needsOptions(value) ? editData.options || [""] : [],
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {questionTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="editPlaceholder">Texto de Ajuda</Label>
          <Input
            id="editPlaceholder"
            value={editData.placeholder || ""}
            onChange={(e) => setEditData({ ...editData, placeholder: e.target.value })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Pergunta Obrigatória</Label>
          </div>
          <Switch
            checked={editData.required}
            onCheckedChange={(checked) => setEditData({ ...editData, required: checked })}
          />
        </div>
      </div>

      {needsOptions(editData.type) && (
        <div>
          <Label>Opções de Resposta</Label>
          <div className="space-y-2 mt-2">
            {(editData.options || []).map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(editData.options || [])]
                    newOptions[index] = e.target.value
                    setEditData({ ...editData, options: newOptions })
                  }}
                  placeholder={`Opção ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newOptions = (editData.options || []).filter((_, i) => i !== index)
                    setEditData({ ...editData, options: newOptions })
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditData({
                  ...editData,
                  options: [...(editData.options || []), ""],
                })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Opção
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" onClick={() => onSave(editData)} disabled={!editData.label.trim()}>
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </Button>
      </div>
    </div>
  )
}
