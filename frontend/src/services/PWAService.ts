// PWA Service - Service Worker Registration and Management
// Enhanced Progressive Web App capabilities for DOT Platform

interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

interface BackgroundSyncData {
  type: 'blog-post' | 'settings' | 'comment' | 'integration';
  data: any;
  timestamp: number;
  id: string;
}

class PWAService {
  private static instance: PWAService;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private installPrompt: PWAInstallPrompt | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncQueue: BackgroundSyncData[] = [];

  public static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService();
    }
    return PWAService.instance;
  }

  constructor() {
    this.init();
  }

  private async init() {
    // Register service worker
    await this.registerServiceWorker();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Set up background sync
    this.setupBackgroundSync();
    
    // Set up push notifications
    this.setupPushNotifications();
  }

  // Service Worker Registration
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        console.log('[PWA] Registering service worker...');
        
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('[PWA] Service worker registered:', this.serviceWorkerRegistration.scope);

        // Handle service worker updates
        this.serviceWorkerRegistration.addEventListener('updatefound', () => {
          const newWorker = this.serviceWorkerRegistration?.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                this.notifyUpdate();
              }
            });
          }
        });

      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error);
      }
    } else {
      console.warn('[PWA] Service workers not supported');
    }
  }

  // Event Listeners Setup
  private setupEventListeners(): void {
    // Install prompt handling
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event as any;
      console.log('[PWA] Install prompt ready');
      
      // Dispatch custom event for UI components
      window.dispatchEvent(new CustomEvent('pwa-install-available'));
    });

    // App installed handling
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.installPrompt = null;
      
      // Track installation
      this.trackEvent('pwa_installed');
      
      // Show welcome notification
      this.showNotification({
        title: 'Welcome to DOT Platform!',
        body: 'The app has been installed successfully. You can now access it offline.',
        tag: 'welcome-notification'
      });
    });

    // Online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('[PWA] Back online - syncing data...');
      this.processSyncQueue();
      
      // Notify UI components
      window.dispatchEvent(new CustomEvent('connection-restored'));
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('[PWA] Gone offline - enabling offline mode');
      
      // Notify UI components
      window.dispatchEvent(new CustomEvent('connection-lost'));
    });
  }

  // Background Sync Setup
  private setupBackgroundSync(): void {
    // Listen for sync events from the app
    window.addEventListener('background-sync-request', ((event: CustomEvent) => {
      const { type, data } = event.detail;
      this.queueForSync(type, data);
    }) as EventListener);
  }

  // Push Notifications Setup
  private async setupPushNotifications(): Promise<void> {
    if (!('Notification' in window) || !('PushManager' in window)) {
      console.warn('[PWA] Push notifications not supported');
      return;
    }

    // Check current permission
    const permission = await Notification.requestPermission();
    console.log('[PWA] Notification permission:', permission);
  }

  // Public Methods

  // Check if app can be installed
  public canInstall(): boolean {
    return this.installPrompt !== null;
  }

  // Trigger install prompt
  public async install(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('[PWA] Install prompt not available');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const choice = await this.installPrompt.userChoice;
      
      console.log('[PWA] Install choice:', choice.outcome);
      this.trackEvent('pwa_install_prompt', { outcome: choice.outcome });
      
      if (choice.outcome === 'accepted') {
        this.installPrompt = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }

  // Check if app is in standalone mode
  public isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Get app installation status
  public getInstallationStatus(): 'unknown' | 'installable' | 'installed' | 'not-supported' {
    if (!('serviceWorker' in navigator)) {
      return 'not-supported';
    }
    
    if (this.isStandalone()) {
      return 'installed';
    }
    
    if (this.canInstall()) {
      return 'installable';
    }
    
    return 'unknown';
  }

  // Network status
  public isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Show notification
  public async showNotification(options: NotificationOptions): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('[PWA] Notifications not supported');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[PWA] Notification permission denied');
      return;
    }

    try {
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/favicon.ico',
          tag: options.tag,
          requireInteraction: options.requireInteraction,
          actions: options.actions
        });
      } else {
        new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/favicon.ico'
        });
      }
    } catch (error) {
      console.error('[PWA] Failed to show notification:', error);
    }
  }

  // Queue data for background sync
  public queueForSync(type: BackgroundSyncData['type'], data: any): void {
    const syncData: BackgroundSyncData = {
      type,
      data,
      timestamp: Date.now(),
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.syncQueue.push(syncData);
    console.log('[PWA] Queued for sync:', syncData.id);

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    } else {
      // Register for background sync when back online
      this.registerBackgroundSync(type);
    }
  }

  // Request push notification subscription
  public async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      console.error('[PWA] Service worker not registered');
      return null;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.getVapidKey()
      });

      console.log('[PWA] Push subscription created');
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('[PWA] Failed to subscribe to push:', error);
      return null;
    }
  }

  // Update service worker
  public async updateServiceWorker(): Promise<void> {
    if (this.serviceWorkerRegistration) {
      try {
        await this.serviceWorkerRegistration.update();
        console.log('[PWA] Service worker updated');
      } catch (error) {
        console.error('[PWA] Service worker update failed:', error);
      }
    }
  }

  // Private Helper Methods

  private async registerBackgroundSync(tag: string): Promise<void> {
    if (this.serviceWorkerRegistration && 'sync' in this.serviceWorkerRegistration) {
      try {
        await this.serviceWorkerRegistration.sync.register(`${tag}-sync`);
        console.log('[PWA] Background sync registered:', tag);
      } catch (error) {
        console.error('[PWA] Background sync registration failed:', error);
      }
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0) return;

    console.log('[PWA] Processing sync queue:', this.syncQueue.length, 'items');

    const processed: string[] = [];

    for (const item of this.syncQueue) {
      try {
        await this.syncItem(item);
        processed.push(item.id);
        console.log('[PWA] Synced item:', item.id);
      } catch (error) {
        console.error('[PWA] Failed to sync item:', item.id, error);
      }
    }

    // Remove processed items
    this.syncQueue = this.syncQueue.filter(item => !processed.includes(item.id));
  }

  private async syncItem(item: BackgroundSyncData): Promise<void> {
    const endpoints = {
      'blog-post': '/api/blog/posts',
      'settings': '/api/user/settings',
      'comment': '/api/comments',
      'integration': '/api/integrations'
    };

    const endpoint = endpoints[item.type];
    if (!endpoint) {
      throw new Error(`Unknown sync type: ${item.type}`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item.data)
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
    }
  }

  private notifyUpdate(): void {
    // Show update notification
    this.showNotification({
      title: 'App Update Available',
      body: 'A new version of DOT Platform is available. Restart the app to update.',
      tag: 'app-update',
      requireInteraction: true,
      actions: [
        { action: 'update', title: 'Update Now' },
        { action: 'dismiss', title: 'Later' }
      ]
    });

    // Dispatch event for UI components
    window.dispatchEvent(new CustomEvent('pwa-update-available'));
  }

  private getVapidKey(): string {
    // This should be your VAPID public key from the server
    return import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('[PWA] Failed to send subscription to server:', error);
    }
  }

  private trackEvent(event: string, data?: any): void {
    // Analytics tracking for PWA events
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, data);
    }
    console.log('[PWA] Event tracked:', event, data);
  }
}

// Export singleton instance
export default PWAService.getInstance();

// Type exports for use in other components
export type { NotificationOptions, BackgroundSyncData };
