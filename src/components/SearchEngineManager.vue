<template>
  <div class="search-engine-manager">
    <!-- 引擎列表 -->
    <div class="space-y-2" ref="listRef">
      <div
        v-for="(engine, index) in engines"
        :key="engine.id"
        class="engine-item"
        :class="{ 'is-system': engine._isSystem, 'dragging': dragIndex === index }"
        :style="{ borderColor: 'var(--border-color)' }"
        draggable="true"
        @dragstart="onDragStart($event, index)"
        @dragover.prevent="onDragOver($event, index)"
        @dragend="onDragEnd"
      >
        <div class="engine-info">
          <!-- 拖拽手柄 -->
          <span class="drag-handle" :title="i18n.t('searchEngine.dragHint')">⠿</span>
          <!-- 图标 -->
          <img
            v-if="engine.icon && engine.icon.startsWith('http')"
            :src="engine.icon"
            class="engine-icon"
            @error="onIconError"
          />
          <div class="engine-details">
            <span class="engine-name">{{ engine.name }}</span>
            <span class="engine-url">{{ engine.url.replace('%s', '...') }}</span>
          </div>
          <!-- 标识 -->
          <span v-if="engine._isSystem" class="badge-system">{{ i18n.t('searchEngine.badgeSystem') }}</span>
          <span v-else class="badge-custom">{{ i18n.t('searchEngine.badgeCustom') }}</span>
        </div>
        <div class="engine-actions">
          <button
            v-if="!engine._isSystem"
            class="action-btn"
            :title="i18n.t('searchEngine.edit')"
            @click="editEngine(index)"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            class="action-btn action-delete"
            :title="i18n.t('searchEngine.delete')"
            @click="confirmRemove(index)"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-if="engines.length === 0"
      class="empty-state"
    >
      {{ i18n.t('searchEngine.noEngines') }}
    </div>

    <!-- 操作按钮 -->
    <div class="action-bar">
      <button class="btn btn-primary" @click="showAddForm = true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {{ i18n.t('searchEngine.add') }}
      </button>
      <button class="btn btn-secondary" @click="resetToDefault">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="1 4 1 10 7 10"/>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
        </svg>
        {{ i18n.t('searchEngine.reset') }}
      </button>
    </div>

    <!-- 添加/编辑表单 -->
    <div v-if="showAddForm || editingIndex !== null" class="form-panel" :style="{ borderColor: 'var(--border-color)' }">
      <h3 class="form-title">
        {{ editingIndex !== null ? i18n.t('searchEngine.edit') : i18n.t('searchEngine.add') }}
      </h3>
      <div class="form-group">
        <label>{{ i18n.t('searchEngine.name') }}</label>
        <input
          v-model="formData.name"
          type="text"
          class="form-input"
          :placeholder="i18n.t('searchEngine.namePlaceholder')"
          :style="{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }"
        />
      </div>
      <div class="form-group">
        <label>{{ i18n.t('searchEngine.iconUrl') }}</label>
        <input
          v-model="formData.icon"
          type="text"
          class="form-input"
          :placeholder="i18n.t('searchEngine.iconPlaceholder')"
          :style="{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }"
        />
      </div>
      <div class="form-group">
        <label>{{ i18n.t('searchEngine.searchUrl') }} <span class="text-danger">*</span></label>
        <input
          v-model="formData.url"
          type="text"
          class="form-input"
          :placeholder="i18n.t('searchEngine.urlPlaceholder')"
          :style="{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }"
        />
        <p class="form-hint" v-html="i18n.t('searchEngine.searchUrlHint')"></p>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="saveEngine">{{ i18n.t('searchEngine.save') }}</button>
        <button class="btn btn-secondary" @click="cancelForm">{{ i18n.t('searchEngine.cancel') }}</button>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="deleteTarget !== null" class="confirm-overlay" @click.self="deleteTarget = null">
      <div class="confirm-dialog" :style="{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }">
        <p>
          {{ deleteTarget._isSystem ? i18n.t('searchEngine.hideConfirm') : i18n.t('searchEngine.deleteConfirm', { name: deleteTarget.name }) }}
        </p>
        <div class="confirm-actions">
          <button class="btn btn-danger" @click="doRemove">{{ i18n.t('searchEngine.confirm') }}</button>
          <button class="btn btn-secondary" @click="deleteTarget = null">{{ i18n.t('searchEngine.cancel') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from '@/runtime/store'
import { useI18n } from '@/composables/useI18n'
import type { SearchEngine, UserSearchEngineEntry } from '@/schemas/types'

const store = useStore()
const i18n = useI18n()

interface EngineItem extends SearchEngine {
  _isSystem: boolean
  _entry?: UserSearchEngineEntry
}

const showAddForm = ref(false)
const editingIndex = ref<number | null>(null)
const deleteTarget = ref<EngineItem | null>(null)
const dragIndex = ref<number | null>(null)
const listRef = ref<HTMLElement | null>(null)

const formData = ref({
  name: '',
  icon: '',
  url: '',
})

// 获取完整引擎列表（带内置/自定义标识）
const engines = computed<EngineItem[]>(() => {
  const allEngines = store.getSearchEngines()
  const userEngines = (store.userData as any).search?.searchEngines as UserSearchEngineEntry[] | undefined

  return allEngines.map((engine) => {
    const userEntry = userEngines?.find((e) => e.id === engine.id)
    // 如果 user.json 中有完整信息（name/url），说明是自定义引擎
    const isSystem = !userEntry || !userEntry.url
    return {
      ...engine,
      _isSystem: isSystem,
      _entry: userEntry,
    }
  })
})

// --- 拖拽排序 ---
function onDragStart(e: DragEvent, index: number) {
  dragIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }
}

function onDragOver(e: DragEvent, index: number) {
  if (dragIndex.value === null || dragIndex.value === index) return
  // 重新排序
  const from = dragIndex.value
  const to = index
  store.reorderSearchEngines(from, to)
  dragIndex.value = to
}

function onDragEnd() {
  dragIndex.value = null
}

function editEngine(index: number) {
  const engine = engines.value[index]
  editingIndex.value = index
  formData.value = {
    name: engine.name,
    icon: engine.icon || '',
    url: engine.url,
  }
  showAddForm.value = true
}

function confirmRemove(index: number) {
  deleteTarget.value = engines.value[index]
}

function doRemove() {
  if (!deleteTarget.value) return
  store.removeSearchEngine(deleteTarget.value.id)
  deleteTarget.value = null
  store.showToast(i18n.t('searchEngine.removed'), 'success')
}

function saveEngine() {
  if (!formData.value.name || !formData.value.url) {
    store.showToast(i18n.t('searchEngine.nameUrlRequired'), 'error')
    return
  }
  if (!formData.value.url.includes('%s')) {
    store.showToast(i18n.t('searchEngine.urlMustContain'), 'error')
    return
  }

  if (editingIndex.value !== null) {
    // 编辑已有引擎
    const engine = engines.value[editingIndex.value]
    store.updateSearchEngine(engine.id, {
      name: formData.value.name,
      icon: formData.value.icon || undefined,
      url: formData.value.url,
    })
    store.showToast(i18n.t('searchEngine.updated'), 'success')
  } else {
    // 添加新引擎
    const id = 'custom_' + Date.now()
    store.addSearchEngine({
      id,
      name: formData.value.name,
      icon: formData.value.icon || '',
      url: formData.value.url,
    })
    store.showToast(i18n.t('searchEngine.added'), 'success')
  }

  cancelForm()
}

function cancelForm() {
  showAddForm.value = false
  editingIndex.value = null
  formData.value = { name: '', icon: '', url: '' }
}

function resetToDefault() {
  store.resetSearchEngines()
  store.showToast(i18n.t('searchEngine.resetSuccess'), 'success')
}

function onIconError(e: Event) {
  (e.target as HTMLImageElement).style.display = 'none'
}
</script>

<style scoped>
.search-engine-manager {
  padding: 0;
}

.engine-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid;
  border-radius: 8px;
  margin-bottom: 6px;
  transition: background 0.2s;
  color: var(--text-primary);
}

