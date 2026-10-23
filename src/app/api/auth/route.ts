import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'elince_session';
const SESSION_VALUE = 'authenticated_operator_lince_v1';

// Credenciales únicas a medida para Electromecánica Lince
const ALLOWED_USERS = [
  (process.env.WORKSHOP_USER || 'lince').toLowerCase(),
  'admin',
  'timoteo',
];
const MASTER_PASSWORD = process.env.WORKSHOP_PASSWORD || 'lince2026';
const MASTER_PIN = process.env.WORKSHOP_PIN || '1234';

const OPERATOR_PROFILE = {
  username: 'lince',
  name: 'Timoteo Pariona',
  role: 'Titular · Cuenta Única',
  workshop: 'Electromecánica Lince',
  address: 'Jr. Soledad 330, Lince, Lima',
};

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  const authenticated = session?.value === SESSION_VALUE;

  return NextResponse.json({
    success: true,
    authenticated,
    operator: authenticated ? OPERATOR_PROFILE : null,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawUser = String(body.username || 'lince').trim().toLowerCase();
    const rawPass = String(body.password || '').trim();

    const userValid = ALLOWED_USERS.includes(rawUser);
    const passValid = rawPass === MASTER_PASSWORD || rawPass === MASTER_PIN;

    if (!userValid || !passValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Clave o usuario de taller incorrecto. Verifica tus credenciales de acceso único.',
        },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 días en estación de trabajo local
    });

    return NextResponse.json({
      success: true,
      authenticated: true,
      operator: OPERATOR_PROFILE,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al validar acceso local' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({
    success: true,
    authenticated: false,
  });
}
