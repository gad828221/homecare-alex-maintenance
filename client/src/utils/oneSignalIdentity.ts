export type OneSignalRole = 'admin' | 'manager' | 'tech' | 'data-entry' | string;

type IdentityUser = {
  id?: string | number;
  username?: string;
  name?: string;
  role?: string;
  techName?: string;
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

/**
 * Links the current signed-in staff member to a stable OneSignal External ID.
 * The callback is queued so it is safe before or after the deferred SDK loads.
 */
export function syncOneSignalIdentity(user: IdentityUser | null | undefined, roleOverride?: string): void {
  if (typeof window === 'undefined' || !user) return;

  const role = normalizeRole(roleOverride || user.role);
  const externalId = getOneSignalExternalId(user, role);
  if (!externalId || !role) return;

  const win = window as Window & {
    OneSignalDeferred?: Array<(oneSignal: any) => void | Promise<void>>;
  };
  win.OneSignalDeferred = win.OneSignalDeferred || [];
  win.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      if (typeof OneSignal.login === 'function') {
        await OneSignal.login(externalId);
      } else if (typeof OneSignal.User?.login === 'function') {
        await OneSignal.User.login(externalId);
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

      if (typeof OneSignal.User?.addTags === 'function') {
        const nonEmptyTags = Object.fromEntries(Object.entries(tags).filter(([, value]) => Boolean(value)));
        await OneSignal.User.addTags(nonEmptyTags);
      } else if (typeof OneSignal.User?.addTag === 'function') {
        for (const [key, value] of Object.entries(tags)) {
          if (value) await OneSignal.User.addTag(key, value);
        }
      }

      console.info('[Maintenance Guide] OneSignal identity linked:', externalId, role);
    } catch (error) {
      console.error('[Maintenance Guide] OneSignal identity link failed:', error);
    }
  });
}
