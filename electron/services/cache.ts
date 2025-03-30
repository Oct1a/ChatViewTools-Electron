import { Logger } from '../utils/logger'
import { ChatMessage } from './database'

interface CacheItem<T> {
  data: T
  timestamp: number
}

export class CacheService {
  private logger = Logger.getInstance()
  private messageCache: Map<string, CacheItem<ChatMessage[]>> = new Map()
  private fileCache: Map<string, CacheItem<string>> = new Map()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5分钟

  constructor(private ttl: number = this.DEFAULT_TTL) {}

  setMessage(key: string, messages: ChatMessage[]): void {
    try {
      this.messageCache.set(key, {
        data: messages,
        timestamp: Date.now()
      })
      this.logger.debug('消息缓存已更新: %s', key)
    } catch (error) {
      this.logger.error('更新消息缓存失败: %s', error)
    }
  }

  getMessage(key: string): ChatMessage[] | null {
    try {
      const item = this.messageCache.get(key)
      if (!item) {
        return null
      }

      if (this.isExpired(item.timestamp)) {
        this.messageCache.delete(key)
        return null
      }

      return item.data
    } catch (error) {
      this.logger.error('获取消息缓存失败: %s', error)
      return null
    }
  }

  setFile(key: string, path: string): void {
    try {
      this.fileCache.set(key, {
        data: path,
        timestamp: Date.now()
      })
      this.logger.debug('文件缓存已更新: %s', key)
    } catch (error) {
      this.logger.error('更新文件缓存失败: %s', error)
    }
  }

  getFile(key: string): string | null {
    try {
      const item = this.fileCache.get(key)
      if (!item) {
        return null
      }

      if (this.isExpired(item.timestamp)) {
        this.fileCache.delete(key)
        return null
      }

      return item.data
    } catch (error) {
      this.logger.error('获取文件缓存失败: %s', error)
      return null
    }
  }

  clear(): void {
    try {
      this.messageCache.clear()
      this.fileCache.clear()
      this.logger.info('缓存已清空')
    } catch (error) {
      this.logger.error('清空缓存失败: %s', error)
    }
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.ttl
  }
} 