import { app } from 'electron'
import { join } from 'path'
import { mkdir, writeFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { createHash } from 'crypto'
import fetch from 'node-fetch'
import { Logger } from '../utils/logger'
import { AppError, ErrorCodes, handleError } from '../utils/error'

export class AvatarManager {
  private cacheDir: string
  private logger = Logger.getInstance()

  constructor() {
    this.cacheDir = join(app.getPath('userData'), 'avatars')
  }

  async init() {
    try {
      if (!existsSync(this.cacheDir)) {
        await mkdir(this.cacheDir, { recursive: true })
        this.logger.info('头像缓存目录创建成功: %s', this.cacheDir)
      }
    } catch (error) {
      this.logger.error('创建头像缓存目录失败: %s', error)
      throw new AppError(
        '创建头像缓存目录失败',
        ErrorCodes.AVATAR.SAVE_FAILED,
        { error }
      )
    }
  }

  async getAvatar(wxid: string): Promise<string> {
    try {
      const avatarPath = this.getAvatarPath(wxid)
      
      if (existsSync(avatarPath)) {
        this.logger.debug('使用缓存的头像: %s', avatarPath)
        return avatarPath
      }

      this.logger.info('开始下载头像: %s', wxid)
      const avatarUrl = `https://wx.qlogo.cn/mmhead/${wxid}/132`
      const response = await fetch(avatarUrl)
      
      if (!response.ok) {
        throw new Error(`下载头像失败: ${response.status} ${response.statusText}`)
      }
      
      const buffer = await response.buffer()
      await writeFile(avatarPath, buffer)
      
      this.logger.info('头像下载成功: %s', avatarPath)
      return avatarPath
    } catch (error) {
      this.logger.error('获取头像失败: %s', error)
      throw new AppError(
        '获取头像失败',
        ErrorCodes.AVATAR.DOWNLOAD_FAILED,
        { error, wxid }
      )
    }
  }

  async clearCache() {
    try {
      if (existsSync(this.cacheDir)) {
        await mkdir(this.cacheDir, { recursive: true })
        this.logger.info('头像缓存已清除')
      }
    } catch (error) {
      this.logger.error('清除头像缓存失败: %s', error)
      throw new AppError(
        '清除头像缓存失败',
        ErrorCodes.AVATAR.SAVE_FAILED,
        { error }
      )
    }
  }

  private getAvatarPath(wxid: string): string {
    const hash = createHash('sha256').update(wxid).digest('hex')
    return join(this.cacheDir, `${hash}.jpg`)
  }
} 