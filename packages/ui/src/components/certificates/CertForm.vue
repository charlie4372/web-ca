<script setup lang="ts">
import { ref } from 'vue';
import { NForm, NFormItem, NInput, NSelect, NInputNumber, NButton, NSpace, NDivider, NCheckbox, NCheckboxGroup } from 'naive-ui';
import type { CaCertificate, SanEntry } from '@web-ca/shared';
import SanEditor from './SanEditor.vue';

const props = defineProps<{
  cas: CaCertificate[];
  loading: boolean;
  defaultCaId?: string;
}>();

const emit = defineEmits<{ submit: [data: any] }>();

const form = ref({
  name: '',
  subjectCn: '',
  sanEntries: [{ type: 'dns', value: '' }] as SanEntry[],
  keyAlgorithm: 'RSA-2048',
  validityDays: 365,
  keyUsage: ['digitalSignature', 'keyEncipherment'],
  extKeyUsage: ['serverAuth', 'clientAuth'],
  caId: props.defaultCaId || '',
});

const algorithmOptions = [
  { label: 'RSA 2048', value: 'RSA-2048' },
  { label: 'RSA 4096', value: 'RSA-4096' },
  { label: 'EC P-256', value: 'EC-P256' },
  { label: 'EC P-384', value: 'EC-P384' },
];

const caOptions = props.cas.map((ca) => ({
  label: `${ca.name} (${ca.subjectCn})`,
  value: ca.id,
}));

const keyUsageOptions = [
  { label: 'Digital Signature', value: 'digitalSignature' },
  { label: 'Key Encipherment', value: 'keyEncipherment' },
  { label: 'Data Encipherment', value: 'dataEncipherment' },
  { label: 'Key Agreement', value: 'keyAgreement' },
];

const extKeyUsageOptions = [
  { label: 'Server Authentication', value: 'serverAuth' },
  { label: 'Client Authentication', value: 'clientAuth' },
  { label: 'Code Signing', value: 'codeSigning' },
  { label: 'Email Protection', value: 'emailProtection' },
];

function handleSubmit() {
  const filtered = form.value.sanEntries.filter((s) => s.value.trim() !== '');
  emit('submit', { ...form.value, sanEntries: filtered });
}
</script>

<template>
  <NForm @submit.prevent="handleSubmit">
    <NFormItem label="Signing CA" required>
      <NSelect v-model:value="form.caId" :options="caOptions" placeholder="Select a CA" />
    </NFormItem>

    <NFormItem label="Certificate Name" required>
      <NInput v-model:value="form.name" placeholder="api.example.com" />
    </NFormItem>
    <NFormItem label="Subject Common Name (CN)" required>
      <NInput v-model:value="form.subjectCn" placeholder="api.example.com" />
    </NFormItem>

    <NDivider>Subject Alternative Names (SANs)</NDivider>

    <NFormItem label="SAN Entries" required>
      <SanEditor v-model="form.sanEntries" />
    </NFormItem>

    <NDivider>Settings</NDivider>

    <NFormItem label="Key Algorithm">
      <NSelect v-model:value="form.keyAlgorithm" :options="algorithmOptions" />
    </NFormItem>
    <NFormItem label="Validity (days)">
      <NInputNumber v-model:value="form.validityDays" :min="1" :max="825" style="width: 100%" />
    </NFormItem>
    <NFormItem label="Key Usage">
      <NCheckboxGroup v-model:value="form.keyUsage">
        <NSpace>
          <NCheckbox v-for="opt in keyUsageOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </NSpace>
      </NCheckboxGroup>
    </NFormItem>
    <NFormItem label="Extended Key Usage">
      <NCheckboxGroup v-model:value="form.extKeyUsage">
        <NSpace>
          <NCheckbox v-for="opt in extKeyUsageOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </NSpace>
      </NCheckboxGroup>
    </NFormItem>

    <NSpace justify="end">
      <NButton type="primary" attr-type="submit" :loading="loading">Create Certificate</NButton>
    </NSpace>
  </NForm>
</template>
