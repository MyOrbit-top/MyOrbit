<template>
  <div
    class="tree-node"
    :class="{
      'is-dragging': isDragging,
      'drag-above': dropPos === 'above',
      'drag-below': dropPos === 'below',
      'drag-into': dropPos === 'into',
      'drag-merge': dropPos === 'merge'
    }"
    :draggable="store.canEdit()"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- Folder Node -->
    <template v-if="node.type === 'folder'">
      <div
        class="group flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-all duration-200 cursor-pointer node-content"
        :style="{ paddingLeft: `${12 + depth * 16}px` }"
        @click="store.toggleFolderCollapsed(widgetId, node.id)"
      >
        <!-- Expand/Collapse Icon -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12" height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="flex-shrink-0 transition-transform duration-200"
          :class="{ 'rotate-90': !node.collapsed }"
          :style="{ color: 'var(--text-muted)' }"
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>

        <!-- Folder Icon -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14" height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="flex-shrink-0"
          :style="{ color: '#4d7aff' }"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>

        <!-- Title -->
        <span class="text-sm font-medium truncate flex-1" :style="{ color: 'var(--text-primary)' }">
          {{ node.title }}
        </span>

        <!-- Merge Hint -->
        <span v-if="dropPos === 'merge'" class="merge-hint">{{ i18n.t('drag.mergeHint') }}</span>

        <!-- Actions -->
        <div v-if="store.canEdit()" class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            class="p-1 rounded-lg hover:bg-white/10 transition-colors"
            @click.stop="store.openDrawer('AddBookmark', { widgetId, parentFolderId: node.id })"
            title="Add bookmark to folder"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ color: 'var(--text-muted)' }"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button
            class="p-1 rounded-lg hover:bg-white/10 transition-colors"
            @click.stop="store.openDrawer('EditBookmark', { widgetId, node })"
            title="Edit folder"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ color: 'var(--text-muted)' }"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button
            class="p-1 rounded-lg hover:bg-white/10 transition-colors"
            @click.stop="deleteNode"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ color: 'var(--text-muted)' }"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>

      <!-- Children (if not collapsed) -->
      <div v-if="!node.collapsed" class="space-y-0.5">
        <TreeNodeItem
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :widget-id="widgetId"
          :depth="depth + 1"
        />
      </div>
    </template>

    <!-- Bookmark Node (leaf) -->
    <template v-else-if="node.type === 'bookmark'">
      <!-- Skip rendering if private and PIN is locked -->
      <template v-if="!isNodeHidden(node)">
        <div
          class="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all duration-200 cursor-pointer node-content"
          :style="{ paddingLeft: `${12 + depth * 16}px` }"
          :draggable="store.canEdit()"
          @click="openBookmark(node.url)"
          @mouseenter="showDesc = true"
          @mouseleave="showDesc = false"
        >
          <!-- Favicon -->
          <div class="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img
              :src="getFaviconUrl(node)"
              :alt="node.title"
              class="w-4 h-4"
              @error="onIconError"
            />
          </div>

          <!-- Title -->
          <div class="min-w-0 flex-1 relative">
            <p
              class="text-sm font-medium truncate transition-colors"
              :style="{ color: 'var(--text-primary)' }"
            >
              {{ node.title }}
            </p>
            <!-- Description tooltip on hover -->
            <div
              v-if="showDesc && node.description"
              class="absolute left-0 bottom-full mb-2 px-3 py-2 rounded-lg text-xs max-w-[250px] z-50 pointer-events-none"
              :style="{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }"
            >
              {{ node.description }}
            </div>
          </div>

          <!-- Private Badge -->
          <span v-if="node.private && store.pinState.unlocked" class="flex-shrink-0" title="Private bookmark">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4d7aff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </span>

          <!-- Merge Hint -->
          <span v-if="dropPos === 'merge'" class="merge-hint">{{ i18n.t('drag.mergeHint') }}</span>

          <!-- Actions -->
          <div v-if="store.canEdit()" class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              class="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              @click.stop="store.openDrawer('EditBookmark', { widgetId, node })"
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ color: 'var(--text-muted)' }"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button
              class="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              @click.stop="deleteNode"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ color: 'var(--text-muted)' }"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from '@/runtime/store'
