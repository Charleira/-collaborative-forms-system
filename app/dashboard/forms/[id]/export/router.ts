import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import ExcelJS from 'exceljs'

export const runtime = 'nodejs' // garante que roda no Node, não no Edge

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createClient()

  // 1) Autenticação
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError || !auth?.user) {
    return new NextResponse('Não autorizado', { status: 401 })
  }

  // 2) Buscar o formulário com TODAS as respostas e itens relacionados
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select(
      `
      *,
      form_items(*),
      form_responses(
        *,
        response_items(
          *,
          form_items(name, price)
        )
      )
    `
    )
    .eq('id', id)
    .eq('owner_id', auth.user.id)
    .single()

  if (formError || !form) {
    return new NextResponse('Formulário não encontrado', { status: 404 })
  }

  // 3) Montar o workbook (.xlsx)
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Seu App'
  workbook.created = new Date()

  // --- Sheet 1: Resumo ---
  const totalResponses = form.form_responses.length
  const totalItems = form.form_items.length
  const totalStockUsed = form.form_items.reduce(
    (acc: number, item: any) => acc + (item.initial_stock - item.current_stock),
    0
  )
  const totalSalesAmount = form.form_responses.reduce(
    (acc: number, r: any) => acc + (r.sale_amount ?? 0),
    0
  )

  const wsResumo = workbook.addWorksheet('Resumo')
  wsResumo.columns = [
    { header: 'Métrica', key: 'metric', width: 30 },
    { header: 'Valor', key: 'value', width: 30 }
  ]
  wsResumo.addRows([
    ['Título', form.title ?? '—'],
    ['Status', form.is_active ? 'Ativo' : 'Inativo'],
    ['Total de Respostas', totalResponses],
    ['Itens Cadastrados', totalItems],
    ['Estoque Utilizado', totalStockUsed],
    ['Total em Vendas (R$)', Number(totalSalesAmount).toFixed(2)]
  ])
  wsResumo.getRow(1).font = { bold: true }

  // --- Sheet 2: Respostas ---
  const wsResp = workbook.addWorksheet('Respostas')
  wsResp.columns = [
    { header: 'Resposta ID', key: 'id', width: 28 },
    { header: 'Data/Hora', key: 'created_at', width: 20 },
    { header: 'Cliente - Nome', key: 'customer_name', width: 28 },
    { header: 'Cliente - E-mail', key: 'customer_email', width: 30 },
    { header: 'Cliente - Telefone', key: 'customer_phone', width: 20 },
    { header: 'Vendedor', key: 'seller_name', width: 24 },
    { header: 'Valor da Venda (R$)', key: 'sale_amount', width: 22 },
    { header: 'Observacoes', key: 'notes', width: 40 }
  ]
  wsResp.getRow(1).font = { bold: true }

  function formatDateBR(iso: string) {
    const d = new Date(iso)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  form.form_responses.forEach((r: any) => {
    wsResp.addRow({
      id: r.id,
      created_at: r.created_at ? formatDateBR(r.created_at) : '',
      customer_name: r.customer_name ?? 'Não informado',
      customer_email: r.customer_email ?? '',
      customer_phone: r.customer_phone ?? '',
      seller_name: r.seller_name ?? 'Não informado',
      sale_amount: (r.sale_amount ?? 0).toFixed(2),
      notes: r.notes ?? ''
    })
  })

  // --- Sheet 3: Itens por Resposta ---
  const wsItens = workbook.addWorksheet('Itens por Resposta')
  wsItens.columns = [
    { header: 'Resposta ID', key: 'response_id', width: 28 },
    { header: 'Item', key: 'item_name', width: 32 },
    { header: 'Quantidade', key: 'quantity', width: 14 },
    { header: 'Preço Unit. (R$)', key: 'unit_price', width: 18 },
    { header: 'Total (R$)', key: 'total_price', width: 16 }
  ]
  wsItens.getRow(1).font = { bold: true }

  form.form_responses.forEach((r: any) => {
    r.response_items?.forEach((ri: any) => {
      const name = ri.form_items?.name ?? 'Item desconhecido'
      const price = ri.form_items?.price ?? 0
      const qty = ri.quantity ?? 0
      wsItens.addRow({
        response_id: r.id,
        item_name: name,
        quantity: qty,
        unit_price: Number(price).toFixed(2),
        total_price: Number(price * qty).toFixed(2)
      })
    })
  })

  // 4) Gerar buffer e responder com download
  const buffer = await workbook.xlsx.writeBuffer()
  const fileSafeTitle = (form.title || 'form')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/gi, '-')
  const fileName = `respostas-${fileSafeTitle}-${new Date().toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store'
    }
  })
}
