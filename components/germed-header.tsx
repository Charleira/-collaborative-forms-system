"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { LogOut, User } from "lucide-react"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
 

export function GermedHeader() {
   // Estado para controlar qual dropdown está aberto (apenas um por vez)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  // Estado para armazenar a posição calculada do dropdown
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)

  const { user, loading, signOut, isAuthenticated } = useAuth()

  console.log("[v0] Header render - isAuthenticated:", isAuthenticated, "loading:", loading)

  const handleDropdownOpen = (formId: string, event: React.MouseEvent) => {
    const button = event.currentTarget as HTMLElement
    const rect = button.getBoundingClientRect()
    
    // Calcular posição: ao lado direito dos 3 pontinhos
    // top: mesma altura do botão (não embaixo)
    // left: 4px de espaçamento à direita do botão
    const top = rect.top
    const left = rect.left - 20
    
    setDropdownPosition({ top, left })
    setOpenDropdown(formId)
  }


  return (
    <header className="bg-[#104c54] text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-3">
            <Image src="/images/germed-logo.png" alt="Germed" width={120} height={40} className="h-10 w-auto" />
          </Link>

          <nav className="flex items-center space-x-4">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-20 bg-white/20 rounded animate-pulse" />
              </div>
            ) : isAuthenticated ? (
            <DropdownMenu
              open={openDropdown === "header-user"}
              onOpenChange={(open) => {
                // Fechar e limpar posição quando o menu é fechado, igual ao snippet que funciona
                if (!open) {
                  setOpenDropdown(null);
                  setDropdownPosition(null);
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-white hover:text-[#7cb342] hover:bg-white/10"
                  onClick={(e) => {
                    // Abre o menu do header e calcula posição fixa (usa a mesma função do outro código)
                    handleDropdownOpen("header-user", e);
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  {user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário"}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={8}
                collisionPadding={16}
                avoidCollisions
                // Posição fixa próxima ao trigger, igual ao snippet que funciona
                style={
                  dropdownPosition
                    ? {
                        position: "fixed",
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        zIndex: 9999,
                      }
                    : undefined
                }
                className="w-48 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-lg"
              >
                <DropdownMenuItem
                  onSelect={(e) => {
                    // onSelect é o padrão do Radix/shadcn e já lida com fechamento
                    e.preventDefault();
                    signOut();
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            ) : (
              <>
                <Button asChild variant="ghost" className="text-white hover:text-[#7cb342] hover:bg-white/10">
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button asChild className="bg-[#7cb342] hover:bg-[#5a9f2e] text-white">
                  <Link href="/auth/register">Cadastrar</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
