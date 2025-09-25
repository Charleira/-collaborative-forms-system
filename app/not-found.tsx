import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <FileX className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </div>
          <CardTitle className="text-2xl">Formulário não encontrado</CardTitle>
          <CardDescription>
            O formulário que você está procurando não existe ou não está mais disponível.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Verifique se o link está correto ou entre em contato com quem compartilhou o formulário.
          </p>
          <Button asChild className="w-full">
            <Link href="/">Voltar ao Início</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
