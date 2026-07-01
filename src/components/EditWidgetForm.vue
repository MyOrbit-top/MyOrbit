<template>
  <div class="space-y-5">
    <!-- Title -->
    <div>
      <label class="block text-sm font-medium mb-2" :style="{ color: 'var(--text-primary)' }">Title</label>
      <input v-model="form.title" type="text" class="glass-input" placeholder="Widget title" />
    </div>

    <!-- Private Toggle -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium" :style="{ color: 'var(--text-primary)' }">Private Widget</p>
        <p class="text-xs mt-0.5" :style="{ color: 'var(--text-muted)' }">Requires PIN to view</p>
      </div>
      <button
        class="w-12 h-6 rounded-full transition-colors duration-200"
        :class="form.private ? 'bg-orbit' : 'bg-white/10'"
        @click="form.private = !form.private"
      >
        <div
          class="w-4 h-4 rounded-full bg-white transition-transform duration-200"
          :class="form.private ? 'translate-x-7' : 'translate-x-1'"
        ></div>
      </button>
    </div>

    <!-- Submit -->
    <button class="glass-btn-primary w-full !py-3" @click="handleSubmit">
      Save Changes
    </button>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useStore } from '@/runtime/store'
import type { Widget } from '@/schemas/types'

const store = useStore()
const props = defineProps<{
  widget: Widget
}>()

const form = reactive({
  title: '',
  private: false,
})

onMounted(() => {
  form.title = props.widget.title
  form.private = props.widget.private
})

function handleSubmit() {
  if (!form.title.trim()) {
    store.showToast('Please enter a title', 'error')
    return
  }

  store.updateWidget(props.widget.id, {
    title: form.title.trim(),
    private: form.private,
  })

  store.showToast('Widget updated', 'success')
  store.closeDrawer()
}
</script>
