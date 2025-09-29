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

export function ExportResponsesButton({ formId, className, label = 'Exportar Respostas (.xlsx)' }: Props) {
  const handleExport = async () => {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('Usuário não autenticado')
      return
    }

    const { data: responses, error } = await supabase
      .from('form_responses')
      .select('*')
      .eq('form_id', formId)

    if (error) {
      console.error('Erro ao buscar respostas:', error)
      return
    }

    if (!responses || responses.length === 0) {
      console.warn('Nenhuma resposta encontrada')
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(responses)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Respostas')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    saveAs(blob, `form_${formId}_responses.xlsx`)
  }

  return (
    <Button onClick={handleExport} className={className} variant="secondary">
      <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
      {label}
    </Button>
  )
}
