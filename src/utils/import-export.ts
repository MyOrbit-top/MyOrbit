// ============================================
// MyOrbit - Import/Export Utilities
// ============================================

import type { Widget, TreeNode, BookmarkNode } from '@/schemas/types'

export interface ChromeBookmark {
  type: string
  name?: string
  url?: string
  children?: ChromeBookmark[]
  add_date?: string
}

export function parseChromeHTML(html: string): Widget[] {
  const widgets: Widget[] = []
  let widgetId = 1
  let nodeId = 1

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const dts = doc.querySelectorAll('dt')

    const folderMap = new Map<string, TreeNode[]>()

    dts.forEach((dt) => {
      const h3 = dt.querySelector('h3')
      const anchor = dt.querySelector('a')

      if (h3) {
        // Folder
        const folderName = h3.textContent || 'Bookmarks'
        folderMap.set(folderName, [])
      } else if (anchor) {
        // Bookmark
        const title = anchor.textContent || 'Untitled'
        const url = anchor.getAttribute('href') || ''
        const icon = anchor.getAttribute('icon') || undefined

        const bookmarkNode: BookmarkNode = {
          id: nodeId++,
          type: 'bookmark',
          title,
          url,
          icon,
          keywords: title.toLowerCase().split(' ').filter(Boolean),
        }

        // Find parent folder
        let parent = dt.parentElement
        while (parent) {
          const prevH3 = parent.querySelector(':scope > dt > h3')
          if (prevH3) {
            const folderName = prevH3.textContent || ''
            const nodes = folderMap.get(folderName)
            if (nodes) {
              nodes.push(bookmarkNode)
            }
            break
          }
          parent = parent.parentElement
        }

        // If no parent folder, add to root
        if (!parent || !parent.querySelector(':scope > dt > h3')) {
          const existingRoot = folderMap.get('Imported Bookmarks')
          if (existingRoot) {
            existingRoot.push(bookmarkNode)
          } else {
            folderMap.set('Imported Bookmarks', [bookmarkNode])
          }
        }
      }
    })

    // Convert folders to widgets with tree
    folderMap.forEach((nodes, name) => {
      if (nodes.length > 0) {
        widgets.push({
          id: widgetId++,
          type: 'bookmark',
          title: name,
          icon: 'Bookmark',
          order: widgets.length,
          private: false,
          data: { tree: nodes },
        })
      }
    })
  } catch (error) {
    console.error('Failed to parse Chrome bookmarks:', error)
  }

  return widgets
}

export function downloadJSON(data: string, filename: string) {
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
