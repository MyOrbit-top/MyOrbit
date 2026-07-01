<template>
  <Teleport to="body">
    <!-- Overlay -->
    <div
      v-if="store.drawerOpen.value"
      class="drawer-overlay"
      @click="store.closeDrawer()"
    ></div>

    <!-- Panel -->
    <div
      v-if="store.drawerOpen.value"
      class="drawer-panel custom-scrollbar overflow-y-auto"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b" :style="{ borderColor: 'var(--border-color)' }">
        <h2 class="text-lg font-semibold" :style="{ color: 'var(--text-primary)' }">{{ drawerTitle }}</h2>
        <button class="p-2 rounded-lg hover:bg-white/5 transition-colors" @click="store.closeDrawer()">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ color: 'var(--text-secondary)' }"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <component :is="currentComponent" v-bind="store.drawerProps.value || {}" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useStore } from '@/runtime/store'

const store = useStore()

const AddWidgetForm = defineAsyncComponent(() => import('./AddWidgetForm.vue'))
const EditWidgetForm = defineAsyncComponent(() => import('./EditWidgetForm.vue'))
const AddBookmarkForm = defineAsyncComponent(() => import('./AddBookmarkForm.vue'))
const EditBookmarkForm = defineAsyncComponent(() => import('./EditBookmarkForm.vue'))
const AddRSSTabForm = defineAsyncComponent(() => import('./AddRSSTabForm.vue'))
const EditRSSTabForm = defineAsyncComponent(() => import('./EditRSSTabForm.vue'))
const SearchEngineManager = defineAsyncComponent(() => import('./SearchEngineManager.vue'))

const componentMap: Record<string, any> = {
  AddWidget: AddWidgetForm,
  EditWidget: EditWidgetForm,
  AddBookmark: AddBookmarkForm,
  EditBookmark: EditBookmarkForm,
  AddRSSTab: AddRSSTabForm,
  EditRSSTab: EditRSSTabForm,
  SearchEngineManager,
}

const currentComponent = computed(() => {
  return componentMap[store.drawerComponent.value || ''] || null
})

const drawerTitle = computed(() => {
  switch (store.drawerComponent.value) {
    case 'AddWidget': return 'Add Widget'
    case 'EditWidget': return 'Edit Widget'
    case 'AddBookmark': return 'Add Bookmark'
    case 'EditBookmark': return 'Edit Bookmark'
    case 'AddRSSTab': return 'Add RSS Tab'
    case 'EditRSSTab': return 'Edit RSS Tab'
    case 'SearchEngineManager': return 'Manage Search Engines'
    default: return 'MyOrbit'
  }
})
</script>
