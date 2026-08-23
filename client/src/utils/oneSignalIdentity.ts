export type OneSignalRole = 'admin' | 'manager' | 'tech' | 'data-entry' | string;

type IdentityUser = {
  id?: string | number;
  username?: string;
  name?: string;
  role?: string;
  techName?: string;
};

type OneSignalLike = {
  login?: (externalId: string) => Promise<void> | void;
  User?: {
    login?: (externalId: string) => Promise<void> | void;
    addTags?: (tags: Record<string, string>) => Promise<void> | void;
    addTag?: (key: string, value: string) => Promise<void> | void;
    PushSubscription?: {
      optedIn?: boolean | Promise<boolean>;
      optIn?: () => Promise<void> | void;
    };
  };
};

const normalizeRole = (value: unknown): string => String(value || '').trim().toLowerCase();

const safeIdentityPart = (value: unknown): string => String(value ?? '')
  .trim()
  .replace(/[^a-zA-Z0-9._:@-]/g, '_')
  .slice(0, 100);

export function getOneSignalExternalId(user: IdentityUser | null | undefined, roleOverride?: string): string | null {
  if (!user) return null;
  const role = normalizeRole(roleOverride || user.role);
  const rawIdentity = user.id ?? user.username ?? user.techName ?? user.name;
  const identity = safeIdentityPart(rawIdentity);
  if (!role || !identity) return null;
  return role === 'tech' ? `tech:${identity}` : `staff:${role}:${identity}`;
}

async function linkIdentity(oneSignal: OneSignalLike, user: IdentityUser, role: string, externalId: string): Promise<void> {
  if (typeof oneSignal.login === 'function') {
    await oneSignal.login(externalId);
  } else if (typeof oneSignal.User?.login === 'function') {
    await oneSignal.User.login(externalId);
  } else {
    throw new Error('OneSignal login API is unavailable');
  }

  const tags: Record<string, string> = {
    role,
    user_id: String(user.id ?? ''),
    username: String(user.username ?? ''),
    user_name: String(user.name || user.techName || ''),
  };
  if (role === 'tech') {
    tags.tech_id = String(user.id ?? '');
    tags.tech_name = String(user.techName || user.name || '');
  }

  const nonEmptyTags = Object.fromEntries(Object.entries(tags).filter(([, value]) => Boolean(value)));
  if (typeof oneSignal.User?.addTags === 'function') {
    await oneSignal.User.addTags(nonEmptyTags);
  } else if (typeof oneSignal.User?.addTag === 'function') {
    for (const [key, value] of Object.entries(nonEmptyTags)) {
      await oneSignal.User.addTag(key, value);
    }
  }

  // If the browser permission was already granted, opt in silently after login.
  // A permission prompt is never opened automatically; a first-time user can opt in from the browser/site UI.
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    const subscription = oneSignal.User?.PushSubscription;
    if (subscription?.optIn && !(await subscription.optedIn)) {
      await subscription.optIn();
    }
  }

  console.info('[Maintenance Guide] OneSignal identity linked:', externalId, role);
}

/**
 * Links the current signed-in staff member to a stable OneSignal External ID.
 * It works both before and after SDK initialization; callbacks added after init
 * are executed directly instead of being left in a drained deferred queue.
 */
export function syncOneSignalIdentity(user: IdentityUser | null | undefined, roleOverride?: string): void {
  if (typeof window === 'undefined' || !user) return;

  const role = normalizeRole(roleOverride || user.role);
  const externalId = getOneSignalExternalId(user, role);
  if (!externalId || !role) return;

  const win = window as Window & {
    OneSignal?: OneSignalLike;
    OneSignalReady?: boolean;
    OneSignalDeferred?: Array<(oneSignal: OneSignalLike) => void | Promise<void>>;
  };

  let settled = false;
  const run = (oneSignal: OneSignalLike) => {
    if (settled) return;
    settled = true;
    void linkIdentity(oneSignal, user, role, externalId).catch((error) => {
      console.error('[Maintenance Guide] OneSignal identity link failed:', error);
    });
  };

  const tryCurrentSdk = () => {
    const oneSignal = win.OneSignal;
    const hasLogin = typeof oneSignal?.login === 'function' || typeof oneSignal?.User?.login === 'function';
    const hasPushSubscription = Boolean(oneSignal?.User?.PushSubscription);
    if (oneSignal && hasLogin && hasPushSubscription) {
      run(oneSignal);
      return true;
    }
    return false;
  };

  if (tryCurrentSdk()) return;

  win.OneSignalDeferred = win.OneSignalDeferred || [];
  win.OneSignalDeferred.push(run);

  // Covers the case where the SDK already drained its deferred queue before React mounted.
  let attempts = 0;
  const retryTimer = window.setInterval(() => {
    attempts += 1;
    if (tryCurrentSdk() || attempts >= 80) {
      window.clearInterval(retryTimer);
    }
  }, 250);
}
