import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'elince_session';
const SESSION_VALUE = 'authenticated_operator_lince_v1';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger todas las rutas de API excepto el inicio de sesión
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

    if (sessionCookie !== SESSION_VALUE) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acceso no autorizado. Inicie sesión en la estación de trabajo de Electromecánica Lince.',
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
