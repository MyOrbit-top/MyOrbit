// ============================================
// MyOrbit - Reactive State Store
// ============================================

import { reactive, ref, computed } from 'vue'
import type {
  UserData,
  Widget,
  SiteConfig,
  ThemeMode,
  PINState,
  SearchEngine,
  RSSFeed,
  RSSTab,
  BookmarkWidgetData,
  RSSWidgetData,
  TreeNode,
  BookmarkNode,
  FolderNode,
  UserSearchConfig,
  UserSearchEngineEntry,
} from '@/schemas/types'
import siteConfig from '@/schemas/site.json'
import defaultUserData from '@/schemas/user.json'
import { sha256 } from '@/utils/crypto'

// --- Drag Types ---
type MoveResult = { success: boolean; error?: string }

// --- Drag Session State ---
let dragSession: {
  sourceWidgetId: number
  nodeId: number
  nodeType: 'bookmark' | 'folder'
  ancestorIds: Set<number>
} | null = null

function getDragSession() { return dragSession }
function setDragSession(s: typeof dragSession) { dragSession = s }
function clearDragSession() { dragSession = null }

// --- State ---
const userData = reactive<UserData>(JSON.parse(JSON.stringify(defaultUserData)))
const site = reactive<SiteConfig>(siteConfig as SiteConfig)
const theme = ref<ThemeMode>((localStorage.getItem('myorbit-theme') as ThemeMode) || site.theme.default)
const pinState = reactive<PINState>({
  unlocked: localStorage.getItem('myorbit-pin-unlocked') === 'true',
})
const searchQuery = ref('')

// --- Search UI State Machine ---
const searchUI = reactive({
  engineDropdown: 'closed' as 'open' | 'closed',
  suggestionVisible: false,
  highlightedIndex: -1,
  query: '',
})
const drawerOpen = ref(false)
const drawerComponent = ref<string | null>(null)
const drawerProps = ref<any>(null)
const toastMessage = ref<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)
const showPinModal = ref(false)

// --- Computed ---
const visibleWidgets = computed(() => {
  if (pinState.unlocked || !userData.security.pinEnabled) {
    return userData.widgets
  }
  return userData.widgets.filter((w) => !w.private)
})

const currentSearchEngine = computed(() => {
  const engines = getSearchEngines()
  return engines[0] || site.searchEngines[0]
})

// --- Theme ---
function setTheme(mode: ThemeMode) {
  theme.value = mode
  localStorage.setItem('myorbit-theme', mode)
  applyTheme()
}

function toggleTheme() {
  setTheme(theme.value === 'dark' ? 'light' : 'dark')
}

function applyTheme() {
  if (theme.value === 'dark') {
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    document.documentElement.setAttribute('data-theme', 'light')
  }
}

// --- PIN ---
async function unlockPin(pin: string): Promise<boolean> {
  const hash = await sha256(pin)
  if (hash === userData.security.pinHash) {
    pinState.unlocked = true
    localStorage.setItem('myorbit-pin-unlocked', 'true')
    return true
  }
  return false
}

function lockPin() {
  pinState.unlocked = false
  localStorage.removeItem('myorbit-pin-unlocked')
}

function isPinEnabled(): boolean {
  return userData.security.pinEnabled
}

function canEdit(): boolean {
  if (!userData.security.pinEnabled) return true
  return pinState.unlocked
}

// --- ID Management ---
function getNextId(): number {
  const id = userData.meta.nextId
  userData.meta.nextId++
  return id
}

// --- Widget CRUD ---
function addWidget(widget: Omit<Widget, 'id'>): Widget | null {
  if (!canEdit()) {
    showToast('PIN required for edit mode', 'error')
    return null
  }
  const newWidget: Widget = { ...widget, id: getNextId() } as Widget
  userData.widgets.push(newWidget)
  saveUserData()
  return newWidget
}

function updateWidget(id: number, updates: Partial<Widget>) {
  if (!canEdit()) {
    showToast('PIN required for edit mode', 'error')
    return
  }
  const index = userData.widgets.findIndex((w) => w.id === id)
  if (index !== -1) {
    userData.widgets[index] = { ...userData.widgets[index], ...updates }
    saveUserData()
  }
}

function removeWidget(id: number) {
  if (!canEdit()) {
    showToast('PIN required for edit mode', 'error')
    return
  }
  const index = userData.widgets.findIndex((w) => w.id === id)
  if (index !== -1) {
    userData.widgets.splice(index, 1)
    saveUserData()
  }
}

