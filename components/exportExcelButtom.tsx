'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

type Props = {
  formId: string
  className?: string
  label?: string
}

type AnyRecord = Record<string, any>

type QuestionDef = {
  id: string
  text: string
  order?: number | null
}

/** ---- Utils ---- */
const tryParseJSON = (raw: any): any => {
  if (typeof raw !== 'string') return raw
  try { return JSON.parse(raw) } catch { return raw }
}

const QUESTION_TEXT_KEYS = [
  // EN
  'label', 'title', 'question', 'text', 'prompt', 'name', 'placeholder', 'display', 'content', 'question_text',
  // PT
  'pergunta', 'titulo', 'enunciado', 'descricao', 'texto',
] as const

const pickQuestionTextFromObj = (obj: AnyRecord): string => {
  for (const k of QUESTION_TEXT_KEYS) {
    const v = obj?.[k as string]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

/**
 * Extrai perguntas (id + texto) de vários formatos e locais dentro de `forms`:
 * - Array de objetos { id, ...texto... }
 * - Mapa { id: 'texto' } ou { id: { label/title/question/text/pergunta/titulo... } }
 * - Estruturas aninhadas: custom_questions, questions, schema/definition/config, elements/fields/items/sections/tabs/pages...
 */
const extractQuestionsFromAny = (input: any): QuestionDef[] => {
  const out: QuestionDef[] = []
  if (!input) return out

  const pushIfValid = (id: any, text: any, order?: any) => {
    const _id = String(id ?? '').trim()
    const _text = String(text ?? '').trim()
    if (_id && _text) {
      out.push({
        id: _id,
        text: _text,
        order:
          typeof order === 'number'
            ? order
            : Number.isFinite(Number(order))
            ? Number(order)
            : undefined,
      })
    }
  }

  const scanArray = (arr: any[]) => {
    for (const item of arr) {
      if (!item) continue
      if (typeof item === 'object' && !Array.isArray(item)) {
        const id =
          item.id ?? item.name ?? item.key ?? item.field ?? item.qid ?? item.questionId
        const text = pickQuestionTextFromObj(item)
        const order = item.order ?? item.index ?? item.position ?? item.ordem
        if (id && text) pushIfValid(id, text, order)

        const childArrays = [
          item.elements, item.questions, item.items, item.components, item.fields,
          item.sections, item.tabs, item.pages, item.children, item.perguntas,
        ].filter(Array.isArray) as any[][]
        for (const child of childArrays) scanArray(child)

        if (item.schema) out.push(...extractQuestionsFromAny(item.schema))
        if (item.definition) out.push(...extractQuestionsFromAny(item.definition))
        if (item.config) out.push(...extractQuestionsFromAny(item.config))
        if (item.form) out.push(...extractQuestionsFromAny(item.form))
      }
    }
  }

  const scanObjectAsMap = (obj: AnyRecord) => {
    for (const [k, v] of Object.entries(obj)) {
      if (v == null) continue
      if (typeof v === 'string') {
        // { "qid": "Texto" }
        pushIfValid(k, v)
        continue
      }
      if (typeof v === 'object' && !Array.isArray(v)) {
        const text = pickQuestionTextFromObj(v)
        const order = (v as any).order ?? (v as any).index ?? (v as any).position ?? (v as any).ordem
        if (text) pushIfValid(k, text, order)

        const childArrays = [
          (v as any).elements, (v as any).questions, (v as any).items, (v as any).fields,
          (v as any).sections, (v as any).tabs, (v as any).pages,
        ].filter(Array.isArray) as any[][]
        for (const child of childArrays) scanArray(child)

        if ((v as any).schema) out.push(...extractQuestionsFromAny((v as any).schema))
        if ((v as any).definition) out.push(...extractQuestionsFromAny((v as any).definition))
        if ((v as any).config) out.push(...extractQuestionsFromAny((v as any).config))
        if ((v as any).form) out.push(...extractQuestionsFromAny((v as any).form))
      }
    }
  }

  const data = tryParseJSON(input)

  if (Array.isArray(data)) {
    scanArray(data)
  } else if (typeof data === 'object' && data !== null) {
    const candidates = [
      (data as any).custom_questions,
      (data as any).questions,
      (data as any).preset_questions,
      (data as any).default_questions,
      (data as any).elements,
      (data as any).fields,
      (data as any).items,
      (data as any).sections,
      (data as any).tabs,
      (data as any).pages,
      (data as any).schema,
      (data as any).definition,
      (data as any).config,
      (data as any).survey,
      (data as any).form,
    ]

    let foundAny = false
    for (const c of candidates) {
      const extracted = extractQuestionsFromAny(c)
      if (extracted.length) {
        out.push(...extracted)
        foundAny = true
      }
    }

    if (!foundAny) {
      scanObjectAsMap(data)
    }
  }

  return out
}

const ensureUniqueHeaderFactory = () => {
  const seen = new Set<string>()
  return (label: string, qid: string) => {
    let h = label
    if (!seen.has(h)) {
      seen.add(h)
      return h
    }
    const shortId = qid.slice(0, 8)
    h = `${label} [${shortId}]`
    if (!seen.has(h)) {
      seen.add(h)
      return h
    }
    h = `${label} [${qid}]`
    seen.add(h)
    return h
  }
}

/** Para valores nas colunas de perguntas (formatar legível) */
const toCellText = (value: any): string => {
  if (value == null) return ''
  if (Array.isArray(value)) return value.map((v) => toCellText(v)).join(', ')
  if (typeof value === 'object') {
    try { return JSON.stringify(value) } catch { return String(value) }
  }
  return String(value)
}

/** Para metadados: preserva JSON quando for array/objeto (ex.: brinde_negociado: ["11"]) */
const toMetaCell = (value: any): any => {
  if (value == null) return ''
  if (typeof value === 'object') {
    try { return JSON.stringify(value) } catch { return String(value) }
  }
  return value // mantém número como número
}

const ANSWER_KEYS = [
  'custom_answers',
  'customAnswers',
  'Custom Answers',
  'custom_answoers',
  'Custom Answoers',
  'elementCustomAnswers',
  'element_custom_answers',
  'elementCustom Answoers',
  'answers',
  'response',
  'payload',
  'data',
]

/** Extrai o mapa de respostas {questionId: value} a partir de uma linha de form_responses */
const extractAnswersFromRowFactory = (questionIds: Set<string>) => {
  const looksLikeAnswersMap = (obj: any): obj is Record<string, any> => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
    return Object.keys(obj).some((k) => questionIds.has(k))
  }

  return (row: AnyRecord): Record<string, any> => {
    for (const key of ANSWER_KEYS) {
      if (key in row) {
        const value = tryParseJSON(row[key])
        if (looksLikeAnswersMap(value)) return value

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          for (const innerKey of ANSWER_KEYS) {
            if (innerKey in value) {
              const inner = tryParseJSON(value[innerKey])
              if (looksLikeAnswersMap(inner)) return inner
            }
          }
        }
      }
    }

    // Varredura heurística geral
    for (const [, v] of Object.entries(row)) {
      if (!v) continue
      const parsed = tryParseJSON(v)
      if (looksLikeAnswersMap(parsed)) return parsed
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [, iv] of Object.entries(parsed)) {
          const innerParsed = tryParseJSON(iv)
          if (looksLikeAnswersMap(innerParsed)) return innerParsed
        }
      }
    }

    return {}
  }
}

