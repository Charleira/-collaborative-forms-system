import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Verifique seu email</CardTitle>
              <CardDescription>Enviamos um link de confirmação para você</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Você se cadastrou com sucesso! Verifique sua caixa de entrada e clique no link de confirmação para
                  ativar sua conta.
                </p>
                <div className="text-center">
                  <Button asChild variant="outline">
                    <Link href="/auth/login">Voltar ao login</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
