import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("[v0] Auth callback initiated")

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  console.log("[v0] Callback params - code:", code ? "present" : "missing", "next:", next)

  if (code) {
    const supabase = createClient()

    try {
      console.log("[v0] Attempting to exchange code for session")
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("[v0] Error exchanging code for session:", error.message, error.status)
        // Redirect to error page if verification fails
        return NextResponse.redirect(new URL("/auth/error", request.url))
      }

      console.log("[v0] Email verification successful, user:", data.user?.email)
      console.log("[v0] Session created, redirecting to:", next)
    } catch (error) {
      console.error("[v0] Unexpected error during email verification:", error)
      return NextResponse.redirect(new URL("/auth/error", request.url))
    }
  } else {
    console.log("[v0] No code provided, redirecting to:", next)
  }

  return NextResponse.redirect(new URL(next, request.url))
}
