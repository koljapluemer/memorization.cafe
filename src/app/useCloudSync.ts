import { ref, computed, onUnmounted } from 'vue';
import type { Subscription } from 'dexie';

import { db } from '@/app/database';

// Dexie Cloud type interfaces
interface DexieCloudUser {
  userId: string;
  name?: string;
  email?: string;
  isLoggedIn: boolean;
}

interface DexieCloudAlert {
  type: 'info' | 'warning' | 'error';
  message: string;
  messageParams?: Record<string, string>;
}

interface DexieCloudField {
  type?: string;
  label: string;
  placeholder?: string;
}

interface DexieCloudInteraction {
  type: string;
  title?: string;
  alerts?: DexieCloudAlert[];
  fields?: Record<string, DexieCloudField>;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: (values: Record<string, string>) => void;
  onCancel?: () => void;
}

interface DexieCloudSyncState {
  status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'not-connected';
  phase?: 'pushing' | 'pulling' | 'idle';
}

export function useCloudSync() {
  const currentUser = ref<DexieCloudUser | null>(null);
  const userInteraction = ref<DexieCloudInteraction | null>(null);
  const syncStatus = ref<string>('not-connected');
  const subscriptions: Subscription[] = [];

  // Computed properties
  const isLoggedIn = computed(() => {
    return currentUser.value?.isLoggedIn === true && !!currentUser.value?.email;
  });

  const displaySyncStatus = computed(() => {
    // Check if Dexie Cloud is configured
    if (!import.meta.env.VITE_DEXIE_CLOUD_URL) {
      return 'Not configured';
    }

    if (!db.cloud.syncState) return 'Not connected';

    const state = db.cloud.syncState.value;
    if (!state) return 'Not connected';

    // If not logged in, don't show connected status
    if (!currentUser.value?.isLoggedIn) {
      return 'Not synced (local only)';
    }

    const typedState = state as DexieCloudSyncState;

    switch (typedState.status) {
      case 'connected':
        if (typedState.phase === 'pushing' || typedState.phase === 'pulling') {
          return 'Syncing...';
        }
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  });

  // Subscribe to authentication state
  const subscribeToAuth = () => {
    if (db.cloud.currentUser) {
      const userSub = db.cloud.currentUser.subscribe((user) => {
        currentUser.value = (user ?? null) as DexieCloudUser | null;
      });
      subscriptions.push(userSub);
    }

    if (db.cloud.userInteraction) {
      const interactionSub = db.cloud.userInteraction.subscribe((interaction) => {
        userInteraction.value = (interaction ?? null) as DexieCloudInteraction | null;
      });
      subscriptions.push(interactionSub);
    }

    if (db.cloud.syncState) {
      const syncSub = db.cloud.syncState.subscribe((state) => {
        const typedState = state as DexieCloudSyncState | null;
        syncStatus.value = typedState?.status ?? 'not-connected';
      });
      subscriptions.push(syncSub);
    }
  };

  // Authentication methods
  const login = async () => {
    try {
      await db.cloud.login();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await db.cloud.logout();
      currentUser.value = null;
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  // Handle user interaction submission
  const submitInteraction = (values: Record<string, string>) => {
    if (userInteraction.value?.onSubmit) {
      userInteraction.value.onSubmit(values);
    }
  };

  const cancelInteraction = () => {
    if (userInteraction.value?.onCancel) {
      userInteraction.value.onCancel();
    }
  };

  // Initialize subscriptions
  subscribeToAuth();

  // Cleanup on unmount
  onUnmounted(() => {
    subscriptions.forEach((sub) => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
  });

  return {
    currentUser,
    isLoggedIn,
    syncStatus: displaySyncStatus,
    userInteraction,
    login,
    logout,
    submitInteraction,
    cancelInteraction,
  };
}