import { useI18n } from '@/composables/useI18n'
import type { TreeNode, BookmarkNode, FolderNode, BookmarkWidgetData } from '@/schemas/types'

const props = defineProps<{
  node: TreeNode
  widgetId: number
  depth: number
}>()

const store = useStore()
const i18n = useI18n()
const showDesc = ref(false)
const isDragging = ref(false)
const dropPos = ref<'none' | 'above' | 'below' | 'into' | 'merge'>('none')

function getFaviconUrl(node: BookmarkNode): string {
  if (node.icon) return node.icon
  try {
    const domain = new URL(node.url).hostname
    return `https://favicon.im/${domain}`
  } catch {
    return ''
  }
}

function openBookmark(url: string) {
  window.open(url, '_blank')
}

function onIconError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

function deleteNode() {
  store.removeTreeNode(props.widgetId, props.node.id)
  store.showToast('Deleted', 'success')
}

function isNodeHidden(node: TreeNode): boolean {
  if (node.type !== 'bookmark') return false
  const bm = node as BookmarkNode
  return !!bm.private && !store.pinState.unlocked && store.isPinEnabled()
}

// --- Drag & Drop ---

function getAncestorIds(nodeId: number): Set<number> {
  const widget = store.userData.widgets.find(w => w.id === props.widgetId)
  if (!widget || widget.type !== 'bookmark') return new Set()
  const tree = (widget.data as BookmarkWidgetData).tree

  function findParent(nodes: TreeNode[], id: number): TreeNode | null {
    for (const n of nodes) {
      if (n.type === 'folder') {
        const folder = n as FolderNode
        if (folder.children.some(c => c.id === id)) return n
        const found = findParent(folder.children, id)
        if (found) return found
      }
    }
    return null
  }

  const ids = new Set<number>()
  let currentId = nodeId
  while (true) {
    const parent = findParent(tree, currentId)
    if (!parent) break
    ids.add(parent.id)
    currentId = parent.id
  }
  return ids
}

function onDragStart(e: DragEvent) {
  e.stopPropagation()
  if (!store.canEdit()) return
  isDragging.value = true
  store.setDragSession({
    sourceWidgetId: props.widgetId,
    nodeId: props.node.id,
    nodeType: props.node.type,
    ancestorIds: getAncestorIds(props.node.id)
  })
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  isDragging.value = false
  dropPos.value = 'none'
  store.clearDragSession()
}

function onDragOver(e: DragEvent) {
  e.stopPropagation()
  if (!store.canEdit()) {
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'
    return
  }
  const session = store.getDragSession()
  if (!session || session.nodeId === props.node.id) return

  // Prevent dropping on own ancestor (circular reference)
  if (session.sourceWidgetId === props.widgetId &&
      session.ancestorIds.has(props.node.id)) {
    dropPos.value = 'none'
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'
    return
  }

  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const ratio = (e.clientY - rect.top) / rect.height

  if (props.node.type === 'folder') {
    dropPos.value = 'into'
  } else if (session.nodeType === 'folder') {
    // Dragging a folder onto a bookmark: only allow above/below (no merge)
    dropPos.value = ratio < 0.4 ? 'above' : ratio > 0.6 ? 'below' : 'none'
  } else {
    // Dragging a bookmark onto a bookmark: allow merge in middle 40%
    dropPos.value = ratio < 0.3 ? 'above' : ratio > 0.7 ? 'below' : 'merge'
  }

  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = dropPos.value === 'none' ? 'none' : 'move'
  }
}

