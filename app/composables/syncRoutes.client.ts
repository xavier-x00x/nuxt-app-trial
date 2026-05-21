import permissionBulkData from "~/data/permissions_bulk_data.json";
export const useSyncRoutes = () => {
  const syncData = async () => {
    // const router = useRouter();
    const auth = useAuthStore();
    const config = useRuntimeConfig();

    try {
      await $fetch(`${config.public.apiUrl}/permissions/sync`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${auth.accessToken}` },
        body: permissionBulkData,
      });
      console.log("✅ Permissions synced to backend");
    } catch (e) {
      console.error("❌ Failed to sync permissions", e);
    }
  };

  return { syncData };
};
