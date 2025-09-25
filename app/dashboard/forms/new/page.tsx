import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FormBuilder } from "@/components/form-builder"

export default async function NewFormPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-[#f0f8f8] dark:from-gray-900 dark:to-[#0f3d3d]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1e5a5a] dark:text-white mb-2">Criar Novo Formulário</h1>
            <p className="text-gray-600 dark:text-gray-300">Configure seu formulário com itens e controle de estoque</p>
          </div>
          <FormBuilder />
        </div>
      </div>
    </div>
  )
}
