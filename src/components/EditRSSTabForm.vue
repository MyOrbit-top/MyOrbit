<template>
  <div class="space-y-5">
    <!-- Tab Title -->
    <div>
      <label class="block text-sm font-medium mb-2" :style="{ color: 'var(--text-primary)' }">Tab Title</label>
      <input v-model="form.title" type="text" class="glass-input" placeholder="Tab title" />
    </div>

    <!-- Feed URLs -->
    <div>
      <label class="block text-sm font-medium mb-2" :style="{ color: 'var(--text-primary)' }">Feed URLs</label>
      <div class="space-y-2">
        <div v-for="(feed, idx) in form.feeds" :key="idx" class="flex gap-2 items-center">
          <input
            v-model="feed.url"
            type="text"
            class="glass-input flex-1"
            placeholder="https://example.com/rss"
          />
          <button
            class="w-7 h-4 rounded-full transition-colors duration-200 flex-shrink-0"
            :class="feed.private ? 'bg-orbit' : 'bg-white/10'"
            @click="feed.private = !feed.private"
            :title="feed.private ? 'Private (requires PIN)' : 'Public'"
          >
            <div
              class="w-2.5 h-2.5 rounded-full bg-white transition-transform duration-200"
              :class="feed.private ? 'translate-x-4' : 'translate-x-0.5'"
            ></div>
          </button>
          <button
            class="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            @click="removeFeed(idx)"
            title="Remove feed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ color: 'var(--text-muted)' }"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <button
        class="mt-2 text-xs transition-colors"
        :style="{ color: 'var(--text-muted)' }"
        @click="addFeed"
      >
        + Add another feed
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
import type { RSSTab } from '@/schemas/types'

const store = useStore()
const props = defineProps<{
  widgetId: number
  tab: RSSTab
  tabIndex: number
}>()

const form = reactive({
  title: '',
  feeds: [] as { url: string; private: boolean }[],
})

onMounted(() => {
  form.title = props.tab.title
  form.feeds = props.tab.feeds.map((f) => ({ url: f.url, private: f.private || false }))
})

function addFeed() {
  form.feeds.push({ url: '', private: false })
}

function removeFeed(index: number) {
  form.feeds.splice(index, 1)
}

function handleSubmit() {
  if (!form.title.trim()) {
    store.showToast('Please enter a tab title', 'error')
    return
  }

  store.updateRSSTab(props.widgetId, props.tab.id, {
    title: form.title.trim(),
    feeds: form.feeds.filter((f) => f.url.trim()).map((f, i) => ({
      id: props.tab.feeds[i]?.id || store.getNextId(),
      title: f.url.trim(),
      url: f.url.trim(),
      private: f.private || undefined,
    })),
  })

  store.showToast('Tab updated', 'success')
  store.closeDrawer()
}
</script>
