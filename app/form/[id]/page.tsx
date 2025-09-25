import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PublicFormView } from "@/components/public-form-view"

interface FormPageProps {
  params: Promise<{ id: string }>
}

export default async function FormPage({ params }: FormPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get form with items
  const { data: form, error } = await supabase
    .from("forms")
    .select(
      `
      *,
      form_items(*)
    `,
    )
    .eq("id", id)
    .eq("is_public", true)
    .eq("is_active", true)
    .single()

  if (error || !form) {
    notFound()
  }

  // Filter only available items (stock > 0)
  const availableItems = form.form_items.filter((item) => item.current_stock > 0 && item.is_active)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <PublicFormView form={form} items={availableItems} />
        </div>
      </div>
    </div>
  )
}
