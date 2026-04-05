<script setup lang="ts">
const auth = useAuthStore();
const title = "Sign In";

definePageMeta({
  layout: "auth",
});

useHead({
  title: title,
  meta: [
    {
      name: "description",
      content: "Sign in to your admin panel account",
    },
  ],
});

const dataForm = reactive({
  email: "",
  password: "",
  remember: false,
});

const showPassword = ref(false);
const passwordType = computed(() => (showPassword.value ? "text" : "password"));
const submitted = ref(false);

const emailError = computed(() => {
  if (!submitted.value || !dataForm.email) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dataForm.email)) {
    return "Please enter a valid email address";
  }
  return "";
});

const passwordError = computed(() => {
  if (!submitted.value || dataForm.password) return "";
  return "Password is required";
});

const isFormValid = computed(() => {
  return (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dataForm.email) &&
    dataForm.password.length > 0
  );
});

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const onSubmit = async () => {
  submitted.value = true;

  if (!isFormValid.value) {
    return;
  }

  await auth.login(dataForm.email, dataForm.password, dataForm.remember);

  if (auth.error) {
    return;
  }

  if (auth.isAuthenticated) {
    navigateTo("/");
  }
};

const onGoogleSuccess = async (credential: string) => {
  await auth.loginWithGoogle(credential, dataForm.remember);

  if (auth.error) {
    return;
  }

  if (auth.isAuthenticated) {
    navigateTo("/");
  }
};

const onGoogleError = (error: any) => {
  console.error("Google login failed:", error);
};
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
          />
          <strong>Admin Panel</strong>
        </h2>
      </a>
    </div>

    <div class="card card-md">
      <div class="card-body">
        <h2 class="h2 text-center mb-4">Login to your account</h2>

        <form autocomplete="off" novalidate @submit.prevent="onSubmit">
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input
              v-model="dataForm.email"
              type="email"
              class="form-control"
              :class="{ 'is-invalid': emailError }"
              placeholder="Email"
            />
            <div v-if="emailError" class="invalid-feedback">
              {{ emailError }}
            </div>
          </div>

          <div class="mb-2">
            <label class="form-label">Password</label>
            <div class="input-group input-group-flat">
              <input
                v-model="dataForm.password"
                :type="passwordType"
                class="form-control"
                :class="{ 'is-invalid': passwordError }"
                placeholder="Your password"
                autocomplete="off"
              />
              <span class="input-group-text">
                <a
                  href="#"
                  class="link-secondary"
                  title="Show password"
                  data-bs-toggle="tooltip"
                  @click.prevent="togglePasswordVisibility"
                >
                  <svg
                    v-if="!showPassword"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="icon icon-1"
                  >
                    <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                    <path
                      d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"
                    />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="icon icon-1"
                  >
                    <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                    <path
                      d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"
                    />
                    <path d="M3 3l18 18" />
                  </svg>
                </a>
              </span>
              <div v-if="passwordError" class="invalid-feedback">
                {{ passwordError }}
              </div>
            </div>
          </div>

          <div class="mb-2">
            <label class="form-check">
              <input
                v-model="dataForm.remember"
                type="checkbox"
                class="form-check-input"
              />
              <span class="form-check-label">Remember me on this device</span>
            </label>
          </div>

          <div v-if="auth.error" class="alert alert-danger mb-3">
            {{ auth.error }}
          </div>

          <div class="form-footer">
            <button
              :disabled="!isFormValid || auth.loading"
              type="submit"
              class="btn btn-primary w-100"
            >
              <span
                v-if="auth.loading"
                class="spinner-border spinner-border-sm me-2"
                role="status"
              ></span>
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
                @success="onGoogleSuccess"
                @error="onGoogleError"
              />
              <template #fallback>
                <a class="btn btn-4 w-100 disabled">
                  <span class="spinner-border spinner-border-sm me-2"></span>
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
