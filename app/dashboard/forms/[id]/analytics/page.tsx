import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Users, Package, TrendingDown, Calendar, DollarSign } from "lucide-react"

interface AnalyticsPageProps {
  params: Promise<{ id: string }>
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get form with detailed analytics
  const { data: form, error: formError } = await supabase
    .from("forms")
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
    `,
    )
    .eq("id", id)
    .eq("owner_id", data.user.id)
    .single()

  if (formError || !form) {
    notFound()
  }

  // Calculate analytics
  const totalResponses = form.form_responses.length
  const totalItems = form.form_items.length
  const totalStockUsed = form.form_items.reduce((acc, item) => acc + (item.initial_stock - item.current_stock), 0)

  const totalSalesAmount = form.form_responses.reduce((acc, response) => acc + (response.sale_amount || 0), 0)

  // Most requested items
  const itemRequests = form.form_responses.reduce(
    (acc, response) => {
      response.response_items.forEach((responseItem) => {
        const itemName = responseItem.form_items.name
        acc[itemName] = (acc[itemName] || 0) + responseItem.quantity
      })
      return acc
    },
    {} as Record<string, number>,
  )

  const mostRequestedItems = Object.entries(itemRequests)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Recent responses
  const recentResponses = form.form_responses
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics - {form.title}</h1>
              <p className="text-gray-600 dark:text-gray-300">Acompanhe o desempenho do seu formulário</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalResponses}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Itens Cadastrados</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalItems}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estoque Utilizado</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStockUsed}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total em Vendas</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {totalSalesAmount.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge variant={form.is_active ? "default" : "secondary"}>{form.is_active ? "Ativo" : "Inativo"}</Badge>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Stock Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status do Estoque</CardTitle>
                <CardDescription>Situação atual dos itens</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {form.form_items.map((item) => {
                    const usedStock = item.initial_stock - item.current_stock
                    const usagePercentage = item.initial_stock > 0 ? (usedStock / item.initial_stock) * 100 : 0

                    return (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.current_stock} de {item.initial_stock} disponíveis
                          </p>
                          <p className="text-sm text-muted-foreground">Preço: R$ {(item.price || 0).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              item.current_stock === 0
                                ? "destructive"
                                : item.current_stock <= item.initial_stock * 0.2
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {item.current_stock === 0
                              ? "Esgotado"
                              : item.current_stock <= item.initial_stock * 0.2
                                ? "Baixo"
                                : "Disponível"}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">{Math.round(usagePercentage)}% usado</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Most Requested Items */}
            <Card>
              <CardHeader>
                <CardTitle>Itens Mais Solicitados</CardTitle>
                <CardDescription>Top 5 itens por quantidade solicitada</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mostRequestedItems.length > 0 ? (
                    mostRequestedItems.map(([itemName, quantity], index) => (
                      <div key={itemName} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{itemName}</span>
                        </div>
                        <Badge variant="secondary">{quantity} solicitações</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Nenhuma solicitação ainda</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Responses */}
          <Card>
            <CardHeader>
              <CardTitle>Respostas Recentes</CardTitle>
              <CardDescription>Últimas 10 respostas recebidas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentResponses.length > 0 ? (
                  recentResponses.map((response) => (
                    <div key={response.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground">Cliente</h4>
                            <p className="font-medium">{response.customer_name || "Não informado"}</p>
                            <p className="text-sm text-muted-foreground">{response.customer_email || ""}</p>
                            <p className="text-sm text-muted-foreground">{response.customer_phone || ""}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground">Vendedor</h4>
                            <p className="font-medium">{response.seller_name || "Não informado"}</p>
                            <p className="text-sm text-muted-foreground">
                              Valor da venda: R$ {(response.sale_amount || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground mb-1">Itens solicitados:</p>
                          <div className="flex flex-wrap gap-1">
                            {response.response_items && response.response_items.length > 0 ? (
                              response.response_items.map((responseItem) => (
                                <Badge key={responseItem.id} variant="outline" className="text-xs">
                                  {responseItem.form_items?.name || "Item desconhecido"} ({responseItem.quantity})
                                  {responseItem.form_items?.price && (
                                    <span className="ml-1">
                                      - R$ {(responseItem.form_items.price * responseItem.quantity).toFixed(2)}
                                    </span>
                                  )}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Nenhum item encontrado
                              </Badge>
                            )}
                          </div>
                        </div>

                        {response.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">"{response.notes}"</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-muted-foreground">
                          {new Date(response.created_at).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(response.created_at).toLocaleTimeString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">Nenhuma resposta ainda</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
