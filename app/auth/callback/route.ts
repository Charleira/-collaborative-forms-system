import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Error exchanging code for session:", error)
        // Redirect to error page if verification fails
        return NextResponse.redirect(new URL("/auth/error", request.url))
      }

      console.log("[v0] Email verification successful, redirecting to dashboard")
    } catch (error) {
      console.error("Unexpected error during email verification:", error)
      return NextResponse.redirect(new URL("/auth/error", request.url))
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