function reorderWidgets(fromIndex: number, toIndex: number) {
  if (!canEdit()) return
  const widget = userData.widgets.splice(fromIndex, 1)[0]
  userData.widgets.splice(toIndex, 0, widget)
  userData.widgets.forEach((w, i) => (w.order = i))
  saveUserData()
}

// --- Tree Node Operations ---

// Add a bookmark node to a widget's tree (or to a specific folder within the tree)
function addTreeNode(widgetId: number, parentFolderId: number | null, node: Omit<BookmarkNode, 'id'> | Omit<FolderNode, 'id'>): TreeNode | null {
  if (!canEdit()) {
    showToast('PIN required for edit mode', 'error')
    return null
  }
  const widget = userData.widgets.find((w) => w.id === widgetId)
  if (!widget || widget.type !== 'bookmark') return null
  const data = widget.data as BookmarkWidgetData

  const newNode: TreeNode = { ...node, id: getNextId() } as TreeNode

  if (parentFolderId === null) {
    // Add to root tree
    data.tree.push(newNode)
  } else {
    // Find the folder and add to its children
    const folder = findTreeNode(data.tree, parentFolderId)
    if (folder && folder.type === 'folder') {
      folder.children.push(newNode)
    } else {
      return null
    }
  }
  saveUserData()
  return newNode
}

// Update a tree node (bookmark or folder)
function updateTreeNode(widgetId: number, nodeId: number, updates: Partial<TreeNode>) {
  if (!canEdit()) {
    showToast('PIN required for edit mode', 'error')
    return
  }
  const widget = userData.widgets.find((w) => w.id === widgetId)
  if (!widget || widget.type !== 'bookmark') return
  const data = widget.data as BookmarkWidgetData

  const node = findTreeNode(data.tree, nodeId)
  if (node) {
    Object.assign(node, updates)
    saveUserData()
  }
}

// Remove a tree node
function removeTreeNode(widgetId: number, nodeId: number) {
  if (!canEdit()) {
    showToast('PIN required for edit mode', 'error')
    return
  }
  const widget = userData.widgets.find((w) => w.id === widgetId)
  if (!widget || widget.type !== 'bookmark') return
  const data = widget.data as BookmarkWidgetData

  removeFromTree(data.tree, nodeId)
  saveUserData()
}

// Toggle folder collapsed state
function toggleFolderCollapsed(widgetId: number, folderId: number) {
  const widget = userData.widgets.find((w) => w.id === widgetId)
  if (!widget || widget.type !== 'bookmark') return
  const data = widget.data as BookmarkWidgetData

  const folder = findTreeNode(data.tree, folderId)
  if (folder && folder.type === 'folder') {
    folder.collapsed = !folder.collapsed
    saveUserData()
  }
}

// Toggle widget collapsed state
function toggleWidgetCollapsed(widgetId: number) {
  const widget = userData.widgets.find((w) => w.id === widgetId)
  if (!widget || widget.type !== 'bookmark') return
  const data = widget.data as BookmarkWidgetData
  data.collapsed = !data.collapsed
  saveUserData()
}

// --- Tree Drag & Drop ---
// Move a node within the same tree (reorder or move between folders)
function moveTreeNode(widgetId: number, nodeId: number, targetFolderId: number | null, targetIndex: number) {
  if (!canEdit()) return
  const widget = userData.widgets.find((w) => w.id === widgetId)
  if (!widget || widget.type !== 'bookmark') return
  const data = widget.data as BookmarkWidgetData

  // Find and remove the node from its current location
  const node = removeFromTree(data.tree, nodeId)
  if (!node) return

  // Insert at target location
  if (targetFolderId === null) {
    data.tree.splice(targetIndex, 0, node)
  } else {
    const targetFolder = findTreeNode(data.tree, targetFolderId)
    if (targetFolder && targetFolder.type === 'folder') {
      targetFolder.children.splice(targetIndex, 0, node)
    }
  }
  saveUserData()
}

