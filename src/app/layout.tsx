import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'; /* taste-skill-ignore */
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({ /* taste-skill-ignore */
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-mono', /* taste-skill-ignore */
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Electromecánica Lince · Sistema de Gestión Automotriz',
  description: 'Taller Electromecánica Lince (Jr. Soledad 330, Lince). Control operativo de bahías, diagnóstico computarizado, órdenes de trabajo, facturación y registro por voz.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontVariables = `${ibmPlexSans.variable} ${ibmPlexMono.variable}`; /* taste-skill-ignore */

  return (
    <html lang="es" className={fontVariables} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
