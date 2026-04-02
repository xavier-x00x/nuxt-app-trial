export const useSyncRoutes = () => {
  const syncData = async () => {
    const router = useRouter();
    const routes = router.getRoutes().map((r) => ({
      path: r.path,
      name: r.name,
    }));

    try {
      await $fetch("http://localhost:3050/api/autorization/sync-routes", {
        method: "POST",
        body: { routes },
      });
      console.log("✅ Routes synced to backend");
    } catch (e) {
      console.error("❌ Failed to sync routes", e);
    }
  };

  return { syncData };
};