// Merge two bookmark nodes into a folder
function mergeBookmarksIntoFolder(widgetId: number, sourceId: number, targetId: number) {
  if (!canEdit()) return
  const widget = userData.widgets.find((w) => w.id === widgetId)
  if (!widget || widget.type !== 'bookmark') return
  const data = widget.data as BookmarkWidgetData

  const source = removeFromTree(data.tree, sourceId)
  const target = removeFromTree(data.tree, targetId)
  if (!source || !target) {
    // Rollback: put them back
    if (source) data.tree.push(source)
    if (target) data.tree.push(target)
    return
  }

  const newFolder: FolderNode = {
    id: getNextId(),
    type: 'folder',
    title: `${target.type === 'bookmark' ? target.title : 'Folder'} & ${source.type === 'bookmark' ? source.title : 'Folder'}`,
    collapsed: false,
    children: [target, source],
  }
  data.tree.push(newFolder)
  saveUserData()
}

// --- Tree Drag Helpers (new, for cross-widget drag) ---
function findInTree(
  nodes: TreeNode[],
  id: number,
  parent: TreeNode | null = null
): { node: TreeNode; parent: TreeNode | null; index: number } | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      return { node: nodes[i], parent, index: i }
    }
    if (nodes[i].type === 'folder') {
      const folder = nodes[i] as FolderNode
      const found = findInTree(folder.children, id, nodes[i])
      if (found) return found
    }
  }
  return null
}

// Cross-widget move (also works for same-widget moves)
function moveTreeNodeCrossWidget(
  sourceWidgetId: number,
  nodeId: number,
  targetWidgetId: number,
  targetFolderId: number | null,
  targetIndex: number
): MoveResult {
  if (!canEdit()) {
    return { success: false, error: 'pinRequired' }
  }

  const sourceW = userData.widgets.find(w => w.id === sourceWidgetId)
  const targetW = userData.widgets.find(w => w.id === targetWidgetId)
  if (!sourceW || sourceW.type !== 'bookmark' || !targetW || targetW.type !== 'bookmark') {
    return { success: false, error: 'onlyBookmarkWidget' }
  }

  const sourceData = sourceW.data as BookmarkWidgetData
  const targetData = targetW.data as BookmarkWidgetData

  // Find node position in source tree (supports nested folders)
  const pos = findInTree(sourceData.tree, nodeId)
  if (!pos) {
    return { success: false, error: 'nodeNotFound' }
  }

  const parentList = pos.parent ? (pos.parent as FolderNode).children : sourceData.tree
  const node = parentList.splice(pos.index, 1)[0]

  // targetIndex === -1 means append to end
  if (targetFolderId === null) {
    if (targetIndex < 0 || targetIndex > targetData.tree.length) {
      targetData.tree.push(node)
    } else {
      targetData.tree.splice(targetIndex, 0, node)
    }
  } else {
    const folder = findInTree(targetData.tree, targetFolderId)
    if (!folder || folder.node.type !== 'folder') {
      // Rollback: put node back to source widget root
      sourceData.tree.push(node)
      return { success: false, error: 'moveFailed' }
    }
    const folderNode = folder.node as FolderNode
    if (targetIndex < 0 || targetIndex > folderNode.children.length) {
      folderNode.children.push(node)
    } else {
      folderNode.children.splice(targetIndex, 0, node)
    }
  }

  saveUserData()
  return { success: true }
}

// Merge two bookmarks into a folder (supports cross-widget)
function mergeBookmarks(
  sourceWidgetId: number,
  sourceNodeId: number,
  targetWidgetId: number,
  targetNodeId: number
): MoveResult {
  if (!canEdit()) {
    return { success: false, error: 'pinRequired' }
  }

  const sourceW = userData.widgets.find(w => w.id === sourceWidgetId)
  const targetW = userData.widgets.find(w => w.id === targetWidgetId)
  if (!sourceW || sourceW.type !== 'bookmark' || !targetW || targetW.type !== 'bookmark') {
    return { success: false, error: 'onlyBookmarkWidget' }
  }

  const sourceData = sourceW.data as BookmarkWidgetData
  const targetData = targetW.data as BookmarkWidgetData

  const posA = findInTree(sourceData.tree, sourceNodeId)
  const posB = findInTree(targetData.tree, targetNodeId)

  if (!posA || !posB) {
    return { success: false, error: 'nodeNotFound' }
  }
  if (posA.node.type === 'folder' || posB.node.type === 'folder') {
    return { success: false, error: 'cannotMergeFolder' }
  }
  if (sourceWidgetId === targetWidgetId && sourceNodeId === targetNodeId) {
    return { success: false, error: 'cannotMergeSelf' }
  }

  const truncate = (s: string) => s.length > 15 ? s.slice(0, 15) + '…' : s

  const parentListA = posA.parent ? (posA.parent as FolderNode).children : sourceData.tree
  const nodeA = parentListA.splice(posA.index, 1)[0] as BookmarkNode

  let idxB = posB.index
  if (
    sourceWidgetId === targetWidgetId &&
    posA.parent?.id === posB.parent?.id &&
    posA.index < posB.index
  ) {
    idxB--
  }

  const parentListB = posB.parent ? (posB.parent as FolderNode).children : targetData.tree
  const nodeB = parentListB.splice(idxB, 1)[0] as BookmarkNode

  const newFolder: FolderNode = {
    id: getNextId(),
    type: 'folder',
    title: `${truncate(nodeB.title)} & ${truncate(nodeA.title)}`,
    collapsed: false,
    children: [nodeB, nodeA]
  }

  const parentListInsert = posB.parent ? (posB.parent as FolderNode).children : targetData.tree
  parentListInsert.splice(idxB, 0, newFolder)

  saveUserData()
  return { success: true }
}

