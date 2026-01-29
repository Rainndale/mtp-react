import React, { useState, useEffect } from 'react';
import ConfirmationModal from '../ui/ConfirmationModal';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);

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

    // Debug logging
    console.log('InstallPrompt mounted. Standalone:', isInStandaloneMode(), 'IOS:', isIosDevice);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Debug: If we have a prompt, log it
  useEffect(() => {
    if (deferredPrompt) console.log('beforeinstallprompt captured!');
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone) {
    return (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-xs text-center font-bold">
            <i className="fa-solid fa-check-circle mr-1"></i> App Installed
        </div>
    );
  }

  return (
    <>
        <button
          onClick={() => {
              if (deferredPrompt) {
                  handleInstallClick();
              } else {
                  setShowInstructionModal(true);
              }
          }}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 animate-fade-in"
        >
          <i className="fa-solid fa-download"></i>
          <span>{deferredPrompt ? 'Install App' : 'Install App'}</span>
        </button>

        <ConfirmationModal
            isOpen={showInstructionModal}
            onClose={() => setShowInstructionModal(false)}
            title="Install App"
            message="To install, tap 'Share' > 'Add to Home Screen' or look for the Install option in your browser menu."
            confirmText="Got it"
            showCancel={false}
            variant="info"
        />
    </>
  );
};

export default InstallPrompt;
