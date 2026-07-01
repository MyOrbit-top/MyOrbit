<template>
  <Teleport to="body">
    <div v-if="store.showPinModal.value" class="pin-overlay" @click.self="closeModal">
      <div class="pin-modal animate-fade-in">
        <!-- Lock Icon -->
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orbit/10 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2D5BFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>

        <h3 class="text-lg font-semibold mb-2" :style="{ color: 'var(--text-primary)' }">Enter PIN</h3>
        <p class="text-sm mb-6" :style="{ color: 'var(--text-muted)' }">Enter your PIN to access private widgets</p>

        <!-- PIN Input -->
        <input
          v-model="pin"
          type="password"
          maxlength="10"
          class="glass-input text-center text-lg tracking-widest mb-4"
          placeholder="****"
          @keyup.enter="handleUnlock"
          autofocus
        />

        <!-- Error -->
        <p v-if="error" class="text-xs text-flare mb-4">{{ error }}</p>

        <!-- Buttons -->
        <button class="glass-btn-primary w-full !py-3 mb-2" @click="handleUnlock">
          Unlock
        </button>
        <button class="glass-btn w-full !py-2" @click="closeModal">
          Continue without unlocking
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from '@/runtime/store'

const store = useStore()
const pin = ref('')
const error = ref('')

async function handleUnlock() {
  error.value = ''
  if (!pin.value) {
    error.value = 'Please enter a PIN'
    return
  }
  const success = await store.unlockPin(pin.value)
  if (success) {
    store.showToast('Unlocked successfully', 'success')
    closeModal()
  } else {
    error.value = 'Incorrect PIN. Try again.'
    pin.value = ''
  }
}

function closeModal() {
  store.showPinModal.value = false
  pin.value = ''
  error.value = ''
}
</script>
