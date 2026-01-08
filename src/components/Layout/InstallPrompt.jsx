import React, { useState, useEffect } from 'react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    const isInStandaloneMode = () => {
      return (window.matchMedia('(display-mode: standalone)').matches) ||
             (window.navigator.standalone) ||
             document.referrer.includes('android-app://');
    };

    setIsStandalone(isInStandaloneMode());

    // Check if iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone) return null;

  if (deferredPrompt) {
    return (
      <button
        onClick={handleInstallClick}
        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 animate-fade-in"
      >
        <i className="fa-solid fa-download"></i>
        <span>Install App</span>
      </button>
    );
  }

  // Optional: Show iOS instructions
  if (isIOS) {
      return (
          <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-500 text-center">
              <p>To install: tap <i className="fa-solid fa-arrow-up-from-bracket mx-1"></i> then "Add to Home Screen"</p>
          </div>
      )
  }

  return null;
};

export default InstallPrompt;
