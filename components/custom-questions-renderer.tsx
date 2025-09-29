"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { CustomQuestion } from "@/components/question-editor"

interface CustomQuestionsRendererProps {
  questions: CustomQuestion[]
  answers: Record<string, any>
  onChange: (answers: Record<string, any>) => void
  disabled?: boolean
}

export function CustomQuestionsRenderer({
  questions,
  answers,
  onChange,
  disabled = false,
}: CustomQuestionsRendererProps) {
  const handleAnswerChange = (questionId: string, value: any) => {
    onChange({
      ...answers,
      [questionId]: value,
    })
  }

  const renderQuestion = (question: CustomQuestion) => {
    const value = answers[question.id] || ""

    switch (question.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <Input
            type={question.type === "email" ? "email" : question.type === "phone" ? "tel" : "text"}
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            disabled={disabled}
            required={question.required}
          />
        )

      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, Number.parseFloat(e.target.value) || "")}
            placeholder={question.placeholder}
            disabled={disabled}
            required={question.required}
            min={question.validation?.min}
            max={question.validation?.max}
          />
        )

      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            disabled={disabled}
            required={question.required}
            rows={4}
          />
        )

      case "select":
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleAnswerChange(question.id, newValue)}
            disabled={disabled}
            required={question.required}
          >
            <SelectTrigger>
              <SelectValue placeholder={question.placeholder || "Selecione uma opção"} />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "radio":
        return (
          <RadioGroup
            value={value}
            onValueChange={(newValue) => handleAnswerChange(question.id, newValue)}
            disabled={disabled}
            required={question.required}
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "checkbox":
        const checkboxValues = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={checkboxValues.includes(option)}
                  onCheckedChange={(checked) => {
                    let newValues = [...checkboxValues]
                    if (checked) {
                      newValues.push(option)
                    } else {
                      newValues = newValues.filter((v) => v !== option)
                    }
                    handleAnswerChange(question.id, newValues)
                  }}
                  disabled={disabled}
                />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  if (questions.length === 0) return null

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <div key={question.id} className="space-y-2">
          <Label className="text-base font-medium">
            {question.label}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {renderQuestion(question)}
        </div>
      ))}
    </div>
  )
}
