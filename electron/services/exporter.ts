import { app } from 'electron'
import { join } from 'path'
import { Database, ChatMessage } from './database'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { Logger } from '../utils/logger'
import { AppError, ErrorCodes, handleError } from '../utils/error'

export class Exporter {
  private logger = Logger.getInstance()

  constructor(private db: Database) {}

  async exportChatHistory(talker: string, format: string): Promise<string> {
    try {
      const messages = await this.db.getChatHistory(talker, 1, 1000)
      const exportDir = join(app.getPath('downloads'), 'chatview-tools')
      
      if (!existsSync(exportDir)) {
        await mkdir(exportDir, { recursive: true })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `chat_history_${talker}_${timestamp}`

      let filepath: string
      switch (format) {
        case 'json':
          filepath = await this.exportJson(exportDir, filename, messages)
          break
        case 'csv':
          filepath = await this.exportCsv(exportDir, filename, messages)
          break
        case 'txt':
          filepath = await this.exportTxt(exportDir, filename, messages)
          break
        case 'html':
          filepath = await this.exportHtml(exportDir, filename, messages)
          break
        default:
          throw new AppError(
            `不支持的导出格式：${format}`,
            ErrorCodes.EXPORT.INVALID_FORMAT
          )
      }

      this.logger.info('聊天记录导出成功: %s', filepath)
      return filepath
    } catch (error) {
      this.logger.error('聊天记录导出失败: %s', error)
      throw handleError(error)
    }
  }

  async exportSearchResults(
    keyword: string,
    dateRange?: [number, number],
    messageTypes?: number[],
    talker?: string,
    format: string = 'json'
  ): Promise<string> {
    try {
      const messages = await this.db.searchMessages(keyword, dateRange, messageTypes, talker)
      const exportDir = join(app.getPath('downloads'), 'chatview-tools')
      
      if (!existsSync(exportDir)) {
        await mkdir(exportDir, { recursive: true })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `search_results_${timestamp}`

      let filepath: string
      switch (format) {
        case 'json':
          filepath = await this.exportJson(exportDir, filename, messages)
          break
        case 'csv':
          filepath = await this.exportCsv(exportDir, filename, messages)
          break
        case 'txt':
          filepath = await this.exportTxt(exportDir, filename, messages)
          break
        case 'html':
          filepath = await this.exportHtml(exportDir, filename, messages)
          break
        default:
          throw new AppError(
            `不支持的导出格式：${format}`,
            ErrorCodes.EXPORT.INVALID_FORMAT
          )
      }

      this.logger.info('搜索结果导出成功: %s', filepath)
      return filepath
    } catch (error) {
      this.logger.error('搜索结果导出失败: %s', error)
      throw handleError(error)
    }
  }

  private async exportJson(dir: string, filename: string, messages: ChatMessage[]): Promise<string> {
    try {
      const filepath = join(dir, `${filename}.json`)
      const exportData = {
        messages,
        exportTime: new Date().toISOString(),
        messageCount: messages.length
      }
      await writeFile(filepath, JSON.stringify(exportData, null, 2))
      return filepath
    } catch (error) {
      throw new AppError(
        '导出JSON文件失败',
        ErrorCodes.EXPORT.WRITE_FILE_FAILED,
        { error }
      )
    }
  }

  private async exportCsv(dir: string, filename: string, messages: ChatMessage[]): Promise<string> {
    try {
      const filepath = join(dir, `${filename}.csv`)
      const headers = ['时间', '发送者', '消息类型', '内容']
      const rows = messages.map(msg => [
        new Date(msg.createTime * 1000).toLocaleString('zh-CN'),
        msg.talker,
        msg.type,
        msg.content
      ])
      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')
      await writeFile(filepath, csv)
      return filepath
    } catch (error) {
      throw new AppError(
        '导出CSV文件失败',
        ErrorCodes.EXPORT.WRITE_FILE_FAILED,
        { error }
      )
    }
  }

  private async exportTxt(dir: string, filename: string, messages: ChatMessage[]): Promise<string> {
    try {
      const filepath = join(dir, `${filename}.txt`)
      let content = `聊天记录导出时间：${new Date().toLocaleString('zh-CN')}\n`
      content += `消息数量：${messages.length}\n\n`
      
      content += messages.map(msg => 
        `[${new Date(msg.createTime * 1000).toLocaleString('zh-CN')}] ${msg.talker}: ${msg.content}`
      ).join('\n')

      await writeFile(filepath, content)
      return filepath
    } catch (error) {
      throw new AppError(
        '导出TXT文件失败',
        ErrorCodes.EXPORT.WRITE_FILE_FAILED,
        { error }
      )
    }
  }

  private async exportHtml(dir: string, filename: string, messages: ChatMessage[]): Promise<string> {
    try {
      const filepath = join(dir, `${filename}.html`)
      const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>聊天记录导出</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { margin-bottom: 20px; }
        .message { margin-bottom: 10px; padding: 10px; border-bottom: 1px solid #eee; }
        .time { color: #999; font-size: 0.9em; }
        .sender { font-weight: bold; margin-right: 10px; }
        .content { margin-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>聊天记录导出</h1>
        <p>导出时间：${new Date().toLocaleString('zh-CN')}</p>
        <p>消息数量：${messages.length}</p>
    </div>
    <div class="messages">
        ${messages.map(msg => `
        <div class="message">
            <div class="time">${new Date(msg.createTime * 1000).toLocaleString('zh-CN')}</div>
            <div class="sender">${msg.talker}</div>
            <div class="content">${msg.content}</div>
        </div>
        `).join('')}
    </div>
</body>
</html>`

      await writeFile(filepath, html)
      return filepath
    } catch (error) {
      throw new AppError(
        '导出HTML文件失败',
        ErrorCodes.EXPORT.WRITE_FILE_FAILED,
        { error }
      )
    }
  }
} 