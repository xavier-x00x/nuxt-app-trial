<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();

const id = computed(() => String(route.params.id));
const isNew = computed(() => id.value === "new");
const title = computed(() => isNew.value ? "Tambah Pengguna Baru" : "Edit Pengguna");
useHead({ title });

interface UserForm {
  name: string;
  username: string;
  email: string;
  phone: string;
  password?: string;
  store_id: string | null;
  store_name?: string | null;
  role: string;
  pin?: string;
  is_active: boolean;
}

const dataForm = ref<UserForm>({
  name: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  store_id: null,
  role: "",
  pin: "",
  is_active: true,
});

const selectedItemRole = ref({ name: "" });

if (!isNew.value) {
  const { data: userResp, error } = await useApiFetch<any>(`/users/${id.value}`);
  if (error.value || !userResp.value?.data) {
    setFlash("Data user tidak ditemukan", "error");
    navigateTo("/user");
  } else {
    const user = userResp.value.data;
    dataForm.value = {
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      store_id: user.store_id || null,
      store_name: user.store_name || null,
      role: user.role || "",
      pin: "",
      is_active: user.is_active ?? true,
    };
    selectedItemRole.value = { name: user.role || "" };
  }
}

const form = ref<HTMLFormElement>();
const { loading, success, errors, formatError, submitForm } = useForm2();

const onSubmit = async () => {
  const payload: Record<string, any> = {
    name: dataForm.value.name?.trim(),
    username: dataForm.value.username?.trim(),
    email: dataForm.value.email?.trim()?.toLowerCase(),
    phone: dataForm.value.phone ? dataForm.value.phone.trim() : null,
    role: dataForm.value.role,
    store_id: dataForm.value.store_id || null,
    is_active: dataForm.value.is_active,
  };

  if (dataForm.value.pin && dataForm.value.pin.trim() !== "") {
    payload.pin = dataForm.value.pin.trim();
  }

  if (isNew.value) {
    payload.password = dataForm.value.password;
    await submitForm("/users", {
      method: "POST",
      body: payload,
    });
  } else {
    if (dataForm.value.password && dataForm.value.password.trim() !== "") {
      payload.password = dataForm.value.password;
    }
    await submitForm(`/users/${id.value}`, {
      method: "PUT",
      body: payload,
    });
  }

  if (success.value) {
    setFlash(`Pengguna berhasil ${isNew.value ? 'dibuat' : 'diperbarui'}`, "success");
    navigateTo("/user");
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:users">
      <ui-button-back to="/user" />
      <ui-button-save :loading="loading" :form="form" @save="form?.requestSubmit()" />
    </PageHeader>
    <PageBody>
      <form ref="form" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-8 col-md-10 col-sm-12">
            <div class="card mb-3">
              <div class="card-header py-2">
                <h4 class="card-title mb-0">Informasi Akun</h4>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-6">
                    <ui-input2
                      v-model="dataForm.name"
                      label="Nama Lengkap *"
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      :error="formatError('Nama Lengkap', 'name')"
                    />
                  </div>
                  <div class="col-md-6">
                    <ui-input2
                      v-model="dataForm.username"
                      label="Username *"
                      type="text"
                      placeholder="Masukkan username login"
                      :error="formatError('Username', 'username')"
                    />
                  </div>
                  <div class="col-md-6">
                    <ui-input2
                      v-model="dataForm.email"
                      label="Email *"
                      type="email"
                      placeholder="contoh: user@supermarket.com"
                      :error="formatError('Email', 'email')"
                    />
                  </div>
                  <div class="col-md-6">
                    <ui-input2
                      v-model="dataForm.phone"
                      label="Nomor Telepon / WhatsApp"
                      type="text"
                      placeholder="contoh: 08123456789"
                      :error="formatError('Telepon', 'phone')"
                    />
                  </div>
                  <div class="col-md-6">
                    <ui-input2
                      v-model="dataForm.password"
                      :label="isNew ? 'Password *' : 'Password Baru (Kosongkan jika tidak diubah)'"
                      type="password"
                      placeholder="Minimal 6 karakter"
                      :error="formatError('Password', 'password')"
                    />
                  </div>
                  <div class="col-md-6">
                    <ui-input2
                      v-model="dataForm.pin"
                      label="PIN Kasir / POS (Opsional)"
                      type="password"
                      placeholder="6 digit angka PIN"
                      :error="formatError('PIN', 'pin')"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="card mb-3">
              <div class="card-header py-2">
                <h4 class="card-title mb-0">Hak Akses & Penugasan Cabang</h4>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-6">
                    <ui-SelectSearch4
                      v-model="dataForm.role"
                      v-model:selected-data="selectedItemRole"
                      xname="role"
                      value-key="name"
                      label="Role / Jabatan *"
                      api-url="/roles/pagination"
                      placeholder="Pilih Role Pengguna..."
                      :error="formatError('Role', 'role')"
                    />
                  </div>
                  <div class="col-md-6">
                    <ui-SelectSearch4
                      v-model="dataForm.store_id"
                      xname="store_id"
                      value-key="id"
                      label="Toko Cabang (Opsional)"
                      :initial-text="dataForm.store_name || undefined"
                      api-url="/inventory/stores/pagination"
                      placeholder="Pilih Cabang Tempat Bertugas..."
                      :error="formatError('Toko', 'store_id')"
                    />
                  </div>
                  <div class="col-12">
                    <div class="form-check form-switch mt-2">
                      <input
                        id="isActiveSwitch"
                        v-model="dataForm.is_active"
                        class="form-check-input"
                        type="checkbox"
                      >
                      <label class="form-check-label fw-bold" for="isActiveSwitch">
                        Akun Pengguna Aktif
                      </label>
                      <div class="text-muted small">
                        Pengguna yang dinonaktifkan tidak akan dapat masuk ke sistem.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
