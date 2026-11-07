import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/authCrypto';

const SESSION_COOKIE = 'elince_session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger todas las rutas de API excepto el login (/api/auth)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
    const isValid = await verifySessionToken(sessionCookie);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acceso no autorizado. Se requiere sesión activa de operador autenticado.',
        },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
