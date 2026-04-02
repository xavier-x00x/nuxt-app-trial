<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
const route = useRoute();
const title = "Edit User";
useHead({
  title: title,
});

const auth = useAuthStore();

const userResponse: any = await useFetch(
  "http://localhost:3050/api/users/" + route.params.id,
  {
    method: "GET",
    headers: {
      Authorization: "Bearer " + auth.accessToken,
    },
  }
);

const user = userResponse.data.value.data;

if (!user) {
  throw createError({ statusCode: 404, statusMessage: "User not found" });
}

const dataForm = reactive({
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
});

console.log(dataForm);

// onMounted(async () => {
//   const res: { data: any } = await useApi(
//     "http://localhost:3050/api/autorization/roles/" + route.params.id
//   );
//   dataForm.name = res?.data.name;
//   dataForm.permission = res?.data.permission ?? [];
// });

const form = ref();
const { loading, success, errors, submitForm } = useForm();

const onSubmit = async () => {
  await submitForm("http://localhost:3050/api/users/" + route.params.id, {
    method: "PUT",
    body: dataForm,
  });

  if (success.value) {
    navigateTo("/user");
  }
};
</script>
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:package">
      <button
        :disabled="loading"
        type="button"
        class="btn btn-primary rounded-1"
        @click="form.requestSubmit()"
      >
        <Icon
          v-if="!loading"
          name="i-tabler:clipboard-check"
          class="icon icon-2 me-1"
        />
        <span
          v-else
          class="spinner-border text-cyan icon icon-2 me-2"
          role="status"
        ></span>
        {{ loading ? "Loading..." : "Simpan" }}
      </button>
    </PageHeader>
    <PageBody>
      <form ref="form" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-6 col-md-8 col-sm-12">
            <ui-input
              v-model="dataForm.name"
              label="Name"
              type="text"
              placeholder="Input Name"
              :error="errors.Name"
            />
            <ui-input
              v-model="dataForm.username"
              label="Username"
              type="text"
              placeholder="Input Username"
              :error="errors.Username"
            />
            <ui-input
              v-model="dataForm.email"
              label="Email"
              type="email"
              placeholder="Input Email"
              :error="errors.Email"
            />
            <div class="mb-2">
              <label class="form-label mb-1">Role</label>
              <ui-select-search
                v-model="dataForm.role"
                xname="role"
                value-key="name"
                placeholder="Input Role"
                :api-url="'http://localhost:3050/api/autorization/roles'"
                :select-format="(item) => `${item.name}`"
                :selected-format="(item) => `${item.name}`"
              />
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
