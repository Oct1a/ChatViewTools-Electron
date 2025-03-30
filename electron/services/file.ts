import { app } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { mkdir, copyFile, access, constants } from 'fs/promises'
import { Logger } from '../utils/logger'
import { AppError, ErrorCodes, handleError } from '../utils/error'
import { ChatMessage, MessageType } from './database'
import { CacheService } from './cache'

// 扩展错误码
const FileErrorCodes = {
  NOT_FOUND: 'FILE_NOT_FOUND',
  ACCESS_DENIED: 'FILE_ACCESS_DENIED',
  COPY_FAILED: 'FILE_COPY_FAILED'
}

export class FileService {
  private logger = Logger.getInstance()
  private baseDir: string
  private cache: CacheService

  constructor() {
    this.baseDir = join(app.getPath('userData'), 'files')
    this.cache = new CacheService()
  }

  async init() {
    try {
      if (!existsSync(this.baseDir)) {
        await mkdir(this.baseDir, { recursive: true })
      }
      this.logger.info('文件服务初始化成功')
    } catch (error) {
      this.logger.error('文件服务初始化失败: %s', error)
      throw handleError(error)
    }
  }

  async saveFile(message: ChatMessage): Promise<string> {
    try {
      if (!message.filePath) {
        throw new AppError(
          '文件路径不存在',
          FileErrorCodes.NOT_FOUND
        )
      }

      // 检查缓存
      const cacheKey = `file_${message.msgId}`
      const cachedPath = this.cache.getFile(cacheKey)
      if (cachedPath) {
        return cachedPath
      }

      // 检查源文件是否存在和可访问
      try {
        await access(message.filePath, constants.R_OK)
      } catch (error) {
        throw new AppError(
          '源文件不存在或无访问权限',
          FileErrorCodes.ACCESS_DENIED,
          { error }
        )
      }

      const fileDir = this.getFileDir(message)
      if (!existsSync(fileDir)) {
        await mkdir(fileDir, { recursive: true })
      }

      const fileName = this.getFileName(message)
      const targetPath = join(fileDir, fileName)

      // 如果目标文件已存在，先检查是否可写
      if (existsSync(targetPath)) {
        try {
          await access(targetPath, constants.W_OK)
        } catch (error) {
          throw new AppError(
            '目标文件无写入权限',
            FileErrorCodes.ACCESS_DENIED,
            { error }
          )
        }
      }

      // 复制文件
      try {
        await copyFile(message.filePath, targetPath)
        this.cache.setFile(cacheKey, targetPath)
      } catch (error) {
        throw new AppError(
          '文件复制失败',
          FileErrorCodes.COPY_FAILED,
          { error }
        )
      }

      this.logger.info('文件保存成功: %s', targetPath)
      return targetPath
    } catch (error) {
      this.logger.error('文件保存失败: %s', error)
      throw handleError(error)
    }
  }

  private getFileDir(message: ChatMessage): string {
    const date = new Date(message.createTime * 1000)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return join(this.baseDir, String(year), month)
  }

  private getFileName(message: ChatMessage): string {
    const date = new Date(message.createTime * 1000)
    const timestamp = date.getTime()
    const extension = this.getFileExtension(message)
    return `${timestamp}_${message.msgId}${extension}`
  }

  private getFileExtension(message: ChatMessage): string {
    switch (message.type) {
      case MessageType.IMAGE:
        return '.jpg'
      case MessageType.VOICE:
        return '.silk'
      case MessageType.VIDEO:
        return '.mp4'
      case MessageType.FILE:
        return message.fileName ? `.${message.fileName.split('.').pop()}` : '.file'
      default:
        return '.file'
    }
  }
} 