function onDragLeave() {
  dropPos.value = 'none'
}

function handleMoveResult(result: { success: boolean; error?: string }, successKey: string) {
  if (!result.success) {
    store.showToast(i18n.t(`drag.${result.error}`), 'error')
  } else {
    store.showToast(i18n.t(successKey), 'success')
  }
}

function onDrop(e: DragEvent) {
  e.stopPropagation()
  if (!store.canEdit()) return
  const session = store.getDragSession()
  if (!session || dropPos.value === 'none') {
    dropPos.value = 'none'
    return
  }

  const { sourceWidgetId, nodeId, nodeType } = session
  const targetWidgetId = props.widgetId
  const targetNodeId = props.node.id

  // Merge: two bookmarks dropped in middle zone
  if (dropPos.value === 'merge' && nodeType === 'bookmark' && props.node.type === 'bookmark') {
    const result = store.mergeBookmarks(sourceWidgetId, nodeId, targetWidgetId, targetNodeId)
    handleMoveResult(result, 'drag.mergeSuccess')
    dropPos.value = 'none'
    store.clearDragSession()
    return
  }

  // Drop into folder
  if (dropPos.value === 'into' && props.node.type === 'folder') {
    const result = store.moveTreeNodeCrossWidget(
      sourceWidgetId, nodeId, targetWidgetId, targetNodeId, -1
    )
    handleMoveResult(result, 'drag.moveSuccess')
    dropPos.value = 'none'
    store.clearDragSession()
    return
  }

  // Sort: above or below
  const targetWidget = store.userData.widgets.find(w => w.id === targetWidgetId)
  if (!targetWidget || targetWidget.type !== 'bookmark') {
    dropPos.value = 'none'
    store.clearDragSession()
    return
  }
  const targetTree = (targetWidget.data as BookmarkWidgetData).tree
  const pos = store.findInTree(targetTree, targetNodeId)
  if (!pos) {
    store.showToast(i18n.t('drag.nodeNotFound'), 'error')
    dropPos.value = 'none'
    store.clearDragSession()
    return
  }

  const parentId = pos.parent?.id ?? null
  const index = dropPos.value === 'above' ? pos.index : pos.index + 1
  const result = store.moveTreeNodeCrossWidget(
    sourceWidgetId, nodeId, targetWidgetId, parentId, index
  )
  handleMoveResult(result, 'drag.moveSuccess')

  dropPos.value = 'none'
  store.clearDragSession()
}
</script>

<style scoped>
.tree-node {
  position: relative;
}
.tree-node .node-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}
.tree-node.is-dragging { opacity: 0.4; }
.tree-node.drag-above > .node-content::before,
.tree-node.drag-below > .node-content::after {
  content: '';
  position: absolute;
  left: 8px; right: 8px;
  height: 2px;
  background: var(--color-orbit, #2D5BFF);
  border-radius: 2px;
  z-index: 1;
}
.tree-node.drag-above > .node-content::before { top: -2px; }
.tree-node.drag-below > .node-content::after { bottom: -2px; }
.tree-node.drag-into > .node-content,
.tree-node.drag-merge > .node-content {
  border: 2px solid var(--color-orbit, #2D5BFF);
  background: rgba(45, 91, 255, 0.08);
  border-radius: 6px;
}
.merge-hint {
  margin-left: auto;
  font-size: 12px;
  color: var(--color-orbit, #2D5BFF);
  animation: pulse-merge 1s ease-in-out infinite;
}
@keyframes pulse-merge {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
[data-theme="dark"] .tree-node.drag-into > .node-content,
[data-theme="dark"] .tree-node.drag-merge > .node-content {
  background: rgba(45, 91, 255, 0.15);
}
[data-theme="light"] .tree-node.drag-into > .node-content,
[data-theme="light"] .tree-node.drag-merge > .node-content {
  background: rgba(45, 91, 255, 0.06);
}
</style>
