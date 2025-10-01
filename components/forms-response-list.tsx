'use client'

import { useState } from 'react'
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
  responses,
  formId,
}: {
  responses: FormResponse[]
  formId: string
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/forms/${formId}/responses/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseIds: selected }),
      })

      if (!res.ok) throw new Error('Erro ao deletar')

      toast.success('Respostas deletadas e estoque restaurado!')
      setSelected([])
      location.reload() // recarrega para atualizar lista
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível deletar')
    } finally {
      setLoading(false)
      setIsDialogOpen(false)
    }
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
                <div className="font-medium">{response.customer_name ?? 'Não informado'}</div>
                <div className="text-sm text-muted-foreground">
                  {response.customer_email ?? ''} {response.customer_phone ?? ''}
                </div>
                <div className="text-sm">
                  Vendedor: {response.seller_name ?? 'Não informado'}
                </div>
                <div className="text-sm">
                  Valor da venda: <strong>R$ {(response.sale_amount ?? 0).toFixed(2)}</strong>
                </div>
                {response.response_items.length > 0 && (
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
              disabled={loading}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
