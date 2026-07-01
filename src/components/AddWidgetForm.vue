<template>
  <div class="space-y-5">
    <!-- Widget Type -->
    <div>
      <label class="block text-sm font-medium text-stardust mb-2">Widget Type</label>
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="type in widgetTypes"
          :key="type.value"
          class="p-4 rounded-xl text-center transition-all duration-200"
          :class="form.type === type.value ? 'bg-orbit/20 border border-orbit/40' : 'bg-white/5 border border-white/10 hover:border-white/20'"
          @click="form.type = type.value"
        >
          <div class="w-8 h-8 mx-auto mb-2 rounded-lg bg-orbit/10 flex items-center justify-center">
            <svg v-if="type.value === 'bookmark'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D5BFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D5BFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
          </div>
          <p class="text-xs font-medium text-stardust">{{ type.label }}</p>
        </button>
      </div>
    </div>

    <!-- Title -->
    <div>
      <label class="block text-sm font-medium text-stardust mb-2">Title</label>
      <input v-model="form.title" type="text" class="glass-input" placeholder="Widget title" />
    </div>

    <!-- Private Toggle -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-stardust">Private Widget</p>
        <p class="text-xs text-stardust-dark/40 mt-0.5">Requires PIN to view</p>
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
      Create Widget
    </button>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useStore } from '@/runtime/store'
import type { WidgetType } from '@/schemas/types'

const store = useStore()

const widgetTypes = [
  { value: 'bookmark' as WidgetType, label: 'Bookmark' },
  { value: 'rss' as WidgetType, label: 'RSS Feed' },
]

const form = reactive({
  type: 'bookmark' as WidgetType,
  title: '',
  private: false,
})

function handleSubmit() {
  if (!form.title.trim()) {
    store.showToast('Please enter a title', 'error')
    return
  }

  const widget: any = {
    type: form.type,
    title: form.title.trim(),
    icon: undefined,
    order: store.userData.widgets.length,
    private: form.private,
    data: form.type === 'bookmark'
      ? { bookmarks: [] }
      : { tabs: [], activeTab: 0 },
  }

  store.addWidget(widget)
  store.showToast('Widget created', 'success')
  store.closeDrawer()
}
</script>
