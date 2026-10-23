'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { CommandPalette } from './CommandPalette';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { VoiceAssistantModal } from '@/components/voice/VoiceAssistantModal';
import { OrderFormModal } from '@/components/orders/OrderFormModal';
import { SingleAccountLogin } from '@/components/auth/SingleAccountLogin';
import { BackupModal } from '@/components/backup/BackupModal';
import { X } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    fetch('/api/auth')
      .then((r) => r.json())
      .then((data) => {
        setAuthStatus(data.authenticated ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => {
        setAuthStatus('unauthenticated');
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch {
      // ignore
    }
    setAuthStatus('unauthenticated');
  };

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen w-full bg-[var(--ground)] flex items-center justify-center p-6">
        <code className="text-[13px] text-[var(--muted)]">
          Iniciando estación Electromecánica Lince...
        </code>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return <SingleAccountLogin onAuthenticated={() => setAuthStatus('authenticated')} />;
  }

  return (
    <ToastProvider>
      <div className="app-frame">
        {/* Desktop Sidebar in L-Frame */}
        <Sidebar
          className="app-sidebar-desktop"
          onLogout={handleLogout}
          onOpenBackup={() => setBackupModalOpen(true)}
        />

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex min-[861px]:hidden">
            <div
              className="fixed inset-0 bg-black/45"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-64 max-w-[85vw] bg-[var(--ground)] border-r border-[var(--border)] flex flex-col min-h-screen">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="btn absolute top-3 right-3 px-2"
                aria-label="Cerrar menú"
              >
                <X className="w-4 h-4" />
              </button>
              <Sidebar
                className="w-full flex-1 pt-12"
                onNavigate={() => setMobileMenuOpen(false)}
                onLogout={handleLogout}
                onOpenBackup={() => {
                  setMobileMenuOpen(false);
                  setBackupModalOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Top Bar in L-Frame */}
        <Navbar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenNewOrder={() => setNewOrderModalOpen(true)}
          onOpenVoiceAssistant={() => setVoiceModalOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        {/* Inset White Sheet */}
        <main className="app-sheet">
          <div className="max-w-[1280px] mx-auto space-y-5">{children}</div>
        </main>

        {/* Command Palette */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onOpenNewOrder={() => setNewOrderModalOpen(true)}
          onOpenVoiceAssistant={() => setVoiceModalOpen(true)}
          onOpenBackup={() => setBackupModalOpen(true)}
        />

        {/* Global Modals */}
        <VoiceAssistantModal
          isOpen={voiceModalOpen}
          onClose={() => setVoiceModalOpen(false)}
        />

        <OrderFormModal
          isOpen={newOrderModalOpen}
          onClose={() => setNewOrderModalOpen(false)}
          onOrderSaved={() => {
            window.location.reload();
          }}
        />

        <BackupModal
          isOpen={backupModalOpen}
          onClose={() => setBackupModalOpen(false)}
        />
      </div>
    </ToastProvider>
  );
}
