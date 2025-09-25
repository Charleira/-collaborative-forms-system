import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FormEditor } from "@/components/form-editor"

interface EditFormPageProps {
  params: Promise<{ id: string }>
}

export default async function EditFormPage({ params }: EditFormPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get form with items
  const { data: form, error: formError } = await supabase
    .from("forms")
    .select(
      `
      *,
      form_items(*)
    `,
    )
    .eq("id", id)
    .eq("owner_id", data.user.id)
    .single()

  if (formError || !form) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Editar Formulário</h1>
            <p className="text-gray-600 dark:text-gray-300">Atualize as configurações e itens do formulário</p>
          </div>
          <FormEditor form={form} />
        </div>
      </div>
    </div>
  )
}
