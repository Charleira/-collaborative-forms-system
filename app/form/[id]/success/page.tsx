'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function FormSuccessPage() {
  const pathname = usePathname()
  const formId = pathname?.split('/')[2] || '' // /form/[id]/success

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Resposta Enviada!</CardTitle>
          <CardDescription>Sua resposta foi registrada com sucesso.</CardDescription>
        </CardHeader>

        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Obrigado por preencher o formulário. Sua resposta foi salva e o estoque foi atualizado automaticamente.
          </p>

          <Button asChild className="w-full">
          <Link href={`/`}>Voltar ao Início</Link>
          </Button>

          {formId && (
            <Button asChild variant="outline" className="w-full mt-2">
              <Link href={`/form/${formId}`}>Fazer um novo formulário</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
