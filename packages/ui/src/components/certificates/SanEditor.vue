<script setup lang="ts">
import { NSpace, NSelect, NInput, NButton, NIcon } from 'naive-ui';
import { AddOutline, TrashOutline } from '@vicons/ionicons5';
import type { SanEntry } from '@web-ca/shared';

const model = defineModel<SanEntry[]>({ required: true });

const typeOptions = [
  { label: 'DNS', value: 'dns' },
  { label: 'IP Address', value: 'ip' },
  { label: 'URI', value: 'uri' },
  { label: 'Email', value: 'email' },
];

function addEntry() {
  model.value = [...model.value, { type: 'dns', value: '' }];
}

function removeEntry(index: number) {
  model.value = model.value.filter((_, i) => i !== index);
}

function updateEntry(index: number, field: 'type' | 'value', val: string) {
  const updated = [...model.value];
  updated[index] = { ...updated[index], [field]: val };
  model.value = updated;
}

function getPlaceholder(type: string): string {
  switch (type) {
    case 'dns': return '*.example.com';
    case 'ip': return '10.0.0.1';
    case 'uri': return 'https://example.com';
    case 'email': return 'admin@example.com';
    default: return '';
  }
}
</script>

<template>
  <div>
    <div v-for="(entry, index) in model" :key="index" style="margin-bottom: 8px">
      <NSpace>
        <NSelect
          :value="entry.type"
          :options="typeOptions"
          style="width: 120px"
          @update:value="(v: string) => updateEntry(index, 'type', v)"
        />
        <NInput
          :value="entry.value"
          :placeholder="getPlaceholder(entry.type)"
          style="width: 340px"
          @update:value="(v: string) => updateEntry(index, 'value', v)"
        />
        <NButton quaternary type="error" @click="removeEntry(index)">
          <template #icon><NIcon><TrashOutline /></NIcon></template>
        </NButton>
      </NSpace>
    </div>
    <NButton dashed @click="addEntry" style="width: 100%">
      <template #icon><NIcon><AddOutline /></NIcon></template>
      Add SAN Entry
    </NButton>
  </div>
</template>
