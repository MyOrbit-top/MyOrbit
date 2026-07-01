// ============================================
// MyOrbit - Core Type Definitions
// ============================================

// --- Site Config ---
export interface SiteConfig {
  brand: {
    name: string
    logoLight: string
    logoDark: string
  }
  theme: {
    default: 'light' | 'dark'
  }
  layout: {
    type: 'masonry'
    maxWidgetHeight: number
  }
  searchEngines: SearchEngine[]
  footer: string
}

// --- Search Engine ---
export interface SearchEngine {
  id: string
  name: string
  icon: string
  url: string
}

// --- User Data ---
export interface UserData {
  meta: {
    version: number
    nextId: number
  }
  settings: UserSettings
  security: SecurityConfig
  search?: UserSearchConfig
  widgets: Widget[]
}

// --- User Settings ---
export interface UserSettings {
  language: string
  theme: 'light' | 'dark'
}

// --- Security ---
export interface SecurityConfig {
  pinEnabled: boolean
  pinHash: string
}

// --- User Search Config ---
export interface UserSearchEngineEntry {
  id: string
  name?: string
  icon?: string
  url?: string
}

export interface UserSearchConfig {
  searchEngines: UserSearchEngineEntry[]
}

// --- Widget Types ---
// Root level only allows: 'bookmark' | 'rss'
// 'folder' is only inside BookmarkWidget tree
export type WidgetType = 'bookmark' | 'rss'

// --- TreeNode Types ---
export type TreeNodeType = 'folder' | 'bookmark'

// --- Bookmark Node (leaf) ---
export interface BookmarkNode {
  id: number
  type: 'bookmark'
  title: string
  url: string
  description?: string
  keywords?: string[]
  icon?: string
  private?: boolean
}

// --- Folder Node (branch) ---
export interface FolderNode {
  id: number
  type: 'folder'
  title: string
  collapsed?: boolean
  children: TreeNode[]
}

// --- TreeNode (union) ---
export type TreeNode = BookmarkNode | FolderNode

// --- Bookmark Widget Data ---
export interface BookmarkWidgetData {
  tree: TreeNode[]
  collapsed?: boolean
}

// --- RSS Feed ---
export interface RSSFeed {
  id: number
  title: string
  url: string
  items?: RSSItem[]
  lastFetched?: number
  private?: boolean
}

// --- RSS Item ---
export interface RSSItem {
  title: string
  link: string
  description?: string
  pubDate?: string
  source?: string
}

// --- RSS Tab ---
export interface RSSTab {
  id: number
  title: string
  feeds: RSSFeed[]
}

// --- RSS Widget Data ---
export interface RSSWidgetData {
  tabs: RSSTab[]
  activeTab: number
}

// --- Widget ---
export interface Widget {
  id: number
  type: WidgetType
  title: string
  icon?: string
  order: number
  private: boolean
  data: BookmarkWidgetData | RSSWidgetData
}

// --- Theme ---
export type ThemeMode = 'light' | 'dark'

// --- PIN State ---
export interface PINState {
  unlocked: boolean
}
