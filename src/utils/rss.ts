// ============================================
// MyOrbit - RSS Feed Parser
// ============================================

import type { RSSItem } from '@/schemas/types'
import { getRSSCache, setRSSCache } from '@/runtime/indexeddb'

const MAX_ITEMS_PER_FEED = 15

export async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
  // Try cache first
  try {
    const cached = await getRSSCache(url)
    if (cached && cached.length > 0) {
      return cached.slice(0, MAX_ITEMS_PER_FEED)
    }
  } catch {
    // Cache miss, continue
  }

  try {
    const response = await fetch(url, {
      mode: 'cors',
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const xml = await response.text()
    const items = parseRSSXML(xml, url)

    // Cache the results
    try {
      await setRSSCache(url, items)
    } catch {
      // Cache failure is non-critical
    }

    return items.slice(0, MAX_ITEMS_PER_FEED)
  } catch (error) {
    console.warn(`Failed to fetch RSS feed: ${url}`, error)
    return []
  }
}

function parseRSSXML(xml: string, sourceUrl: string): RSSItem[] {
  const items: RSSItem[] = []

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')

    // Check for parser errors
    const parserError = doc.querySelector('parsererror')
    if (parserError) {
      console.warn('XML parse error for feed:', sourceUrl)
      return []
    }

    // Try RSS 2.0 format
    const rssItems = doc.querySelectorAll('rss channel item')
    if (rssItems.length > 0) {
      rssItems.forEach((item) => {
        const title = item.querySelector('title')?.textContent || 'Untitled'
        const link = item.querySelector('link')?.textContent || ''
        const description = item.querySelector('description')?.textContent || ''
        const pubDate = item.querySelector('pubDate')?.textContent || ''

        items.push({
          title: sanitizeText(title),
          link: link.trim(),
          description: sanitizeText(description).slice(0, 300),
          pubDate,
          source: sourceUrl,
        })
      })
      return items
    }

    // Try Atom format
    const atomItems = doc.querySelectorAll('feed entry')
    if (atomItems.length > 0) {
      atomItems.forEach((entry) => {
        const title = entry.querySelector('title')?.textContent || 'Untitled'
        const linkEl = entry.querySelector('link')
        const link = linkEl?.getAttribute('href') || ''
        const content = entry.querySelector('content')?.textContent || entry.querySelector('summary')?.textContent || ''
        const published = entry.querySelector('published')?.textContent || entry.querySelector('updated')?.textContent || ''

        items.push({
          title: sanitizeText(title),
          link: link.trim(),
          description: sanitizeText(content).slice(0, 300),
          pubDate: published,
          source: sourceUrl,
        })
      })
      return items
    }

    // Try RSS 1.0 (RDF) format
    const rdfItems = doc.querySelectorAll('item')
    if (rdfItems.length > 0) {
      rdfItems.forEach((item) => {
        const title = item.querySelector('title')?.textContent || 'Untitled'
        const link = item.querySelector('link')?.textContent || ''
        const description = item.querySelector('description')?.textContent || ''
        const dcDate = item.querySelector('dc\\:date, date')?.textContent || ''

        items.push({
          title: sanitizeText(title),
          link: link.trim(),
          description: sanitizeText(description).slice(0, 300),
          pubDate: dcDate,
          source: sourceUrl,
        })
      })
      return items
    }
  } catch (error) {
    console.warn('RSS parse error:', error)
  }

  return items
}

function sanitizeText(text: string): string {
  return text
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .trim()
}

export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return ''

  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''

    const now = Date.now()
    const diff = now - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  } catch {
    return ''
  }
}
