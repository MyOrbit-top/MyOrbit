<template>
  <div>
    <!-- Tabs -->
    <div v-if="tabs.length > 0" class="flex gap-1 mb-4 overflow-x-auto custom-scrollbar pb-1">
      <template v-for="(tab, index) in tabs" :key="tab.id">
        <div class="relative group/tab">
          <button
            class="orbit-tab whitespace-nowrap text-xs"
            :class="{ active: activeTab === index }"
            @click="switchTab(index)"
          >
            {{ tab.title }}
          </button>
          <!-- Tab actions in edit mode -->
          <div v-if="store.canEdit()" class="absolute -top-1 -right-1 hidden group-hover/tab:flex gap-0.5">
            <button
              class="w-3.5 h-3.5 rounded-full bg-orbit flex items-center justify-center"
              @click.stop="store.openDrawer('EditRSSTab', { widgetId: widget.id, tab, tabIndex: index })"
              title="Edit Tab"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button
              class="w-3.5 h-3.5 rounded-full bg-flare/80 flex items-center justify-center"
              @click.stop="deleteTab(tab.id)"
              title="Delete Tab"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      </template>
      <button
        v-if="store.canEdit()"
        class="orbit-tab text-xs flex-shrink-0"
        :style="{ color: 'var(--text-muted)' }"
        @click="store.openDrawer('AddRSSTab', { widgetId: widget.id })"
        title="Add Tab"
      >
        + Add
      </button>
    </div>

    <!-- Feed Content -->
    <div v-if="currentTab" class="space-y-2">
      <!-- Private Feed Badges (when unlocked) -->
      <div v-if="store.pinState.unlocked && currentTab.feeds.some(f => f.private)" class="flex flex-wrap gap-1 mb-2">
        <span
          v-for="feed in currentTab.feeds.filter(f => f.private)"
          :key="feed.id"
          class="orbit-badge !text-[10px] !px-1.5 !py-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-0.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          {{ feed.title }}
        </span>
      </div>

      <!-- Feed Items -->
      <template v-if="currentFeedItems.length > 0">
        <a
          v-for="(item, idx) in currentFeedItems"
          :key="idx"
          :href="item.link"
          target="_blank"
          class="block p-3 rounded-xl hover:bg-white/5 transition-all duration-200 group"
        >
          <p class="text-sm font-medium group-hover:text-orbit transition-colors line-clamp-2" :style="{ color: 'var(--text-primary)' }">
            {{ item.title }}
          </p>
          <p v-if="item.description" class="text-xs mt-1 line-clamp-2" :style="{ color: 'var(--text-secondary)' }">
            {{ item.description }}
          </p>
          <p class="text-[10px] mt-1.5" :style="{ color: 'var(--text-muted)' }">
            {{ formatRelativeTime(item.pubDate || '') }}
          </p>
        </a>
      </template>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="skeleton h-16 w-full"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="currentFeedItems.length === 0" class="text-center py-8">
        <p class="text-sm" :style="{ color: 'var(--text-muted)' }">No items yet</p>
        <button
          class="mt-2 text-xs text-orbit hover:text-orbit-light transition-colors"
          @click="refreshFeeds"
        >
          Refresh feeds
        </button>
      </div>

      <!-- Refresh Button -->
      <button
        v-if="currentFeedItems.length > 0"
        class="mt-2 w-full py-2 rounded-xl border border-dashed text-xs transition-all duration-200"
        :style="{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }"
        @click="refreshFeeds"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-1"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        Refresh
      </button>
    </div>

    <!-- No Tabs -->
    <div v-else class="text-center py-8">
      <p class="text-sm" :style="{ color: 'var(--text-muted)' }">No RSS feeds configured</p>
      <button v-if="store.canEdit()" class="mt-2 text-xs text-orbit hover:text-orbit-light transition-colors" @click="store.openDrawer('AddRSSTab', { widgetId: widget.id })">
        Add RSS tab
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from '@/runtime/store'
import { fetchRSSFeed, formatRelativeTime } from '@/utils/rss'
import type { Widget, RSSWidgetData, RSSItem } from '@/schemas/types'

const props = defineProps<{
  widget: Widget
}>()

const store = useStore()
const loading = ref(false)
const feedItems = ref<Map<number, RSSItem[]>>(new Map())

const tabs = computed(() => {
  try {
    const data = props.widget.data as RSSWidgetData
    return data.tabs || []
  } catch {
    return []
  }
})

const activeTab = computed(() => {
  try {
    const data = props.widget.data as RSSWidgetData
    return data.activeTab || 0
  } catch {
    return 0
  }
})

const currentTab = computed(() => {
  return tabs.value[activeTab.value] || null
})

const currentFeedItems = computed(() => {
  if (!currentTab.value) return []
  const items: RSSItem[] = []
  currentTab.value.feeds.forEach((feed) => {
    // Skip private feeds when PIN is locked
    if (feed.private && !store.pinState.unlocked && store.isPinEnabled()) return
    const cached = feedItems.value.get(feed.id)
    if (cached) {
      items.push(...cached)
    }
  })
  return items.slice(0, 15)
})

function switchTab(index: number) {
  store.setActiveTab(props.widget.id, index)
}

function deleteTab(tabId: number) {
  if (confirm('Delete this tab?')) {
    store.removeRSSTab(props.widget.id, tabId)
    store.showToast('Tab deleted', 'success')
  }
}

async function refreshFeeds() {
  if (!currentTab.value || loading.value) return
  loading.value = true

  const promises = currentTab.value.feeds.map(async (feed) => {
    try {
      const items = await fetchRSSFeed(feed.url || '')
      feedItems.value.set(feed.id, items)
    } catch {
      console.warn(`Failed to fetch feed: ${feed.title}`)
    }
  })

  await Promise.allSettled(promises)
  loading.value = false
}

onMounted(() => {
  refreshFeeds()
})

watch(activeTab, () => {
  if (currentTab.value) {
    const hasItems = currentTab.value.feeds.some((feed) => feedItems.value.has(feed.id))
    if (!hasItems) {
      refreshFeeds()
    }
  }
})
</script>
