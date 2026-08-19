export type StoredSessionUser = {
  id?: string | number;
  username?: string;
  name?: string;
  role?: string;
  techName?: string;
};

const AUTH_KEYS = ['currentUser', 'userRole', 'techName', 'audio_forced_enabled'] as const;

export const readAuthSession = (): { user: StoredSessionUser | null; role: string | null } => {
  try {
    const raw = localStorage.getItem('currentUser');
    const user = raw ? JSON.parse(raw) as StoredSessionUser : null;
    const role = localStorage.getItem('userRole') || user?.role || null;
    if (!localStorage.getItem('userRole') && role) localStorage.setItem('userRole', role);
    return { user, role };
  } catch {
    return { user: null, role: null };
  }
};

/**
 * The only routine that removes the local authentication session.
 * It is called by an explicit logout button, never by navigation or SW startup.
 */
export const clearAuthSession = () => {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  sessionStorage.removeItem('audio_forced_enabled');
};