.engine-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.engine-item.dragging {
  opacity: 0.5;
  border-color: var(--accent-color);
}

.engine-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.drag-handle {
  cursor: grab;
  font-size: 18px;
  opacity: 0.4;
  user-select: none;
  line-height: 1;
  color: var(--text-secondary);
}

.drag-handle:active {
  cursor: grabbing;
}

.engine-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
}

.engine-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.engine-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
}

.engine-url {
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-secondary);
}

.badge-system,
.badge-custom {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.1);
  white-space: nowrap;
  flex-shrink: 0;
}

.badge-system {
  color: var(--text-secondary);
}

.badge-custom {
  color: var(--accent-color);
}

.engine-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 8px;
}

.action-btn {
  padding: 6px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
  color: var(--text-secondary);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.action-delete:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.empty-state {
  text-align: center;
  padding: 32px 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.action-bar {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-primary {
  background: var(--accent-color);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background: rgba(128, 128, 128, 0.15);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: rgba(128, 128, 128, 0.25);
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  opacity: 0.9;
}

.form-panel {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid;
  border-radius: 8px;
}

.form-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 14px;
  color: var(--text-primary);
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 12px;
  margin-bottom: 4px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--accent-color);
}

.form-hint {
  font-size: 11px;
  margin-top: 4px;
  color: var(--text-secondary);
}

.form-hint code {
  background: rgba(128, 128, 128, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.text-danger {
  color: #ef4444;
}

/* 确认弹窗 */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog {
  padding: 24px;
  border: 1px solid;
  border-radius: 12px;
  max-width: 360px;
  width: 90%;
}

.confirm-dialog p {
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.5;
  color: var(--text-primary);
}

.confirm-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
