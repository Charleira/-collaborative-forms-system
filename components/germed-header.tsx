"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { LogOut, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function GermedHeader() {
  const { user, loading, signOut, isAuthenticated } = useAuth()

  console.log("[v0] Header render - isAuthenticated:", isAuthenticated, "loading:", loading)

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
              <DropdownMenu onOpenChange={(open) => console.log("[v0] Dropdown open state:", open)}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white hover:text-[#7cb342] hover:bg-white/10"
                    onClick={() => console.log("[v0] Dropdown trigger clicked")}
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
                  className="w-48 z-[9999] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-lg"
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      console.log("[v0] Sign out clicked")
                      e.preventDefault()
                      signOut()
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
