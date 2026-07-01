<template>
  <Teleport to="body">
    <div
      v-if="store.toastMessage.value"
      class="toast"
      :class="{
        'toast-success': store.toastMessage.value.type === 'success',
        'toast-error': store.toastMessage.value.type === 'error',
      }"
    >
      <div class="flex items-center gap-2">
        <!-- Success Icon -->
        <svg v-if="store.toastMessage.value.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2DE2E6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <!-- Error Icon -->
        <svg v-else-if="store.toastMessage.value.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF3DFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <!-- Info Icon -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span>{{ store.toastMessage.value.text }}</span>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useStore } from '@/runtime/store'

const store = useStore()
</script>
