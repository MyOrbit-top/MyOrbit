<template>
  <header class="orbit-header sticky top-0 z-30">
    <div class="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
      <!-- Logo -->
      <div class="flex items-center gap-3">
        <img
          :src="store.theme.value === 'dark' ? store.site.brand.logoDark : store.site.brand.logoLight"
          :alt="store.site.brand.name"
          class="h-8 w-auto"
        />
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <!-- Language Switcher -->
        <div class="relative" v-click-outside="() => showLangMenu = false">
          <button
            class="glass-btn !p-2.5 text-base leading-none"
            @click="showLangMenu = !showLangMenu"
            :title="i18n.getLocaleName()"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </button>
          <div v-if="showLangMenu" class="absolute right-0 top-full mt-2 w-40 py-2 rounded-xl glass-card z-50">
            <button
              v-for="locale in i18n.getAvailableLocales()"
              :key="locale.code"
              class="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2"
              :class="{ 'text-orbit': i18n.currentLocale.value === locale.code }"
              :style="{ color: i18n.currentLocale.value === locale.code ? '#4d7aff' : 'var(--text-primary)' }"
              @click="switchLanguage(locale.code)"
            >
              <span>{{ locale.name }}</span>
            </button>
          </div>
        </div>

        <!-- Theme Toggle -->
        <button
          class="glass-btn !p-2.5"
          @click="store.toggleTheme()"
          :title="store.theme.value === 'dark' ? i18n.t('header.switchToLight') : i18n.t('header.switchToDark')"
        >
          <svg v-if="store.theme.value === 'dark'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>

        <!-- PIN Lock -->
        <button
          v-if="store.isPinEnabled()"
          class="glass-btn !p-2.5"
          @click="store.pinState.unlocked ? store.lockPin() : store.showPinModal.value = true"
          :title="store.pinState.unlocked ? i18n.t('header.lock') : i18n.t('header.unlock')"
        >
          <svg v-if="store.pinState.unlocked" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
        </button>

        <!-- Add Widget -->
        <button class="glass-btn-primary flex items-center gap-1.5" @click="store.openDrawer('AddWidget')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span class="hidden sm:inline">{{ i18n.t('header.addWidget') }}</span>
        </button>

        <!-- Import/Export -->
        <div class="relative" v-click-outside="() => showMenu = false">
          <button class="glass-btn !p-2.5" @click="showMenu = !showMenu" :title="i18n.t('header.more')">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>
          <div v-if="showMenu" class="absolute right-0 top-full mt-2 w-48 py-2 rounded-xl glass-card z-50">
            <button class="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2" @click="handleImport">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {{ i18n.t('header.importJSON') }}
            </button>
            <button class="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2" @click="handleExport">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {{ i18n.t('header.exportJSON') }}
            </button>
            <div class="h-px bg-white/5 my-1"></div>
            <button class="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2" @click="handleChromeImport">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
              {{ i18n.t('header.importChrome') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from '@/runtime/store'
import { useI18n, type Locale } from '@/composables/useI18n'
import { downloadJSON, readFileAsText, parseChromeHTML } from '@/utils/import-export'

const store = useStore()
const i18n = useI18n()
const showMenu = ref(false)
const showLangMenu = ref(false)

function switchLanguage(code: string) {
  i18n.setLocale(code as Locale)
  showLangMenu.value = false
}

async function handleExport() {
  showMenu.value = false
  const data = store.exportData()
  if (data) {
    downloadJSON(data, `myorbit-export-${Date.now()}.json`)
    store.showToast(i18n.t('importExport.exported'), 'success')
  }
}

async function handleImport() {
  showMenu.value = false
  if (!store.pinState.unlocked && store.isPinEnabled()) {
    store.showToast(i18n.t('importExport.pinRequired'), 'error')
    return
  }
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const text = await readFileAsText(file)
      if (store.importData(text)) {
        store.showToast(i18n.t('importExport.imported'), 'success')
      } else {
        store.showToast(i18n.t('importExport.invalidJSON'), 'error')
      }
    } catch {
      store.showToast(i18n.t('importExport.failedImport'), 'error')
    }
  }
  input.click()
}

async function handleChromeImport() {
  showMenu.value = false
  if (!store.pinState.unlocked && store.isPinEnabled()) {
    store.showToast(i18n.t('importExport.pinRequired'), 'error')
    return
  }
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.html,.htm'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const html = await readFileAsText(file)
      const widgets = parseChromeHTML(html)
      widgets.forEach((w) => {
        store.addWidget(w)
      })
      store.showToast(i18n.t('importExport.importedBookmarks', { count: widgets.length }), 'success')
    } catch {
      store.showToast(i18n.t('importExport.failedImportBookmarks'), 'error')
    }
  }
  input.click()
}
</script>
