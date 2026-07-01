<template>
  <div class="glass-card overflow-hidden" :style="{ maxHeight: store.site.layout.maxWidgetHeight + 'px' }">
    <!-- Card Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b" :style="{ borderColor: 'var(--border-color)' }">
      <div class="flex items-center gap-2.5 min-w-0">
        <!-- Widget Icon - System assigned only -->
        <div class="w-8 h-8 rounded-lg bg-orbit/10 flex items-center justify-center flex-shrink-0">
          <svg v-if="widget.type === 'bookmark'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D5BFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          <svg v-else-if="widget.type === 'rss'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D5BFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
        </div>
        <h3 class="text-sm font-semibold truncate" :style="{ color: 'var(--text-primary)' }">{{ widget.title }}</h3>
        <!-- Private Badge -->
        <span v-if="widget.private" class="orbit-badge !text-[10px] !px-1.5 !py-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-0.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Private
        </span>
      </div>

      <!-- Actions - Only visible in edit mode -->
      <div v-if="store.canEdit()" class="flex items-center gap-1">
        <button class="p-1.5 rounded-lg hover:bg-white/5 transition-colors" @click="store.openDrawer('EditWidget', { widget })" title="Edit">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-stardust-dark/40"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="p-1.5 rounded-lg hover:bg-white/5 transition-colors" @click="deleteWidget" title="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-stardust-dark/40"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>

    <!-- Card Body -->
    <div class="p-4 custom-scrollbar overflow-y-auto" :style="{ maxHeight: (store.site.layout.maxWidgetHeight - 60) + 'px' }">
      <!-- Bookmark Widget -->
      <BookmarkWidget v-if="widget.type === 'bookmark'" :widget="widget" />

      <!-- RSS Widget -->
      <RSSWidget v-else-if="widget.type === 'rss'" :widget="widget" />

      <!-- Fallback -->
      <div v-else class="text-sm text-center py-8" :style="{ color: 'var(--text-muted)' }">
        Unknown widget type
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStore } from '@/runtime/store'
import type { Widget } from '@/schemas/types'
import BookmarkWidget from '@/widgets/BookmarkWidget.vue'
import RSSWidget from '@/widgets/RSSWidget.vue'

const props = defineProps<{
  widget: Widget
}>()

const store = useStore()

function deleteWidget() {
  if (confirm(`Delete "${props.widget.title}"?`)) {
    store.removeWidget(props.widget.id)
    store.showToast('Widget deleted', 'success')
  }
}
</script>
