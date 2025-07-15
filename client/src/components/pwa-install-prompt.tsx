import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Check if already in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone || 
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Android Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show iOS prompt after a short delay if not already installed
    if (iOS && !standalone) {
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
          setShowInstallPrompt(true);
        }
      }, 3000); // Show after 3 seconds

      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showInstallPrompt || isStandalone) {
    return null;
  }

  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Install App</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Install Mooring Ireland & UK for quick access and offline browsing.
        </p>
        
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="text-blue-600">1.</span>
            <span>Tap the</span>
            <Share className="h-4 w-4 text-blue-600" />
            <span>Share button below</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="text-blue-600">2.</span>
            <span>Tap</span>
            <Plus className="h-4 w-4 text-blue-600" />
            <span>"Add to Home Screen"</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleDismiss} variant="outline" size="sm" className="flex-1">
            Got it
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Install App</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleDismiss}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        Install Mooring Ireland & UK for quick access and offline browsing.
      </p>
      
      <div className="flex gap-2">
        <Button onClick={handleInstall} size="sm" className="flex-1">
          Install
        </Button>
        <Button onClick={handleDismiss} variant="outline" size="sm">
          Not now
        </Button>
      </div>
    </div>
  );
}