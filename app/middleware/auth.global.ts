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
      await auth.fetchUser();
    } else if (import.meta.dev) {
      console.log('[auth.global.ts SSR] Token already in store, skipping load');
    }

    // SSR: check authentication after loading tokens
    if (!auth.isAuthenticated) {
      // Allow access to public auth pages
      if (PUBLIC_AUTH_PATHS.includes(to.path as (typeof PUBLIC_AUTH_PATHS)[number])) {
        return;
      }
      // Redirect to login if not authenticated
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
  console.log('isHydrating : ', nuxtApp.isHydrating);
  if (nuxtApp.isHydrating) {
    // Still load from cookies so client-side store is populated
    if (!auth.accessToken) {
      if (import.meta.dev) {
        console.log('[auth.global.ts hydration] No token, loading from cookies');
      }
      auth.loadFromCookies();
    }
    
    return;
  }

  // ── Client: public auth pages ──────────────────────────────────
  if (PUBLIC_AUTH_PATHS.includes(to.path as (typeof PUBLIC_AUTH_PATHS)[number])) {
    console.log('auth : ', auth.isAuthenticated);
    if (auth.isAuthenticated) {
      await auth.logout();
    }
    return;
  }

  // ── Client: ensure authenticated ───────────────────────────────
  // if (!auth.accessToken) {
  //   if (import.meta.dev) {
  //     console.log('[auth.global.ts client] No token, loading from cookies');
  //   }
  //   auth.loadFromCookies();
  // }

  if (!import.meta.server) {
    if (import.meta.dev) {
      console.log('[auth.global.ts client] Loading tokens from cookies on client');
    }
    auth.loadFromCookies();
  }

  console.log('auth : ', auth.isAuthenticated);

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
