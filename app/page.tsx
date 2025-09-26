import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { FileText, Users, BarChart3, Shield } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#12555E] to-[#0f3d3d]">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Formulários Colaborativos</h1>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Crie formulários inteligentes com controle de estoque, compartilhe com sua equipe e acompanhe respostas em
            tempo real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#7cb342] hover:bg-[#5a9f2e] text-white">
              <Link href="/auth/register">Começar Gratuitamente</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-[#1e5a5a] bg-transparent"
            >
              <Link href="/auth/login">Fazer Login</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <FileText className="h-8 w-8 text-[#7cb342] mb-2" />
              <CardTitle className="text-white">Formulários Inteligentes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-200">
                Crie formulários com controle de estoque automático. Itens indisponíveis são ocultados automaticamente.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <Users className="h-8 w-8 text-[#7cb342] mb-2" />
              <CardTitle className="text-white">Compartilhamento Fácil</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-200">
                Compartilhe formulários via link público ou privado. Sem necessidade de login para respondentes.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-[#7cb342] mb-2" />
              <CardTitle className="text-white">Analytics em Tempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-200">
                Acompanhe respostas, controle estoque e visualize dados com gráficos interativos.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <Shield className="h-8 w-8 text-[#7cb342] mb-2" />
              <CardTitle className="text-white">Seguro e Confiável</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-200">
                Seus dados estão protegidos com autenticação segura e controle de acesso por usuário.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Pronto para começar?</CardTitle>
              <CardDescription className="text-gray-200">
                Crie sua conta gratuita e comece a criar formulários colaborativos em minutos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="w-full sm:w-auto bg-[#7cb342] hover:bg-[#5a9f2e] text-white">
                <Link href="/auth/register">Criar Conta Gratuita</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
