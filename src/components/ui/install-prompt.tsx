'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 3 * 24 * 60 * 60 * 1000) return;
    }

    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|Chrome/.test(ua);

    if (isiOS) {
      setIsIOS(true);
      if (isSafari) {
        const timer = setTimeout(() => setShowPrompt(true), 2000);
        return () => clearTimeout(timer);
      }
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 1500);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  if (!showPrompt || pathname !== '/login') return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 animate-in fade-in duration-300">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm mx-4 mb-0 sm:mb-0 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="bg-brand-500 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-semibold text-lg">Install App</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          {isIOS ? (
            <>
              <p className="text-gray-700 text-sm mb-4">
                Install Kuberbook on your device for quick access and a better experience.
              </p>
              <div className="bg-surface-secondary rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="bg-brand-100 text-brand-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                  <p className="text-sm text-gray-600">
                    Tap the <Share className="w-4 h-4 inline text-blue-500 -mt-0.5" /> <strong>Share</strong> button in your browser
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-brand-100 text-brand-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                  <p className="text-sm text-gray-600">
                    Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-brand-100 text-brand-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                  <p className="text-sm text-gray-600">
                    Tap <strong>&quot;Add&quot;</strong> to confirm
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-700 text-sm">
              Install Kuberbook on your device for quick access and a better experience. No app store needed!
            </p>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-surface-secondary rounded-xl hover:bg-ledger-border transition-colors"
          >
            Not now
          </button>
          {isIOS ? (
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors"
            >
              Got it!
            </button>
          ) : (
            <button
              onClick={handleInstall}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
