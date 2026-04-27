<script setup lang="ts">
import { ref } from 'vue';
import { NForm, NFormItem, NInput, NButton, NSpace } from 'naive-ui';

defineProps<{ loading: boolean }>();
const emit = defineEmits<{ submit: [data: any] }>();

const form = ref({
  name: '',
  certificatePem: '',
  privateKeyPem: '',
});

function handleSubmit() {
  emit('submit', { ...form.value });
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
    <NSpace justify="end">
      <NButton type="primary" attr-type="submit" :loading="loading">Upload CA</NButton>
    </NSpace>
  </NForm>
</template>
