'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

type ResponseItem = {
  id: string
  quantity: number
  form_items: { id?: string; name: string; price: number | null } | null
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

export default function FormResponsesList({
  formId,
}: {
  formId: string
}) {
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [loadingList, setLoadingList] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selected, setSelected] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  // === Carrega respostas da API ===
  const fetchResponses = async (signal?: AbortSignal) => {
    try {
      setLoadingList(true)
      setLoadError(null)

      const res = await fetch(`/api/forms/${formId}/responses`, {
        method: 'GET',
        cache: 'no-store',
        signal,
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || 'Falha ao buscar respostas')
      }

      const data: FormResponse[] = await res.json()
      setResponses(data)
    } catch (err) {
      console.error(err)
      setLoadError('Não foi possível carregar as respostas.')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    const ac = new AbortController()
    fetchResponses(ac.signal)
    return () => ac.abort()
  }, [formId])

  const handleDelete = async () => {
    setLoadingDelete(true)
    try {
      const res = await fetch(`/api/forms/${formId}/responses/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseIds: selected }),
      })

      if (!res.ok) throw new Error('Erro ao deletar')

      toast.success('Respostas deletadas e estoque restaurado!')
      setSelected([])
      await fetchResponses() // recarrega a lista sem dar reload na página
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível deletar')
    } finally {
      setLoadingDelete(false)
      setIsDialogOpen(false)
    }
  }

  // === UI ===
  if (loadingList) {
    return (
      <div className="space-y-2">
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="text-sm text-destructive">
        {loadError}{' '}
        <Button variant="link" size="sm" onClick={() => fetchResponses()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {selected.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Apagar selecionados ({selected.length})
          </Button>
        </div>
      )}

      {responses.length > 0 ? (
        responses.map((response) => (
          <div
            key={response.id}
            className="rounded-md border p-3 space-y-2 flex flex-col md:flex-row md:justify-between"
          >
            <div className="flex gap-3 items-start">
              <Checkbox
                checked={selected.includes(response.id)}
                onCheckedChange={() => toggleSelect(response.id)}
              />
              <div>
                <div className="font-medium">
                  {response.customer_name && response.customer_name.trim() !== '' ? response.customer_name : 'Não informado'}
                </div>

                <div className="text-sm text-muted-foreground">
                  {[response.customer_email, response.customer_phone].filter(Boolean).join(' • ') || '—'}
                </div>

                <div className="text-sm">
                  Vendedor: {response.seller_name && response.seller_name.trim() !== '' ? response.seller_name : 'Não informado'}
                </div>

                <div className="text-sm">
                  Valor da venda:{' '}
                  <strong>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                      .format(response.sale_amount ?? 0)}
                  </strong>
                </div>

                {response.response_items?.length > 0 && (
                  <ul className="list-disc pl-5 text-sm mt-1">
                    {response.response_items.map((item) => (
                      <li key={item.id}>
                        {item.form_items?.name ?? 'Item desconhecido'} ({item.quantity})
                      </li>
                    ))}
                  </ul>
                )}

                {response.notes && (
                  <div className="italic text-sm text-muted-foreground mt-1">
                    "{response.notes}"
                  </div>
                )}

                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(response.created_at).toLocaleDateString('pt-BR')}{' '}
                  {new Date(response.created_at).toLocaleTimeString('pt-BR')}
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-sm text-muted-foreground">Nenhuma resposta ainda</div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir respostas selecionadas?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Ao confirmar, todas as respostas selecionadas serão removidas e os itens reservados
            voltarão ao estoque.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loadingDelete}
            >
              {loadingDelete ? 'Excluindo...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