// --- Tree Helpers ---
function findTreeNode(nodes: TreeNode[], id: number): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.type === 'folder') {
      const found = findTreeNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

function removeFromTree(nodes: TreeNode[], id: number): TreeNode | null {
  const idx = nodes.findIndex((n) => n.id === id)
  if (idx !== -1) {
    return nodes.splice(idx, 1)[0]
  }
  for (const node of nodes) {
    if (node.type === 'folder') {
      const found = removeFromTree(node.children, id)
      if (found) return found
    }
  }
  return null
}

// --- RSS Operations ---
function addRSSTab(widgetId: number, title: string): RSSTab | null {
  if (!canEdit()) {
    showToast('PIN required for edit mode', 'error')
    return null
  }
  const widget = userData.widgets.find((w) => w.id === widgetId)
  if (!widget || widget.type !== 'rss') return null
  const data = widget.data as RSSWidgetData
  const tab: RSSTab = { id: getNextId(), title, feeds: [] }
  data.tabs.push(tab)
  saveUserData()
  return tab
}

function updateRSSTab(widgetId: number, tabId: number, updates: Partial<RSSTab>) {
  if (!canEdit()) return
  const widget = userData.widgets.find((w) => w.id === widgetId)
  if (!widget || widget.type !== 'rss') return
  const data = widget.data as RSSWidgetData
  const idx = data.tabs.findIndex((t) => t.id === tabId)
  if (idx !== -1) {
    data.tabs[idx] = { ...data.tabs[idx], ...updates }
    saveUserData()
  }
}

function removeRSSTab(widgetId: number, tabId: number) {
  if (!canEdit()) return
  const widget = userData.widgets.find((w) => w.id === widgetId)
  if (!widget || widget.type !== 'rss') return
  const data = widget.data as RSSWidgetData
  const idx = data.tabs.findIndex((t) => t.id === tabId)
  if (idx !== -1) {
    data.tabs.splice(idx, 1)
    if (data.activeTab >= data.tabs.length) {
      data.activeTab = Math.max(0, data.tabs.length - 1)
    }
    saveUserData()
  }
}

function reorderRSSTabs(widgetId: number, fromIndex: number, toIndex: number) {
  if (!canEdit()) return
  const widget = userData.widgets.find((w) => w.id === widgetId)
  if (!widget || widget.type !== 'rss') return
  const data = widget.data as RSSWidgetData
  const [tab] = data.tabs.splice(fromIndex, 1)
  data.tabs.splice(toIndex, 0, tab)
  saveUserData()
}

function addRSSFeed(widgetId: number, tabId: number, feed: Omit<RSSFeed, 'id'>): RSSFeed | null {
  if (!canEdit()) return null
  const widget = userData.widgets.find((w) => w.id === widgetId)
  if (!widget || widget.type !== 'rss') return null
  const data = widget.data as RSSWidgetData
  const tab = data.tabs.find((t) => t.id === tabId)
  if (!tab) return null
  const newFeed: RSSFeed = { ...feed, id: getNextId() }
  tab.feeds.push(newFeed)
  saveUserData()
  return newFeed
}

function removeRSSFeed(widgetId: number, tabId: number, feedId: number) {
  if (!canEdit()) return
  const widget = userData.widgets.find((w) => w.id === widgetId)
  if (!widget || widget.type !== 'rss') return
  const data = widget.data as RSSWidgetData
  const tab = data.tabs.find((t) => t.id === tabId)
  if (!tab) return
  const idx = tab.feeds.findIndex((f) => f.id === feedId)
  if (idx !== -1) {
    tab.feeds.splice(idx, 1)
    saveUserData()
  }
}

function setActiveTab(widgetId: number, tabIndex: number) {
  const widget = userData.widgets.find((w) => w.id === widgetId)
  if (!widget || widget.type !== 'rss') return
  const data = widget.data as RSSWidgetData
  data.activeTab = tabIndex
}

// --- Persistence ---
function saveUserData() {
  try {
    localStorage.setItem('myorbit-userdata', JSON.stringify(userData))
  } catch (e) {
    console.error('Failed to save user data:', e)
  }
}

function loadUserData(): boolean {
  try {
    const saved = localStorage.getItem('myorbit-userdata')
    if (saved) {
      const parsed = JSON.parse(saved)
      // Migrate old data format (v1 with bookmarks array -> v2 with tree)
      migrateUserData(parsed)
      Object.assign(userData, parsed)
      return true
    }
  } catch (e) {
    console.error('Failed to load user data:', e)
  }
  return false
}

// --- Migration: v1 -> v2 ---
function migrateUserData(data: any) {
  if (data.meta?.version === 2) return // Already v2

  // Migrate from v1 (bookmarks array) to v2 (tree)
  if (data.widgets && Array.isArray(data.widgets)) {
    for (const widget of data.widgets) {
      if (widget.type === 'bookmark' && widget.data?.bookmarks) {
        // Convert old bookmarks array to tree
        const tree: TreeNode[] = widget.data.bookmarks.map((b: any) => ({
          id: b.id,
          type: 'bookmark' as const,
          title: b.title,
          url: b.url,
          description: b.description || '',
          icon: b.icon,
          keywords: b.keywords || [],
        }))
        widget.data.tree = tree
        delete widget.data.bookmarks
      }
      // Migrate old folder widgets: convert to bookmark widgets with tree
      if (widget.type === 'folder' && widget.data?.children) {
        widget.type = 'bookmark'
        const tree = migrateFolderChildren(widget.data.children)
        widget.data.tree = tree
        delete widget.data.children
      }
    }
  }

  // Update version
  if (data.meta) {
    data.meta.version = 2
    // Ensure nextId is large enough
    if (data.meta.nextId < 1000) {
      data.meta.nextId = 1000
    }
  }
}

function migrateFolderChildren(children: any[]): TreeNode[] {
  return children.map((child: any) => {
    if (child.type === 'folder') {
      return {
        id: child.id,
        type: 'folder' as const,
        title: child.title,
        collapsed: child.collapsed || false,
        children: migrateFolderChildren(child.data?.children || []),
      }
    }
    // Bookmark child
    if (child.type === 'bookmark') {
      const bookmarks = child.data?.bookmarks || []
      // If the child has bookmarks, create a folder
      if (bookmarks.length > 0) {
        return {
          id: child.id,
          type: 'folder' as const,
          title: child.title,
          collapsed: false,
          children: bookmarks.map((b: any) => ({
            id: b.id,
            type: 'bookmark' as const,
            title: b.title,
            url: b.url,
            description: b.description || '',
            icon: b.icon,
            keywords: b.keywords || [],
          })),
        }
      }
    }
    return null
  }).filter(Boolean) as TreeNode[]
}

// --- Import/Export ---
function exportData(): string | null {
  if (!canEdit()) {
    showToast('PIN required for edit mode', 'error')
    return null
  }
  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    widgets: userData.widgets,
    settings: userData.settings,
  }
  return JSON.stringify(data, null, 2)
}

