/**
 * Global auth middleware.
 * - SSR: loads tokens from cookies and validates session.
 * - Client: ensures user is authenticated and has access to the target route.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore();
  const { setFlash } = useFlash();

  const PUBLIC_AUTH_PATHS = ["/sign-in", "/sign-up"] as const;
  const LOGIN_PATH = "/sign-in" as const;

  // ── SSR: load tokens from cookies ──────────────────────────────
  if (import.meta.server) {
    if (!auth.accessToken) {
      if (import.meta.dev) {
        console.log('[auth.global.ts SSR] No token in store, loading from cookies');
      }
      auth.loadFromCookies();
    }

    // If we are not fully authenticated (e.g. missing token or missing user),
    // we call fetchUser() which will automatically attempt to refresh the token if needed.
    if (!auth.isAuthenticated) {
      await auth.fetchUser();
    }

    // SSR: check authentication after loading tokens
    if (!auth.isAuthenticated) {
      // Allow access to public auth pages
      if (PUBLIC_AUTH_PATHS.includes(to.path as (typeof PUBLIC_AUTH_PATHS)[number])) {
        return;
      }
      if (import.meta.dev) {
        console.log('[auth.global.ts SSR] Not authenticated, redirecting to login');
      }
      return navigateTo(LOGIN_PATH);
    }

    // SSR: check route access
    try {
      const hasAccess = await auth.checkAccess(to.path);
      if (!hasAccess) {
        if (import.meta.dev) {
          console.log('[auth.global.ts SSR] Access denied for:', to.path);
        }
        return navigateTo(LOGIN_PATH);
      }
    } catch (error) {
      console.error('[auth.global.ts SSR] checkAccess failed:', error);
      return navigateTo(LOGIN_PATH);
    }

    return;
  }

  // ── Client: skip during hydration ──────────────────────────────
  // On page refresh, SSR already validated the session and rendered
  // the page with user data. Re-running auth checks during hydration
  // is redundant and causes jitter (async gaps while re-fetching).
  const nuxtApp = useNuxtApp();
  if (nuxtApp.isHydrating) {
    // Still load from cookies so client-side store is populated
    if (!auth.accessToken) {
      auth.loadFromCookies();
    }
    return;
  }

  // ── Client: public auth pages ──────────────────────────────────
  if (PUBLIC_AUTH_PATHS.includes(to.path as (typeof PUBLIC_AUTH_PATHS)[number])) {
    if (auth.isAuthenticated) {
      await auth.logout();
    }
    return;
  }

  // ── Client: ensure authenticated ───────────────────────────────
  auth.loadFromCookies();

  // Only fetch user if not already authenticated
  if (!auth.isAuthenticated) {
    await auth.fetchUser();
  }

  if (!auth.isAuthenticated) {
    return navigateTo(LOGIN_PATH);
  }

  // ── Client: check route access ─────────────────────────────────
  try {
    const hasAccess = await auth.checkAccess(to.path);
    if (!hasAccess) {
      if (to.path === "/") {
        setFlash("Anda belum memiliki akses", "warning");
        return navigateTo(LOGIN_PATH, { replace: true });
      }
      setFlash(`(404) Anda tidak memiliki akses ke halaman ${to.path}`, "warning");
      return navigateTo("/", { replace: true });
    }
  } catch (error) {
    console.error("[auth.global.ts] checkAccess failed:", error);
    setFlash("Terjadi kesalahan saat memeriksa akses", "error");
    return navigateTo(LOGIN_PATH, { replace: true });
  }
});
