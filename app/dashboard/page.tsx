import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Plus, FileText, Users, BarChart3 } from "lucide-react"
import { FormsList } from "@/components/forms-list"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user's forms
  const { data: forms } = await supabase
    .from("forms")
    .select(
      `
      *,
      form_items(count),
      form_responses(count)
    `,
    )
    .eq("owner_id", data.user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-[#f0f8f8] dark:from-gray-900 dark:to-[#0f3d3d]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1e5a5a] dark:text-white mb-2">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">Gerencie seus formulários colaborativos</p>
          </div>
          <Button asChild className="bg-[#7cb342] hover:bg-[#5a9f2e] text-white">
            <Link href="/dashboard/forms/new">
              <Plus className="h-4 w-4 mr-2" />
              Novo Formulário
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-[#1e5a5a]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Formulários</CardTitle>
              <FileText className="h-4 w-4 text-[#1e5a5a]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1e5a5a]">{forms?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#7cb342]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Respostas dos Formulários Ativos</CardTitle>
              <Users className="h-4 w-4 text-[#7cb342]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#7cb342]">
                {forms?.filter((form) => form.is_active).reduce((acc, form) => acc + (form.form_responses?.[0]?.count || 0), 0) || 0}

              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#2d7a7a]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Formulários Ativos</CardTitle>
              <BarChart3 className="h-4 w-4 text-[#2d7a7a]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2d7a7a]">
                {forms?.filter((form) => form.is_active).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Forms List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#1e5a5a] dark:text-white">Seus Formulários</CardTitle>
            <CardDescription>Gerencie e acompanhe seus formulários colaborativos</CardDescription>
          </CardHeader>
          <CardContent>
            <FormsList forms={forms || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
