import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Users, Package, TrendingDown, Calendar, DollarSign } from 'lucide-react'
import { ExportResponsesButton } from '@/components/exportExcelButtom' // <— botão do Excel (cliente)

/* =========================
   Tipos locais (TS)
   ========================= */
type FormItem = {
  id: string
  name: string
  price: number | null
  initial_stock: number
  current_stock: number
}

type ResponseItem = {
  id: string
  quantity: number
  form_items: { name: string; price: number | null } | null
}

type FormResponse = {
  id: string
  created_at: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  seller_name: string | null
  sale_amount: number | null
  notes: string | null
  response_items: ResponseItem[]
}

type Form = {
  id: string
  title: string | null
  is_active: boolean
  form_items: FormItem[]
  form_responses: FormResponse[]
}

/* =========================
   Página (Server Component)
   ========================= */
export default async function AnalyticsPage({
  params,
}: {
  params: { id: string } // <— NÃO é Promise
}) {
  const { id } = params // <— sem await  [1](https://emspocbi-my.sharepoint.com/personal/c0050485_ems_com_br/Documents/Arquivos%20de%20Microsoft%20Copilot%20Chat/page.tsx)

  const supabase = await createClient()
  const { data: auth, error } = await supabase.auth.getUser()
  if (error || !auth?.user) {
    redirect('/auth/login')
  }

  // Buscar formulário + itens + respostas + itens das respostas
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
    notFound()
  }

  // Forçar tipagem do objeto que veio do Supabase
  const typedForm = form as unknown as Form

  /* ===== Métricas com tipos ===== */
  const totalResponses = typedForm.form_responses.length
  const totalItems = typedForm.form_items.length

  const totalStockUsed = typedForm.form_items.reduce<number>((acc, item) => {
    return acc + (item.initial_stock - item.current_stock)
  }, 0) // <— acc e item tipados

  const totalSalesAmount = typedForm.form_responses.reduce<number>((acc, response) => {
    return acc + (response.sale_amount ?? 0)
  }, 0)

  // Mapa de solicitações por item: Record<string, number>
  const itemRequests = typedForm.form_responses.reduce<Record<string, number>>((acc, response) => {
    response.response_items.forEach((responseItem) => {
      const itemName = responseItem.form_items?.name ?? 'Item desconhecido'
      acc[itemName] = (acc[itemName] ?? 0) + (responseItem.quantity ?? 0)
    })
    return acc
  }, {})

  // Top 5 itens: agora [string, number][]
  const mostRequestedItems = Object.entries(itemRequests)
    .sort(([, a], [, b]) => b - a) // a e b são number
    .slice(0, 5)

  // 10 respostas mais recentes (cópia para não mutar)
  const recentResponses = [...typedForm.form_responses]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link href={`/dashboard`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">Analytics – {typedForm.title ?? '—'}</h2>
            <p className="text-sm text-muted-foreground">
              Acompanhe o desempenho do seu formulário
            </p>
          </div>
        </div>

        <Badge variant={typedForm.is_active ? 'default' : 'secondary'}>
          Status {typedForm.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" /> Total de Respostas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totalResponses}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" /> Itens Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totalItems}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4" /> Estoque Utilizado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totalStockUsed}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Total em Vendas
            </CardTitle>
            <CardDescription>Soma do campo “valor da venda”</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            R$ {totalSalesAmount.toFixed(2)}
          </CardContent>
        </Card>
      </div>

      {/* Status do Estoque */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Estoque</CardTitle>
          <CardDescription>Situação atual dos itens</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {typedForm.form_items.map((item) => {
            const usedStock = item.initial_stock - item.current_stock
            const usagePercentage =
              item.initial_stock > 0 ? (usedStock / item.initial_stock) * 100 : 0

            const statusLabel =
              item.current_stock === 0
                ? 'Esgotado'
                : item.current_stock <= item.initial_stock * 0.2
                ? 'Baixo'
                : 'Disponível'

            return (
              <div key={item.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{item.name}</div>
                  <Badge variant={statusLabel === 'Baixo' ? 'secondary' : 'default'}>
                    {statusLabel}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.current_stock} de {item.initial_stock} disponíveis •{' '}
                  {Math.round(usagePercentage)}% usado • Preço:{' '}
                  R$ {(item.price ?? 0).toFixed(2)}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Itens Mais Solicitados */}
      <Card>
        <CardHeader>
          <CardTitle>Itens Mais Solicitados</CardTitle>
          <CardDescription>Top 5 itens por quantidade solicitada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {mostRequestedItems.length > 0 ? (
            mostRequestedItems.map(([itemName, quantity], index) => (
              <div key={itemName} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-5 text-right">{index + 1}</span>
                  <span>{itemName}</span>
                </div>
                <span className="font-medium">{quantity} solicitações</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">Nenhuma solicitação ainda</div>
          )}
        </CardContent>
      </Card>

      {/* Respostas Recentes + Botão Excel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Respostas Recentes</CardTitle>
            <CardDescription>Últimas 10 respostas recebidas</CardDescription>
          </div>
          {/* Botão Excel — baixa TODAS as respostas do formulário */}
          <ExportResponsesButton formId={id} />
        </CardHeader>

        <CardContent className="space-y-6">
          {recentResponses.length > 0 ? (
            recentResponses.map((response) => (
              <div key={response.id} className="rounded-md border p-3 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Cliente</div>
                    <div className="font-medium">
                      {response.customer_name ?? 'Não informado'}
                    </div>
                    <div className="text-sm">
                      {response.customer_email ?? ''} {response.customer_phone ?? ''}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Vendedor</div>
                    <div className="font-medium">
                      {response.seller_name ?? 'Não informado'}
                    </div>
                  </div>
                </div>

                <div className="text-sm">
                  Valor da venda: <strong>R$ {(response.sale_amount ?? 0).toFixed(2)}</strong>
                </div>

                <div className="text-sm">
                  <div className="text-xs text-muted-foreground mb-1">Itens solicitados:</div>
                  {response.response_items && response.response_items.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {response.response_items.map((responseItem) => (
                        <li key={responseItem.id}>
                          {responseItem.form_items?.name ?? 'Item desconhecido'} (
                          {responseItem.quantity})
                          {responseItem.form_items?.price != null && (
                            <> — R$ {(responseItem.form_items.price * responseItem.quantity).toFixed(2)}</>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-muted-foreground">Nenhum item encontrado</div>
                  )}
                </div>

                {response.notes && (
                  <div className="italic text-sm text-muted-foreground">"{response.notes}"</div>
                )}

                <div className="text-xs text-muted-foreground">
                  {new Date(response.created_at).toLocaleDateString('pt-BR')}{' '}
                  {new Date(response.created_at).toLocaleTimeString('pt-BR')}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">Nenhuma resposta ainda</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
