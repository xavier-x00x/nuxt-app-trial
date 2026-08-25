<script setup lang="ts">
const auth = useAuthStore();
const title = "Sign In";
definePageMeta({
  layout: "auth",
});

useHead({
  title: title,
});

const reactNav = useState("react-nav", () => 0);

const dataForm = reactive({
  identity: "noto@dev.com",
  password: "12345678",
  remember: false,
});

const onSubmit = async () => {
  await auth.login(dataForm.identity, dataForm.password, dataForm.remember);
  if (auth.isAuthenticated) {
    reactNav.value++;
    navigateTo("/");
  }
};

const onGoogleError = (error: any) => {
  console.error("Google login failed:", error);
};

onMounted(() => {
  const firstInput = document.querySelector<HTMLInputElement>("input");
  firstInput?.focus();
});
</script>

<template>
  <div class="container-tight">
    <div class="text-center mb-2">
      <a href="." class="navbar-brand navbar-brand-autodark">
        <h2 class="h2 text-center mb-0">
          <img
            src="/vendor/img/D33.png"
            alt="Tabler"
            style="height: 35px"
            class="bg-green-lt border border-green-lt rounded-3 me-2"
          >
          <strong>Admin Panel</strong>
        </h2>
      </a>
    </div>
    <div class="card card-md">
      <div class="card-body">
        <h2 class="h2 text-center mb-4">Login to your account</h2>
        <form autocomplete="off" novalidate @submit.prevent="onSubmit">
          <div class="mb-3">
            <label class="form-label">Email / Username / No. HP</label>
            <input
              v-model="dataForm.identity"
              type="text"
              class="form-control"
              placeholder="Masukkan Email, Username, atau No. HP"
              required
            >
          </div>
          <div class="mb-2">
            <label class="form-label">Password</label>
            <div class="input-group input-group-flat">
              <input
                v-model="dataForm.password"
                type="password"
                class="form-control"
                placeholder="Masukkan password"
                autocomplete="off"
                required
              >
            </div>
          </div>
          <div class="mb-2">
            <label class="form-check">
              <input
                v-model="dataForm.remember"
                type="checkbox"
                class="form-check-input"
              >
              <span class="form-check-label">Remember me on this device</span>
            </label>
          </div>
          <div class="form-footer">
            <button
              :disabled="auth.loading"
              type="submit"
              class="btn btn-primary w-100"
            >
              {{ auth.loading ? "Loading..." : "Sign in" }}
            </button>
          </div>
        </form>
      </div>
      <div class="hr-text">or</div>
      <div class="card-body">
        <div class="row">
          <div class="col">
            <ClientOnly>
              <ui-google-sign-in
                :remember="dataForm.remember"
                @error="onGoogleError"
              />
              <template #fallback>
                <a class="btn btn-4 w-100 disabled">
                  <span class="spinner-border spinner-border-sm me-2" />
                  Loading Google Sign-In...
                </a>
              </template>
            </ClientOnly>
          </div>
        </div>
      </div>
    </div>
    <div class="text-center text-secondary my-3">
      Don't have account yet?
      <NuxtLink to="/sign-up" tabindex="-1">Sign up</NuxtLink>
    </div>
  </div>
</template>
