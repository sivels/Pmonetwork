import { NextResponse } from 'next/server';

export function middleware(req) {
  const protectedPaths = ['/dashboard', '/dashboard/candidate', '/dashboard/employer'];

  // Check if user is logged in (Supabase sets this cookie)
  const supabaseSession = req.cookies.get('sb-access-token');

  const isProtected = protectedPaths.some(path =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !supabaseSession) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}