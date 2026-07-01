<template>
  <div :style="{ minHeight: '100vh' }">
    <!-- Background Layer -->
    <!-- Dark Aurora -->
    <div v-if="store.theme.value === 'dark'" class="aurora-bg">
      <div class="aurora-spot-1"></div>
      <div class="aurora-spot-2"></div>
      <div class="aurora-noise"></div>
    </div>
    <!-- Light Gradient -->
    <div v-else class="light-bg">
      <div class="light-spot-1"></div>
      <div class="light-noise"></div>
    </div>

    <!-- Header -->
    <HeaderBar />

    <!-- Search Bar -->
    <SearchBar />

    <!-- Main Content - CSS Columns Masonry Layout -->
    <main class="w-full px-6 pb-24">
      <div class="max-w-[1600px] mx-auto">
        <div
          class="masonry-layout"
          ref="masonryRef"
        >
          <div
            v-for="widget in store.visibleWidgets.value"
            :key="widget.id"
            class="masonry-item"
            :class="{ dragging: dragState.isDragging && dragState.draggedWidget?.id === widget.id }"
            :draggable="store.canEdit()"
            @dragstart="onDragStart($event, widget)"
            @dragover.prevent="onDragOver($event, widget)"
            @drop.prevent="onDrop($event, widget)"
            @dragend="onDragEnd"
          >
            <!-- Widget Card -->
            <WidgetCard :widget="widget" />
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="store.visibleWidgets.value.length === 0"
          class="flex flex-col items-center justify-center py-24 text-center"
        >
          <div class="mb-6 opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" :style="{ color: 'var(--text-primary)' }"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          </div>
          <h3 class="text-xl font-medium mb-2" :style="{ color: 'var(--text-secondary)' }">{{ i18n.t('widget.noWidgets') }}</h3>
          <p class="mb-6" :style="{ color: 'var(--text-muted)' }">{{ i18n.t('widget.noWidgetsHint') }}</p>
          <button class="glass-btn-primary" @click="store.openDrawer('AddWidget')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ i18n.t('widget.add') }}
          </button>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="orbit-footer fixed bottom-0 left-0 right-0 py-3 text-center text-xs z-30" :style="{ color: 'var(--text-muted)' }">
      <div class="max-w-[1600px] mx-auto px-6">
        {{ store.site.footer }}
      </div>
    </footer>

    <!-- Drawer -->
    <DrawerPanel />

    <!-- PIN Modal -->
    <PINModal />

    <!-- Toast -->
    <ToastNotification />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useStore } from '@/runtime/store'
import { useI18n } from '@/composables/useI18n'
import type { Widget } from '@/schemas/types'
import HeaderBar from '@/components/HeaderBar.vue'
import SearchBar from '@/components/SearchBar.vue'
import WidgetCard from '@/components/WidgetCard.vue'
import DrawerPanel from '@/components/DrawerPanel.vue'
import PINModal from '@/components/PINModal.vue'
import ToastNotification from '@/components/ToastNotification.vue'

const store = useStore()
const i18n = useI18n()
const masonryRef = ref<HTMLElement | null>(null)

// Drag & Drop State
const dragState = ref({
  isDragging: false,
  draggedWidget: null as Widget | null,
  targetWidget: null as Widget | null,
})

function onDragStart(event: DragEvent, widget: Widget) {
  if (!store.canEdit()) return
  dragState.value.isDragging = true
  dragState.value.draggedWidget = widget
  event.dataTransfer?.setData('text/plain', String(widget.id))
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onDragOver(event: DragEvent, widget: Widget) {
  if (!store.canEdit()) return
  if (!dragState.value.isDragging || dragState.value.draggedWidget?.id === widget.id) return
  dragState.value.targetWidget = widget
  const target = event.currentTarget as HTMLElement
  target.classList.add('drag-over')
}

function onDrop(event: DragEvent, widget: Widget) {
  if (!store.canEdit()) return
  const target = event.currentTarget as HTMLElement
  target.classList.remove('drag-over')

  if (!dragState.value.draggedWidget || dragState.value.draggedWidget.id === widget.id) return

  const draggedId = dragState.value.draggedWidget.id
  const targetId = widget.id

  // Simple reorder (no folder merging at root level)
  const fromIdx = store.userData.widgets.findIndex((w: Widget) => w.id === draggedId)
  const toIdx = store.userData.widgets.findIndex((w: Widget) => w.id === targetId)
  if (fromIdx !== -1 && toIdx !== -1) {
    store.reorderWidgets(fromIdx, toIdx)
  }

  dragState.value.isDragging = false
  dragState.value.draggedWidget = null
  dragState.value.targetWidget = null
}

function onDragEnd() {
  dragState.value.isDragging = false
  dragState.value.draggedWidget = null
  dragState.value.targetWidget = null
  document.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'))
}

onMounted(() => {
  store.init()
})
</script>
