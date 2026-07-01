<template>
  <div class="space-y-5">
    <!-- Title -->
    <div>
      <label class="block text-sm font-medium mb-2" :style="{ color: 'var(--text-primary)' }">Title</label>
      <input v-model="form.title" type="text" class="glass-input" placeholder="Bookmark title" />
    </div>

    <!-- URL -->
    <div>
      <label class="block text-sm font-medium mb-2" :style="{ color: 'var(--text-primary)' }">URL</label>
      <input v-model="form.url" type="url" class="glass-input" placeholder="https://example.com" />
    </div>

    <!-- Description -->
    <div>
      <label class="block text-sm font-medium mb-2" :style="{ color: 'var(--text-primary)' }">Description (optional)</label>
      <textarea
        v-model="form.description"
        class="glass-input !min-h-[80px] resize-none"
        placeholder="Brief description of this bookmark"
      ></textarea>
      <p class="text-xs mt-1" :style="{ color: 'var(--text-muted)' }">
        MyOrbit Cloud can auto-fetch meta description in the future
      </p>
    </div>

    <!-- Icon URL -->
    <div>
      <label class="block text-sm font-medium mb-2" :style="{ color: 'var(--text-primary)' }">Icon URL (optional)</label>
      <input v-model="form.icon" type="url" class="glass-input" placeholder="https://example.com/favicon.ico" />
      <p class="text-xs mt-1" :style="{ color: 'var(--text-muted)' }">Leave empty to auto-detect from favicon.im</p>
    </div>

    <!-- Keywords -->
    <div>
      <label class="block text-sm font-medium mb-2" :style="{ color: 'var(--text-primary)' }">Keywords (comma separated)</label>
      <input v-model="form.keywordsStr" type="text" class="glass-input" placeholder="keyword1, keyword2" />
    </div>

    <!-- Private Toggle -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium" :style="{ color: 'var(--text-primary)' }">Private Bookmark</p>
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
      Add Bookmark
    </button>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useStore } from '@/runtime/store'

const store = useStore()
const props = defineProps<{
  widgetId: number
  parentFolderId: number | null
}>()

const form = reactive({
  title: '',
  url: '',
  description: '',
  icon: '',
  keywordsStr: '',
  private: false,
})

function handleSubmit() {
  if (!form.title.trim() || !form.url.trim()) {
    store.showToast('Title and URL are required', 'error')
    return
  }

  const keywords = form.keywordsStr
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)

  store.addTreeNode(props.widgetId, props.parentFolderId, {
    type: 'bookmark',
    title: form.title.trim(),
    url: form.url.trim(),
    description: form.description.trim() || undefined,
    icon: form.icon.trim() || undefined,
    keywords: keywords.length > 0 ? keywords : undefined,
    private: form.private || undefined,
  })

  store.showToast('Bookmark added', 'success')
  store.closeDrawer()
}
</script>
