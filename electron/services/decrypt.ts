import { app } from 'electron'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { createHash, createDecipheriv } from 'crypto'
import { existsSync } from 'fs'
import { Logger } from '../utils/logger'
import { AppError, ErrorCodes, handleError } from '../utils/error'
import winreg from 'winreg'
import fs from 'fs'

export class Decryptor {
  private logger = Logger.getInstance()

  private async getWechatInstallPath(wechatPath: string): Promise<string> {
    this.logger.info('检查微信安装目录: %s', wechatPath)
    if (!existsSync(wechatPath)) {
      this.logger.error('微信安装目录不存在: %s', wechatPath)
      throw new AppError(
        '未找到微信安装目录',
        ErrorCodes.DECRYPT.INSTALL_PATH_NOT_FOUND,
        { wechatPath }
      )
    }

    // 检查是否是微信安装目录
    const wechatExe = join(wechatPath, 'WeChat.exe')
    if (!existsSync(wechatExe)) {
      this.logger.error('未找到WeChat.exe: %s', wechatExe)
      throw new AppError(
        '无效的微信安装目录',
        ErrorCodes.DECRYPT.INSTALL_PATH_NOT_FOUND,
        { wechatPath }
      )
    }

    this.logger.info('微信安装目录验证成功')
    return wechatPath
  }

  private async getDbPassPath(wechatPath: string): Promise<string> {
    try {
      const dbPassPath = join(wechatPath, 'DBPass.Bin')
      this.logger.info('检查DBPass.Bin文件: %s', dbPassPath)
      
      if (!existsSync(dbPassPath)) {
        this.logger.error('DBPass.Bin文件不存在: %s', dbPassPath)
        throw new AppError(
          '未找到DBPass.Bin文件',
          ErrorCodes.DECRYPT.DB_PASS_NOT_FOUND,
          { wechatPath }
        )
      }

      // 检查文件大小
      const stats = await fs.promises.stat(dbPassPath)
      if (stats.size === 0) {
        this.logger.error('DBPass.Bin文件为空')
        throw new AppError(
          'DBPass.Bin文件为空',
          ErrorCodes.DECRYPT.DB_PASS_NOT_FOUND,
          { wechatPath }
        )
      }
      
      this.logger.info('DBPass.Bin文件验证成功，大小: %d bytes', stats.size)
      return dbPassPath
    } catch (error) {
      this.logger.error('获取DBPass.Bin路径失败: %s', error)
      throw handleError(error)
    }
  }

  async decryptDatabase(dbPath: string, wechatPath: string): Promise<void> {
    try {
      this.logger.info('开始解密数据库: %s', dbPath)
      
      // 检查数据库文件是否存在
      if (!existsSync(dbPath)) {
        this.logger.error('数据库文件不存在: %s', dbPath)
        throw new AppError(
          '数据库文件不存在',
          ErrorCodes.DECRYPT.DB_NOT_FOUND,
          { dbPath }
        )
      }

      // 检查数据库文件大小
      const stats = await fs.promises.stat(dbPath)
      if (stats.size === 0) {
        this.logger.error('数据库文件为空')
        throw new AppError(
          '数据库文件为空',
          ErrorCodes.DECRYPT.INVALID_DATA,
          { dbPath }
        )
      }

      const wechatInstallPath = await this.getWechatInstallPath(wechatPath)
      this.logger.info('获取微信密钥...')
      const key = await this.getWechatKey(wechatInstallPath)
      this.logger.info('读取加密数据...')
      const encryptedData = await readFile(dbPath)
      this.logger.info('加密数据大小: %d bytes', encryptedData.length)
      
      if (encryptedData.length < 16) {
        this.logger.error('加密数据长度不足: %d bytes', encryptedData.length)
        throw new AppError(
          '加密数据长度不足',
          ErrorCodes.DECRYPT.INVALID_DATA,
          { dataLength: encryptedData.length }
        )
      }

      // 使用AES-256-CBC解密
      this.logger.info('开始解密...')
      const iv = encryptedData.slice(0, 16)
      const decipher = createDecipheriv('aes-256-cbc', key, iv)
      
      const decrypted = Buffer.concat([
        decipher.update(encryptedData.slice(16)),
        decipher.final()
      ])
      
      this.logger.info('解密完成，数据大小: %d bytes', decrypted.length)
      
      const decryptedPath = join(app.getPath('userData'), 'decrypted.db')
      this.logger.info('保存解密后的数据库: %s', decryptedPath)
      await writeFile(decryptedPath, decrypted)
      
      this.logger.info('数据库解密成功: %s', decryptedPath)
    } catch (error) {
      this.logger.error('数据库解密失败: %s', error)
      if (error instanceof Error) {
        this.logger.error('错误堆栈: %s', error.stack)
      }
      throw new AppError(
        '数据库解密失败',
        ErrorCodes.DECRYPT.DECRYPT_FAILED,
        { error, dbPath }
      )
    }
  }

  private async getWechatKey(wechatPath: string): Promise<Buffer> {
    try {
      this.logger.info('读取DBPass.Bin...')
      const dbPass = await this.readDbPass(wechatPath)
      this.logger.info('DBPass.Bin大小: %d bytes', dbPass.length)
      
      this.logger.info('生成密钥...')
      const key = createHash('sha256').update(dbPass).digest()
      this.logger.info('密钥生成成功，大小: %d bytes', key.length)
      
      return key
    } catch (error) {
      this.logger.error('获取微信密钥失败: %s', error)
      throw handleError(error)
    }
  }

  private async readDbPass(wechatPath: string): Promise<Buffer> {
    try {
      const dbPassPath = await this.getDbPassPath(wechatPath)
      this.logger.info('读取DBPass.Bin文件: %s', dbPassPath)
      const data = await readFile(dbPassPath)
      this.logger.info('DBPass.Bin读取成功，大小: %d bytes', data.length)
      return data
    } catch (error) {
      this.logger.error('读取DBPass.Bin失败: %s', error)
      throw handleError(error)
    }
  }
} 