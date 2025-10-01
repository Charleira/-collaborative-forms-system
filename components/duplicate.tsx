'use client';

import { createClient } from "@/lib/supabase/client"; // ajuste o caminho conforme o seu projeto
// exemplos comuns: "@/lib/supabase/client" ou "@/utils/supabase/client"

/**
 * Duplica um formulário por completo via RPC no Supabase.
 * Retorna o ID do novo formulário.
 *
 * Uso:
 *   await duplicate(form.id)
 *   // opcional: await duplicate(form.id, { ownerId: 'uuid-do-novo-dono' })
 */
export async function duplicate(
  formId: string,
  opts?: { ownerId?: string }
): Promise<string> {
  if (!formId) throw new Error('formId é obrigatório');

  const supabase = createClient();

  const { data, error } = await supabase.rpc('duplicate_form', {
    p_form_id: formId,
    p_owner_id: opts?.ownerId ?? null,
  });

  if (error) {
    console.error('Erro ao duplicar formulário (RPC duplicate_form):', error);
    throw new Error(error.message || 'Falha ao duplicar formulário');
  }

  // O RPC retorna o novo ID (uuid)
  return data as string;
}
