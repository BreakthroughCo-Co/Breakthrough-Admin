import { auth } from '@/lib/firebase';

/**
 * Authenticated API Fetch Helper
 * 
 * Automatically attaches the current user's Firebase ID token to the Authorization header
 * if a user session is active. Handles standard JSON headers and error serialization.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
  } catch (err) {
    console.warn('Could not retrieve Firebase ID token for authFetch:', err);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
