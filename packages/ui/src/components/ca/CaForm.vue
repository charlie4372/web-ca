<script setup lang="ts">
import { ref } from 'vue';
import { NForm, NFormItem, NInput, NSelect, NInputNumber, NButton, NSpace, NDivider } from 'naive-ui';
import type { CaCertificate } from '@web-ca/shared';

const props = defineProps<{
  parentCas: CaCertificate[];
  loading: boolean;
}>();

const emit = defineEmits<{
  submit: [data: any];
}>();

const form = ref({
  name: '',
  subject: {
    commonName: '',
    organization: '',
    organizationalUnit: '',
    country: '',
  },
  keyAlgorithm: 'RSA-2048',
  validityDays: 3650,
  parentCaId: undefined as string | undefined,
});

const algorithmOptions = [
  { label: 'RSA 2048', value: 'RSA-2048' },
  { label: 'RSA 4096', value: 'RSA-4096' },
  { label: 'EC P-256', value: 'EC-P256' },
  { label: 'EC P-384', value: 'EC-P384' },
];

const parentOptions = props.parentCas.map((ca) => ({
  label: `${ca.name} (${ca.subjectCn})`,
  value: ca.id,
}));

function handleSubmit() {
  const data: any = {
    name: form.value.name,
    subject: {
      commonName: form.value.subject.commonName,
      organization: form.value.subject.organization,
    },
    keyAlgorithm: form.value.keyAlgorithm,
    validityDays: form.value.validityDays,
  };
  if (form.value.subject.organizationalUnit) {
    data.subject.organizationalUnit = form.value.subject.organizationalUnit;
  }
  if (form.value.subject.country) {
    data.subject.country = form.value.subject.country;
  }
  if (form.value.parentCaId) {
    data.parentCaId = form.value.parentCaId;
  }
  emit('submit', data);
}
</script>

<template>
  <NForm @submit.prevent="handleSubmit">
    <NFormItem label="Name" required>
      <NInput v-model:value="form.name" placeholder="My Root CA" />
    </NFormItem>

    <NDivider>Subject</NDivider>

    <NFormItem label="Common Name (CN)" required>
      <NInput v-model:value="form.subject.commonName" placeholder="My Root CA" />
    </NFormItem>
    <NFormItem label="Organization (O)" required>
      <NInput v-model:value="form.subject.organization" placeholder="My Company" />
    </NFormItem>
    <NFormItem label="Organizational Unit (OU)">
      <NInput v-model:value="form.subject.organizationalUnit" placeholder="IT Department" />
    </NFormItem>
    <NFormItem label="Country (C)">
      <NInput v-model:value="form.subject.country" placeholder="AU" :maxlength="2" />
    </NFormItem>

    <NDivider>Settings</NDivider>

    <NFormItem label="Key Algorithm">
      <NSelect v-model:value="form.keyAlgorithm" :options="algorithmOptions" />
    </NFormItem>
    <NFormItem label="Validity (days)">
      <NInputNumber v-model:value="form.validityDays" :min="1" :max="36500" style="width: 100%" />
    </NFormItem>
    <NFormItem label="Parent CA (optional)">
      <NSelect
        v-model:value="form.parentCaId"
        :options="parentOptions"
        clearable
        placeholder="None (Root CA)"
      />
    </NFormItem>

    <NSpace justify="end">
      <NButton type="primary" attr-type="submit" :loading="loading">Create CA</NButton>
    </NSpace>
  </NForm>
</template>