/** Tenta ler metadados tanto no top-level como em recipientes comuns (metadata, customer, payload...) */
const buildMetaReader = () => {
  const containers = ['metadata','meta','customer','cliente','dados_cliente','extra','payload','data','response']
  return (r: AnyRecord, field: string) => {
    // 1) top-level direto
    if (r[field] !== undefined) return r[field]

    // 2) recipientes com possível JSON string
    for (const c of containers) {
      const raw = r[c]
      if (raw === undefined) continue
      const obj = tryParseJSON(raw)
      if (obj && typeof obj === 'object') {
        if (obj[field] !== undefined) return obj[field]
        // um nível dentro (ex.: customer.{field})
        for (const [k2, v2] of Object.entries(obj)) {
          if (!v2 || typeof v2 !== 'object') continue
          const inner = (v2 as any)[field]
          if (inner !== undefined) return inner
        }
      }
    }

    return undefined
  }
}

export function ExportResponsesButton({
  formId,
  className,
  label = 'Exportar Respostas (.xlsx)',
}: Props) {
  const handleExport = async () => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('Usuário não autenticado')
      return
    }

    /** 1) Buscar o form inteiro (para extrair os textos das perguntas) */
    const { data: form, error: formErr } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single()

    if (formErr) {
      console.error('Erro ao buscar formulário na tabela forms:', formErr)
      return
    }
    if (!form) {
      console.warn('Formulário não encontrado.')
      return
    }

    /** 2) Extrair perguntas -> ID->Texto */
    const extracted = [
      ...extractQuestionsFromAny(form),
      ...extractQuestionsFromAny(form.custom_questions),
    ]
    const questionById = new Map<string, QuestionDef>()
    for (const q of extracted) {
      if (!questionById.has(q.id)) questionById.set(q.id, q)
      else {
        const prev = questionById.get(q.id)!
        if (prev.order == null && q.order != null) questionById.set(q.id, q)
      }
    }
    const allQuestions = Array.from(questionById.values()).sort((a, b) => {
      const oa = a.order ?? Number.MAX_SAFE_INTEGER
      const ob = b.order ?? Number.MAX_SAFE_INTEGER
      if (oa !== ob) return oa - ob
      return a.text.localeCompare(b.text)
    })

    /** 3) Buscar respostas */
    const { data: responses, error: respErr } = await supabase
      .from('form_responses')
      .select('*')
      .eq('form_id', formId)
      .order('created_at', { ascending: true })

    if (respErr) {
      console.error('Erro ao buscar respostas:', respErr)
      return
    }

    /** 4) Cabeçalhos fixos na ORDEM EXATA que você pediu */
    const FIXED_COLS_ORDER = [
      'id',
      'form_id',
      'respondent_name',
      'respondent_email',
      'notes',
      'created_at',
      'customer_name',
      'customer_email',
      'seller_name',
      'sale_amount',
      'cnpj_grupo_economico',
      'representante_nome',
      'representante_email',
      'cliente_email',
      'brinde_negociado',
    ] as const

    const ensureUniqueHeader = ensureUniqueHeaderFactory()
    const headers: string[] = [...FIXED_COLS_ORDER]

    // Mapeia ID -> Cabeçalho (texto da pergunta). Vêm DEPOIS dos fixos.
    const headerByQuestionId = new Map<string, string>()
    for (const q of allQuestions) {
      const header = ensureUniqueHeader(q.text || q.id, q.id)
      headerByQuestionId.set(q.id, header)
      headers.push(header)
    }

    // Helper para ler metadados
    const readMeta = buildMetaReader()

    // Se não houver respostas, exporta planilha só com cabeçalhos
    if (!responses || responses.length === 0) {
      const emptyRow: AnyRecord = {}
      for (const col of FIXED_COLS_ORDER) emptyRow[col] = ''
      for (const q of allQuestions) emptyRow[headerByQuestionId.get(q.id)!] = ''
      const ws = XLSX.utils.json_to_sheet([emptyRow], { header: headers })
      // Larguras simples
      const colWidths = headers.map((h) => ({ wch: Math.min(Math.max(12, h.length + 2), 60) }))
      // @ts-ignore
      ws['!cols'] = colWidths
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Respostas')
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      saveAs(blob, `form_${formId}_responses_empty.xlsx`)
      return
    }

    /** 5) Preparar extração das respostas e detectar IDs “desconhecidos” */
    const knownIds = new Set(allQuestions.map((q) => q.id))
    const extractAnswersFromRow = extractAnswersFromRowFactory(knownIds)

    const unknownIds = new Set<string>()
    for (const r of responses) {
      const ans = extractAnswersFromRow(r)
      for (const k of Object.keys(ans)) if (!knownIds.has(k)) unknownIds.add(k)
    }
    if (unknownIds.size > 0) {
      console.warn('[Export] IDs em respostas não definidos no forms:', Array.from(unknownIds))
      // Adiciona colunas extras com o próprio ID como header (para não perder dados)
      for (const id of unknownIds) {
        const header = ensureUniqueHeader(id, id)
        headerByQuestionId.set(id, header)
        headers.push(header)
      }
    }

    /** 6) Montar linhas achatadas */
    const flattenedRows: AnyRecord[] = responses.map((r: AnyRecord) => {
      const row: AnyRecord = {}

      // Preencher colunas fixas na ORDEM pedida
      for (const col of FIXED_COLS_ORDER) {
        const v = readMeta(r, col)
        row[col] = toMetaCell(v)
      }

      // Preencher perguntas
      const answers = extractAnswersFromRow(r)
      for (const [qid, header] of headerByQuestionId.entries()) {
        row[header] = toCellText(answers[qid])
      }

      return row
    })

    /** 7) Planilha e download */
    const ws = XLSX.utils.json_to_sheet(flattenedRows, { header: headers })
    const colWidths = headers.map((h) => {
      const maxLen = Math.max(
        h.length,
        ...flattenedRows.map((r) => (r[h] ? String(r[h]).length : 0))
      )
      return { wch: Math.min(Math.max(12, maxLen + 2), 60) }
    })
    // @ts-ignore
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Respostas')

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    saveAs(blob, `form_${formId}_responses_${yyyy}-${mm}-${dd}.xlsx`)
  }

  return (
    <Button onClick={handleExport} className={className} variant="secondary">
      <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
      {label ?? 'Exportar Respostas (.xlsx)'}
    </Button>
  )
}