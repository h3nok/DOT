import React, { useState, useEffect } from 'react';
import { Download, Wifi, WifiOff, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import PWAService, { type NotificationOptions } from '../../../services/PWAService';

interface PWAStatusProps {
  className?: string;
}

export const PWAStatus: React.FC<PWAStatusProps> = ({ className = '' }) => {
  const [installationStatus, setInstallationStatus] = useState<'unknown' | 'installable' | 'installed' | 'not-supported'>('unknown');
  const [isOnline, setIsOnline] = useState(true);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check initial status
    setInstallationStatus(PWAService.getInstallationStatus());
    setIsOnline(PWAService.isOnlineStatus());

    // Set up event listeners
    const handleInstallAvailable = () => {
      setInstallationStatus('installable');
      setShowInstallPrompt(true);
    };

    const handleUpdateAvailable = () => {
      setShowUpdatePrompt(true);
    };

    const handleConnectionLost = () => {
      setIsOnline(false);
    };

    const handleConnectionRestored = () => {
      setIsOnline(true);
    };

    // Add event listeners
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    window.addEventListener('connection-lost', handleConnectionLost);
    window.addEventListener('connection-restored', handleConnectionRestored);

    // Cleanup
    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
      window.removeEventListener('connection-lost', handleConnectionLost);
      window.removeEventListener('connection-restored', handleConnectionRestored);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await PWAService.install();
      if (success) {
        setShowInstallPrompt(false);
        setInstallationStatus('installed');
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUpdate = () => {
    PWAService.updateServiceWorker();
    setShowUpdatePrompt(false);
    
    // Show notification that update will take effect on next reload
    PWAService.showNotification({
      title: 'Update Downloaded',
      body: 'The app will update when you refresh the page.',
      tag: 'update-downloaded'
    });
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
  };

  const dismissUpdatePrompt = () => {
    setShowUpdatePrompt(false);
  };

  // Don't render anything if PWA is not supported
  if (installationStatus === 'not-supported') {
    return null;
  }

  return (
    <div className={`pwa-status ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center space-x-2 mb-4">
        {isOnline ? (
          <div className="flex items-center text-green-600 text-sm">
            <Wifi className="w-4 h-4 mr-1" />
            <span>Online</span>
          </div>
        ) : (
          <div className="flex items-center text-amber-600 text-sm">
            <WifiOff className="w-4 h-4 mr-1" />
            <span>Offline - Limited functionality</span>
          </div>
        )}
      </div>

      {/* Install Prompt */}
      {showInstallPrompt && installationStatus === 'installable' && (
        <Card className="mb-4 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Install DOT Platform
                </h3>
                <p className="text-blue-700 text-sm mb-3">
                  Install the app for faster access, offline reading, and push notifications.
                </p>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleInstall}
                    disabled={isInstalling}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {isInstalling ? 'Installing...' : 'Install App'}
                  </Button>
                  <Button
                    onClick={dismissInstallPrompt}
                    variant="outline"
                    size="sm"
                  >
                    Not Now
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Prompt */}
      {showUpdatePrompt && (
        <Card className="mb-4 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">
                  App Update Available
                </h3>
                <p className="text-green-700 text-sm mb-3">
                  A new version of DOT Platform is ready with improvements and bug fixes.
                </p>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleUpdate}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Update Now
                  </Button>
                  <Button
                    onClick={dismissUpdatePrompt}
                    variant="outline"
                    size="sm"
                  >
                    Later
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Installation Status */}
      {installationStatus === 'installed' && (
        <div className="text-sm text-green-600 flex items-center">
          <Download className="w-4 h-4 mr-1" />
          <span>App installed successfully</span>
        </div>
      )}
    </div>
  );
};

// Hook for PWA functionality in other components
export const usePWA = () => {
  const [isOnline, setIsOnline] = useState(PWAService.isOnlineStatus());
  const [canInstall, setCanInstall] = useState(PWAService.canInstall());
  const [isStandalone, setIsStandalone] = useState(PWAService.isStandalone());

  useEffect(() => {
    const handleConnectionChange = () => {
      setIsOnline(PWAService.isOnlineStatus());
    };

    const handleInstallAvailable = () => {
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setCanInstall(false);
      setIsStandalone(true);
    };

    window.addEventListener('connection-lost', handleConnectionChange);
    window.addEventListener('connection-restored', handleConnectionChange);
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('connection-lost', handleConnectionChange);
      window.removeEventListener('connection-restored', handleConnectionChange);
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    return await PWAService.install();
  };

  const showNotification = (options: NotificationOptions) => {
    return PWAService.showNotification(options);
  };

  const queueForSync = (type: 'blog-post' | 'settings' | 'comment' | 'integration', data: any) => {
    PWAService.queueForSync(type, data);
  };

  const subscribeToPush = async () => {
    return await PWAService.subscribeToPush();
  };

  return {
    isOnline,
    canInstall,
    isStandalone,
    install,
    showNotification,
    queueForSync,
    subscribeToPush
  };
};

export default PWAStatus;