function importData(json: string): boolean {
  if (!canEdit()) {
    showToast('PIN required for edit mode', 'error')
    return false
  }
  try {
    const data = JSON.parse(json)
    if (!data.widgets || !Array.isArray(data.widgets)) return false
    migrateUserData(data)
    userData.widgets = data.widgets
    if (data.settings) {
      Object.assign(userData.settings, data.settings)
    }
    saveUserData()
    return true
  } catch {
    return false
  }
}

// --- Toast ---
function showToast(text: string, type: 'success' | 'error' | 'info' = 'info') {
  toastMessage.value = { text, type }
  setTimeout(() => {
    toastMessage.value = null
  }, 3000)
}

// --- Drawer ---
function openDrawer(component: string, props?: any) {
  if (!canEdit() && component !== 'PINModal') {
    showToast('PIN required for edit mode', 'error')
    return
  }
  drawerComponent.value = component
  drawerProps.value = props || null
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
  drawerComponent.value = null
  drawerProps.value = null
}

// --- Init ---
function init() {
  loadUserData()
  applyTheme()
}

// --- Search UI State Machine ---
function openEngineDropdown() {
  searchUI.engineDropdown = 'open'
}

function closeEngineDropdown() {
  searchUI.engineDropdown = 'closed'
}

function toggleEngineDropdown() {
  searchUI.engineDropdown = searchUI.engineDropdown === 'open' ? 'closed' : 'open'
}

