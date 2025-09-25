import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Erro de autenticação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {params?.error ? (
                  <p className="text-sm text-muted-foreground">Erro: {params.error}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Ocorreu um erro não especificado.</p>
                )}
                <div className="text-center">
                  <Button asChild>
                    <Link href="/auth/login">Tentar novamente</Link>
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
