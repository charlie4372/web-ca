<script setup lang="ts">
import { ref } from 'vue';
import { NForm, NFormItem, NInput, NButton, NSpace } from 'naive-ui';

defineProps<{ loading: boolean }>();
const emit = defineEmits<{ submit: [data: any] }>();

const form = ref({
  name: '',
  certificatePem: '',
  privateKeyPem: '',
  passphrase: '',
});

function handleSubmit() {
  const data: any = {
    name: form.value.name,
    certificatePem: form.value.certificatePem,
    privateKeyPem: form.value.privateKeyPem,
  };
  if (form.value.passphrase) data.passphrase = form.value.passphrase;
  emit('submit', data);
}
</script>

<template>
  <NForm @submit.prevent="handleSubmit">
    <NFormItem label="Name" required>
      <NInput v-model:value="form.name" placeholder="Imported CA" />
    </NFormItem>
    <NFormItem label="Certificate PEM" required>
      <NInput
        v-model:value="form.certificatePem"
        type="textarea"
        :rows="8"
        placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
      />
    </NFormItem>
    <NFormItem label="Private Key PEM" required>
      <NInput
        v-model:value="form.privateKeyPem"
        type="textarea"
        :rows="8"
        placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
      />
    </NFormItem>
    <NFormItem label="Passphrase (if key is encrypted)">
      <NInput
        v-model:value="form.passphrase"
        type="password"
        show-password-on="click"
        placeholder="Leave blank if key is not encrypted"
      />
    </NFormItem>
    <NSpace justify="end">
      <NButton type="primary" attr-type="submit" :loading="loading">Upload CA</NButton>
    </NSpace>
  </NForm>
</template>
