import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: { formId: string } }
) {
  const supabase = await createClient()

  // IMPORTANTE:
  // - Use alias para que a resposta venha com a chave "response_items", que o seu componente já espera.
  // - Inclua o join para "form_items" com os campos que você precisa.
  const { data, error } = await supabase
    .from('form_responses')
    .select(`
      id,
      created_at,
      nome_cliente,
      cliente_email,
      nome_vendedor,
      valor_venda,
      observacoes,
      response_items:response_items (
        id,
        quantity,
        form_items:form_items (
          id,
          name,
          price
        )
      )
    `)
    .eq('form_id', params.formId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  // Se você quiser garantir o shape exatamente como seu componente tipa:
  const normalized = (data ?? []).map((r) => ({
    id: r.id,
    created_at: r.created_at,
    customer_name: r.nome_cliente,
    customer_email: r.cliente_email,
    seller_name: r.nome_vendedor,
    sale_amount: r.valor_venda,
    notes: r.observacoes,
    response_items: (r.response_items ?? []).map((ri: any) => ({
      id: ri.id,
      quantity: ri.quantity,
      form_items: ri.form_items
        ? {
            id: ri.form_items.id,
            name: ri.form_items.name,
            price: ri.form_items.price,
          }
        : null,
    })),
  }))

  return NextResponse.json(normalized)
}
