<template>
  <div class="search-wrapper">
    <div class="search-container">
      <!-- 搜索栏主体 -->
      <div class="search-bar">
        <!-- 搜索引擎切换按钮 -->
        <div class="engine-selector" ref="engineSelectorRef">
          <button
            class="engine-toggle"
            @click.stop="toggleEngineDropdown"
            :title="currentEngine?.name"
          >
            <img
              v-if="currentEngine?.icon && currentEngine.icon.startsWith('http')"
              :src="currentEngine.icon"
              class="engine-icon"
              @error="onIconError"
            />
            <span class="engine-name">{{ currentEngine?.name || 'Search' }}</span>
            <svg class="chevron" viewBox="0 0 24 24" width="12" height="12">
              <polyline points="6 9 12 15 18 9" stroke="currentColor" fill="none" stroke-width="2"/>
            </svg>
          </button>

          <!-- 下拉引擎列表 -->
          <div v-if="showEngineDropdown" class="engine-dropdown">
            <button
              v-for="engine in engines"
              :key="engine.id"
              class="engine-option"
              :class="{ active: engine.id === currentEngine?.id }"
              @click.stop="selectEngine(engine.id)"
            >
              <img
                v-if="engine.icon && engine.icon.startsWith('http')"
                :src="engine.icon"
                class="engine-icon"
                @error="onIconError"
              />
              <span>{{ engine.name }}</span>
            </button>
            <!-- 分隔线 -->
            <div class="dropdown-divider"></div>
            <!-- 管理入口 - 仅在可编辑时显示 -->
            <button v-if="store.canEdit()" class="engine-option manage-option" @click.stop="openManager">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span>{{ i18n.t('searchEngine.manage') }}</span>
            </button>
          </div>

        </div>

        <!-- 搜索输入框 -->
        <input
          ref="searchInputRef"
          v-model="query"
          type="text"
          class="search-input"
          :placeholder="i18n.t('searchEngine.searchPlaceholder')"
          @input="onInput"
          @keydown.enter.prevent="handleSearch"
          @keydown.escape="closeSuggestions"
          @focus="onFocus"
        />

        <!-- 搜索按钮 -->
        <button class="search-btn" @click="handleSearch">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </div>

      <!-- 搜索建议下拉（独立于搜索栏，防止被 overflow 裁剪） -->
      <div v-if="showSuggestions && filteredSuggestions.length > 0" class="suggestions-dropdown">
        <div
          v-for="(sug, idx) in filteredSuggestions"
          :key="idx"
          class="suggestion-item"
          :class="{ highlighted: idx === highlightedIndex }"
          @mousedown.prevent="goToSuggestion(sug)"
          @mouseenter="highlightedIndex = idx"
        >
          <div class="suggestion-icon">
            <img v-if="sug.icon?.startsWith('http')" :src="sug.icon" @error="onIconError" />
            <span v-else>📄</span>
          </div>
          <div class="suggestion-info">
            <div class="suggestion-title">{{ sug.title }}</div>
            <div class="suggestion-desc">{{ sug.description || sug.url }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useStore } from '@/runtime/store'
import { useI18n } from '@/composables/useI18n'
import type { SearchResult } from '@/runtime/store'

const store = useStore()
const i18n = useI18n()

const query = ref('')
const showEngineDropdown = ref(false)
const showSuggestions = ref(false)
const highlightedIndex = ref(-1)
const searchInputRef = ref<HTMLInputElement | null>(null)
const engineSelectorRef = ref<HTMLElement | null>(null)

const engines = computed(() => store.getSearchEngines())
const currentEngine = computed(() => store.currentSearchEngine.value)

const suggestions = ref<SearchResult[]>([])

const filteredSuggestions = computed(() => {
  return suggestions.value.slice(0, 10)
})

function toggleEngineDropdown() {
  showEngineDropdown.value = !showEngineDropdown.value
  // 如果下拉打开，关闭建议
  if (showEngineDropdown.value) {
    showSuggestions.value = false
  }
}

function selectEngine(id: string) {
  store.setSearchEngine(id)
  showEngineDropdown.value = false
  searchInputRef.value?.focus()
}

function openManager() {
  showEngineDropdown.value = false
  store.openDrawer('SearchEngineManager')
}

let debounceTimer: number | null = null
function onInput() {
  const q = query.value.trim()
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  if (q.length === 0) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }

  debounceTimer = window.setTimeout(() => {
    suggestions.value = store.getSuggestions(q)
    showSuggestions.value = suggestions.value.length > 0
    highlightedIndex.value = -1
  }, 200)
}

function handleSearch() {
  const q = query.value.trim()
  if (!q) return
  const engine = currentEngine.value
  if (engine && engine.url) {
    const url = engine.url.replace('%s', encodeURIComponent(q))
    window.open(url, '_blank')
    closeSuggestions()
  }
}

function goToSuggestion(sug: SearchResult) {
  if (sug.url && sug.url !== '#') {
    window.open(sug.url, '_blank')
  }
  closeSuggestions()
  query.value = ''
}

function closeSuggestions() {
  showSuggestions.value = false
  suggestions.value = []
  highlightedIndex.value = -1
}

function onFocus() {
  if (query.value.trim() && suggestions.value.length > 0) {
    showSuggestions.value = true
  }
}

function onIconError(e: Event) {
  (e.target as HTMLImageElement).style.display = 'none'
}

// --- 键盘导航 ---
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (filteredSuggestions.value.length > 0) {
      highlightedIndex.value = (highlightedIndex.value + 1) % filteredSuggestions.value.length
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (filteredSuggestions.value.length > 0) {
      highlightedIndex.value = highlightedIndex.value <= 0
        ? filteredSuggestions.value.length - 1
        : highlightedIndex.value - 1
    }
  }
}

function handleGlobalClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (engineSelectorRef.value && !engineSelectorRef.value.contains(target)) {
    showEngineDropdown.value = false
  }
  const searchContainer = document.querySelector('.search-container')
  if (searchContainer && !searchContainer.contains(target)) {
    closeSuggestions()
  }
}

onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleGlobalClick)
  document.removeEventListener('keydown', onKeydown)
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})
</script>
