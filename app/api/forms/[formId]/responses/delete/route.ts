import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request, { params }: { params: { formId: string } }) {
  const { responseIds } = await req.json()
  const supabase = await createClient()

  if (!Array.isArray(responseIds) || responseIds.length === 0) {
    return NextResponse.json({ error: 'Nenhuma resposta selecionada' }, { status: 400 })
  }

  // 1️⃣ Buscar response_items relacionados às respostas selecionadas
  const { data: itemsToRestore, error: fetchError } = await supabase
    .from('response_items')
    .select('form_item_id, quantity')
    .in('response_id', responseIds)

  if (fetchError) {
    console.error(fetchError)
    return NextResponse.json({ error: 'Erro ao buscar itens' }, { status: 500 })
  }

  // 2️⃣ Agrupar por item para somar quantidades iguais
  const groupedQuantities: Record<string, number> = {}
  for (const item of itemsToRestore ?? []) {
    if (!item.form_item_id) continue
    groupedQuantities[item.form_item_id] =
      (groupedQuantities[item.form_item_id] ?? 0) + (item.quantity ?? 0)
  }

  // 3️⃣ Atualizar estoque item a item
  for (const [itemId, qty] of Object.entries(groupedQuantities)) {
    const { error: updateError } = await supabase
      .from('form_items')
      .update({ current_stock: supabase.rpc('sql', { sql: `current_stock + ${qty}` }) })
      .eq('id', itemId)

    if (updateError) {
      const { data: currentItem } = await supabase
        .from('form_items')
        .select('current_stock')
        .eq('id', itemId)
        .single()

      const newStock = (currentItem?.current_stock ?? 0) + qty

      await supabase
        .from('form_items')
        .update({ current_stock: newStock })
        .eq('id', itemId)
    }
  }

  // 4️⃣ Deletar os response_items vinculados
  const { error: deleteItemsError } = await supabase
    .from('response_items')
    .delete()
    .in('response_id', responseIds)

  if (deleteItemsError) {
    console.error(deleteItemsError)
    return NextResponse.json({ error: 'Erro ao apagar itens das respostas' }, { status: 500 })
  }

  // 5️⃣ Deletar as respostas
  const { error: deleteResponsesError } = await supabase
    .from('form_responses')
    .delete()
    .in('id', responseIds)

  if (deleteResponsesError) {
    console.error(deleteResponsesError)
    return NextResponse.json({ error: 'Erro ao apagar respostas' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
