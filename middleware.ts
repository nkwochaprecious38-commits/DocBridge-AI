import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectedPath = pathname.startsWith("/dashboard") || pathname.startsWith("/api/app");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (protectedPath) {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Authentication is not configured" }, { status: 503 });
      const u = request.nextUrl.clone();
      u.pathname = "/login";
      u.search = "?error=not_configured";
      return NextResponse.redirect(u);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && protectedPath) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const u = request.nextUrl.clone();
    u.pathname = "/login";
    u.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(u);
  }
  if (user && AUTH_PAGES.includes(pathname)) {
    const u = request.nextUrl.clone();
    u.pathname = "/dashboard";
    u.search = "";
    return NextResponse.redirect(u);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
