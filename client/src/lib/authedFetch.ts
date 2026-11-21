// Shared authenticated REST helper for staff pages.
// The apikey header stays the public anon key; the Bearer becomes the signed-in
// staff member's access token, so PostgREST/RLS see the caller's role.
// supabase-js refreshes the token itself.

import { supabase, supabaseUrl, supabaseAnonKey } from './supabaseClient';
import { clearAuthSession } from '../utils/authSession';

// Headers for files that keep their own fetch wrapper (e.g. ProtectedOrders'
// non-throwing helper). Redirects to /login when there is no staff session:
// an anon request would be denied anyway.
export const authedHeaders = async (): Promise<Record<string, string>> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // A stale pre-Supabase legacy session (currentUser/userRole in localStorage)
    // makes App.tsx's guard bounce /login back to a staff page, while this
    // branch sends the staff page to /login: a deterministic redirect loop.
    // Clear the legacy keys first so the /login render is stable.
    clearAuthSession();
    window.location.href = '/login';
    throw new Error('no session');
  }
  return {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
};

export const authedFetch = async (endpoint: string, options?: RequestInit) => {
  const headers = await authedHeaders();
  const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    'method': 'GET',
    ...options,
    headers: {
      ...headers,
      'Prefer': 'return=representation',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};