function openSuggestions() {
  searchUI.suggestionVisible = true
}

function closeSuggestions() {
  searchUI.suggestionVisible = false
  searchUI.highlightedIndex = -1
}

function closeAllOverlays() {
  searchUI.engineDropdown = 'closed'
  searchUI.suggestionVisible = false
  searchUI.highlightedIndex = -1
}

// --- Search Suggestions ---
export interface SearchResult {
  title: string
  url: string
  description: string
  icon: string
  sourceWidget: string
}

function getSuggestions(q: string): SearchResult[] {
  if (!q || q.length < 1) return []
  const lower = q.toLowerCase()
  const results: SearchResult[] = []

  try {
    for (const widget of userData.widgets) {
      // Skip private widgets if not unlocked
      if (widget.private && !pinState.unlocked) continue

      if (widget.type === 'bookmark') {
        const data = widget.data as BookmarkWidgetData
        if (data.tree) {
          searchBookmarksRecursive(data.tree, lower, results, widget.title)
        }
      }
    }
  } catch {
    // Silently fail - search errors should never break UI
  }

  return results.slice(0, 10)
}

function searchBookmarksRecursive(
  nodes: TreeNode[],
  lower: string,
  results: SearchResult[],
  widgetTitle: string
) {
  for (const node of nodes) {
    if (node.type === 'bookmark') {
      const bm = node as BookmarkNode
      // Skip private bookmarks if PIN is locked
      if (bm.private && !pinState.unlocked && userData.security.pinEnabled) continue

      const matchTitle = bm.title?.toLowerCase().includes(lower)
      const matchUrl = bm.url?.toLowerCase().includes(lower)
      const matchKeywords = bm.keywords?.some((k: string) => k.toLowerCase().includes(lower))
      const matchDesc = bm.description?.toLowerCase().includes(lower)

      if (matchTitle || matchUrl || matchKeywords || matchDesc) {
        results.push({
          title: bm.title || '',
          url: bm.url || '',
          description: bm.description || bm.url || '',
          icon: bm.icon || '',
          sourceWidget: widgetTitle,
        })
      }
    }
    // Recursively search folders
    if (node.type === 'folder') {
      const folder = node as FolderNode
      if (folder.children) {
        searchBookmarksRecursive(folder.children, lower, results, widgetTitle)
      }
    }
  }
}

// --- Search Engines ---
function getSearchEngines(): SearchEngine[] {
  // Get user's ordered engine list from user.json
  const userEngines = (userData as any).search?.searchEngines as UserSearchEngineEntry[] | undefined
  if (!userEngines || userEngines.length === 0) {
    return site.searchEngines
  }

  const result: SearchEngine[] = []
  for (const entry of userEngines) {
    // Check if it's a system engine (only id) - look up from site config
    const siteEngine = site.searchEngines.find((s) => s.id === entry.id)
    if (siteEngine) {
      result.push(siteEngine)
    } else if (entry.name && entry.url) {
      // Custom engine - has full details
      result.push({
        id: entry.id,
        name: entry.name,
        icon: entry.icon || '',
        url: entry.url,
      })
    }
  }

  // Append any site engines not in user list
  for (const se of site.searchEngines) {
    if (!result.find((r) => r.id === se.id)) {
      result.push(se)
    }
  }

  return result
}

