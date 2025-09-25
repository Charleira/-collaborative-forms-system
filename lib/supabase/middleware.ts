import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables in middleware")
    return NextResponse.next({ request })
  }

  try {
    console.log("[v0] Middleware processing path:", request.nextUrl.pathname)

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] User authenticated:", !!user, "Path:", request.nextUrl.pathname)

    const isPublicRoute =
      request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname.startsWith("/auth") ||
      request.nextUrl.pathname.startsWith("/form/")

    const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard")

    // Only redirect unauthenticated users trying to access protected routes
    if (!user && isProtectedRoute) {
      console.log("[v0] Redirecting unauthenticated user to login")
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users from auth pages to dashboard
    if (user && request.nextUrl.pathname.startsWith("/auth")) {
      console.log("[v0] Redirecting authenticated user to dashboard")
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    console.log("[v0] Allowing access to:", request.nextUrl.pathname)
    return supabaseResponse
  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.next({
      request,
    })
  }
}
