<template>
  <div
    class="bookmark-widget"
    :class="{
      'drag-over-root': isRootOver,
      'drag-root-above': rootDropPos === 'above',
      'drag-root-below': rootDropPos === 'below',
      'drag-root-into': rootDropPos === 'into'
    }"
    @dragover.prevent="onRootDragOver"
    @dragleave="onRootDragLeave"
    @drop.prevent="onRootDrop"
  >
    <!-- Widget Collapse Toggle -->
    <div v-if="store.canEdit() && tree.length > 0" class="flex items-center gap-2 px-3 py-1.5 mb-1">
      <button
        class="flex items-center gap-1 text-xs transition-colors"
        :style="{ color: 'var(--text-muted)' }"
        @click="store.toggleWidgetCollapsed(widget.id)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12" height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          :class="{ 'rotate-180': !isCollapsed }"
          class="transition-transform"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        {{ isCollapsed ? 'Expand all' : 'Collapse all' }}
      </button>
    </div>

    <!-- Tree -->
    <div v-if="!isCollapsed" class="space-y-0.5">
      <TreeNodeItem
        v-for="node in tree"
        :key="node.id"
        :node="node"
        :widget-id="widget.id"
        :depth="0"
      />
    </div>

    <!-- Empty State -->
    <div v-if="tree.length === 0" class="text-center py-8">
      <p class="text-sm" :style="{ color: 'var(--text-muted)' }">No bookmarks yet</p>
      <button
        v-if="store.canEdit()"
        class="mt-2 text-xs transition-colors"
        :style="{ color: '#4d7aff' }"
        @click="store.openDrawer('AddBookmark', { widgetId: widget.id, parentFolderId: null })"
      >
        Add bookmark
      </button>
    </div>

    <!-- Add Button -->
    <button
      v-if="tree.length > 0 && store.canEdit()"
      class="mt-3 w-full py-2 rounded-xl border border-dashed text-xs transition-all duration-200"
      :style="{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }"
      @click="store.openDrawer('AddBookmark', { widgetId: widget.id, parentFolderId: null })"
    >
      + Add bookmark
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from '@/runtime/store'
import { useI18n } from '@/composables/useI18n'
import type { Widget, BookmarkWidgetData, TreeNode, BookmarkNode } from '@/schemas/types'
import TreeNodeItem from './TreeNodeItem.vue'

const props = defineProps<{
  widget: Widget
}>()

const store = useStore()
const i18n = useI18n()
const isRootOver = ref(false)
const rootDropPos = ref<'none' | 'above' | 'below' | 'into'>('none')

function isNodeVisible(node: TreeNode): boolean {
  if (node.type !== 'bookmark') return true
  const bm = node as BookmarkNode
  return !(!!bm.private && !store.pinState.unlocked && store.isPinEnabled())
}

const tree = computed(() => {
  try {
    const data = props.widget.data as BookmarkWidgetData
    const rawTree = data.tree || []
    // Filter out private nodes when PIN is locked
    return rawTree.filter(isNodeVisible)
  } catch {
    return []
  }
})

const isCollapsed = computed(() => {
  try {
    const data = props.widget.data as BookmarkWidgetData
    return data.collapsed || false
  } catch {
    return false
  }
})

// --- Root area drag & drop ---

function onRootDragOver(e: DragEvent) {
  if (!store.canEdit()) return
  const session = store.getDragSession()
  if (!session) {
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'
    return
  }
  const sourceW = store.userData.widgets.find(w => w.id === session.sourceWidgetId)
  if (!sourceW || sourceW.type !== 'bookmark') {
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'
    return
  }

  // Distinguish three drop positions
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const ratio = (e.clientY - rect.top) / rect.height
  const hasChildren = tree.value && tree.value.length > 0

  if (!hasChildren) {
    // Empty widget: show dashed border only
    rootDropPos.value = 'into'
  } else if (ratio < 0.25) {
    rootDropPos.value = 'above'   // Insert at root top
  } else if (ratio > 0.75) {
    rootDropPos.value = 'below'   // Insert at root bottom
  } else {
    rootDropPos.value = 'into'    // Dashed border, append to root end
  }

  isRootOver.value = true
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}

function onRootDragLeave(e: DragEvent) {
  const root = e.currentTarget as HTMLElement
  if (!root.contains(e.relatedTarget as Node)) {
    isRootOver.value = false
    rootDropPos.value = 'none'
  }
}

function onRootDrop(e: DragEvent) {
  isRootOver.value = false
  const session = store.getDragSession()
  if (!session || rootDropPos.value === 'none') {
    rootDropPos.value = 'none'
    return
  }

  const { sourceWidgetId, nodeId } = session
  const targetWidgetId = props.widget.id

  const targetWidget = store.userData.widgets.find(w => w.id === targetWidgetId)
  if (!targetWidget || targetWidget.type !== 'bookmark') {
    store.showToast(i18n.t('drag.onlyBookmarkWidget'), 'error')
    store.clearDragSession()
    rootDropPos.value = 'none'
    return
  }

  const targetTree = (targetWidget.data as BookmarkWidgetData).tree
  let targetIndex = targetTree.length

  if (rootDropPos.value === 'above') {
    targetIndex = 0
  } else if (rootDropPos.value === 'below') {
    targetIndex = targetTree.length
  } else {
    targetIndex = targetTree.length
  }

  const result = store.moveTreeNodeCrossWidget(
    sourceWidgetId, nodeId, targetWidgetId, null, targetIndex
  )

  if (!result.success) {
    store.showToast(i18n.t(`drag.${result.error}`), 'error')
  } else {
    store.showToast(i18n.t('drag.moveSuccess'), 'success')
  }

  rootDropPos.value = 'none'
  store.clearDragSession()
}
</script>

<style scoped>
/* Root drag states */
.bookmark-widget.drag-root-above {
  border-top: 3px solid var(--color-orbit, #2D5BFF);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  background: rgba(45, 91, 255, 0.04);
}

.bookmark-widget.drag-root-below {
  border-bottom: 3px solid var(--color-orbit, #2D5BFF);
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  background: rgba(45, 91, 255, 0.04);
}

.bookmark-widget.drag-root-into {
  border: 3px dashed var(--color-orbit, #2D5BFF);
  background: rgba(45, 91, 255, 0.06);
  border-radius: 12px;
}

/* Keep existing drag-over-root as fallback */
.bookmark-widget.drag-over-root {
  border: 2px dashed var(--color-orbit, #2D5BFF);
  background: rgba(45, 91, 255, 0.04);
  border-radius: 12px;
  transition: all 0.2s ease;
}
</style>