function setSearchEngine(id: string) {
  // Update user's search engine order
  const userEngines = (userData as any).search?.searchEngines as UserSearchEngineEntry[] | undefined
  if (!userEngines) return

  const idx = userEngines.findIndex((e) => e.id === id)
  if (idx !== -1) {
    const entry = userEngines.splice(idx, 1)[0]
    userEngines.unshift(entry)
    saveUserData()
  }
}

// --- Search Engine CRUD ---
function addSearchEngine(engine: { id: string; name: string; icon: string; url: string }) {
  if (!canEdit()) {
    showToast('PIN required for edit mode', 'error')
    return
  }
  if (!userData.search) {
    userData.search = { searchEngines: [] }
  }
  userData.search.searchEngines.push({
    id: engine.id,
    name: engine.name,
    icon: engine.icon || undefined,
    url: engine.url,
  })
  saveUserData()
}

function updateSearchEngine(id: string, updates: { name?: string; icon?: string; url?: string }) {
  if (!canEdit()) {
    showToast('PIN required for edit mode', 'error')
    return
  }
  const userEngines = (userData as any).search?.searchEngines as UserSearchEngineEntry[] | undefined
  if (!userEngines) return

  const entry = userEngines.find((e) => e.id === id)
  if (entry) {
    if (updates.name !== undefined) entry.name = updates.name
    if (updates.icon !== undefined) entry.icon = updates.icon
    if (updates.url !== undefined) entry.url = updates.url
    saveUserData()
  }
}

function removeSearchEngine(id: string) {
  if (!canEdit()) {
    showToast('PIN required for edit mode', 'error')
    return
  }
  const userEngines = (userData as any).search?.searchEngines as UserSearchEngineEntry[] | undefined
  if (!userEngines) return

  const idx = userEngines.findIndex((e) => e.id === id)
  if (idx !== -1) {
    userEngines.splice(idx, 1)
    saveUserData()
  }
}

function reorderSearchEngines(fromIndex: number, toIndex: number) {
  if (!canEdit()) return
  const userEngines = (userData as any).search?.searchEngines as UserSearchEngineEntry[] | undefined
  if (!userEngines) return
  const [engine] = userEngines.splice(fromIndex, 1)
  userEngines.splice(toIndex, 0, engine)
  saveUserData()
}

function resetSearchEngines() {
  if (!canEdit()) {
    showToast('PIN required for edit mode', 'error')
    return
  }
  // Reset to default engines from site config
  userData.search = {
    searchEngines: site.searchEngines.map((se) => ({ id: se.id })),
  }
  saveUserData()
}

// --- Exports ---
export function useStore() {
  return {
    // State
    userData,
    site,
    theme,
    pinState,
    searchQuery,
    drawerOpen,
    drawerComponent,
    drawerProps,
    toastMessage,
    showPinModal,

    // Computed
    visibleWidgets,
    currentSearchEngine,

    // Theme
    setTheme,
    toggleTheme,
    applyTheme,

    // PIN
    unlockPin,
    lockPin,
    isPinEnabled,
    canEdit,

    // Widget CRUD
    getNextId,
    addWidget,
    updateWidget,
    removeWidget,
    reorderWidgets,

    // Tree Node Operations
    addTreeNode,
    updateTreeNode,
    removeTreeNode,
    toggleFolderCollapsed,
    toggleWidgetCollapsed,
    moveTreeNode,
    mergeBookmarksIntoFolder,

    // Tree Drag (cross-widget)
    moveTreeNodeCrossWidget,
    mergeBookmarks,
    findInTree,
    getDragSession,
    setDragSession,
    clearDragSession,

    // RSS
    addRSSTab,
    updateRSSTab,
    removeRSSTab,
    reorderRSSTabs,
    addRSSFeed,
    removeRSSFeed,
    setActiveTab,

    // Persistence
    saveUserData,
    loadUserData,

    // Import/Export
    exportData,
    importData,

    // UI
    showToast,
    openDrawer,
    closeDrawer,

    // Search UI
    searchUI,
    openEngineDropdown,
    closeEngineDropdown,
    toggleEngineDropdown,
    openSuggestions,
    closeSuggestions,
    closeAllOverlays,
    getSuggestions,

    // Search
    getSearchEngines,
    setSearchEngine,

    // Search Engine CRUD
    addSearchEngine,
    updateSearchEngine,
    removeSearchEngine,
    reorderSearchEngines,
    resetSearchEngines,

    // Init
    init,
  }
}