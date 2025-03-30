import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { app } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { Logger } from '../utils/logger'
import { AppError, ErrorCodes, handleError } from '../utils/error'
import { CacheService } from './cache'

export interface ChatMessage {
  msgId: number
  talker: string
  content: string
  createTime: number
  type: number
  avatar?: string
  filePath?: string
  fileName?: string
  fileSize?: number
  duration?: number
  width?: number
  height?: number
  isGroupMessage?: boolean
  sender?: string
  groupName?: string
}

export interface ChatStats {
  totalMessages: number
  totalTalkers: number
  messageTypes: MessageTypeStats[]
  dailyMessages: DailyStats[]
  topTalkers: TalkerStats[]
}

export interface MessageTypeStats {
  type: number
  count: number
}

export interface DailyStats {
  date: string
  count: number
}

export interface TalkerStats {
  talker: string
  count: number
}

export interface GroupMember {
  wxid: string
  nickname: string
  avatar?: string
  joinTime: number
  role: number
}

export interface GroupInfo {
  wxid: string
  name: string
  avatar?: string
  owner: string
  createTime: number
  memberCount: number
  members: GroupMember[]
}

export enum MessageType {
  TEXT = 1,
  IMAGE = 3,
  VOICE = 34,
  VIDEO = 43,
  FILE = 49,
  LINK = 49,
  SYSTEM = 10000,
  GROUP_SYSTEM = 10002
}

export class Database {
  private db: any = null
  private logger = Logger.getInstance()
  private cache: CacheService

  constructor() {
    this.cache = new CacheService()
  }

  async init(dbPath: string) {
    try {
      if (!existsSync(dbPath)) {
        throw new AppError(
          '数据库文件不存在',
          ErrorCodes.DATABASE.NOT_FOUND,
          { dbPath }
        )
      }

      this.db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      })

      this.logger.info('数据库初始化成功: %s', dbPath)
    } catch (error) {
      this.logger.error('数据库初始化失败: %s', error)
      throw handleError(error)
    }
  }

  async getAllTalkers(): Promise<string[]> {
    try {
      const result = await this.db.all('SELECT DISTINCT talker FROM message ORDER BY talker')
      return result.map((row: any) => row.talker)
    } catch (error) {
      this.logger.error('获取联系人列表失败: %s', error)
      throw new AppError(
        '获取联系人列表失败',
        ErrorCodes.DATABASE.QUERY_FAILED,
        { error }
      )
    }
  }

  async getChatHistory(talker: string, page: number, pageSize: number): Promise<ChatMessage[]> {
    try {
      const cacheKey = `chat_history_${talker}_${page}_${pageSize}`
      const cachedMessages = this.cache.getMessage(cacheKey)
      if (cachedMessages) {
        return cachedMessages
      }

      const offset = (page - 1) * pageSize
      const result = await this.db.all(
        `SELECT 
          m.msgId, 
          m.talker, 
          m.content, 
          m.createTime, 
          m.type,
          m.filePath,
          m.fileName,
          m.fileSize,
          m.duration,
          m.width,
          m.height,
          m.isGroupMessage,
          m.sender,
          m.groupName
        FROM message m
        WHERE m.talker = ? 
        ORDER BY m.createTime DESC 
        LIMIT ? OFFSET ?`,
        [talker, pageSize, offset]
      )
      const messages = result.map(this.mapRowToMessage)
      this.cache.setMessage(cacheKey, messages)
      return messages
    } catch (error) {
      this.logger.error('获取聊天历史失败: %s', error)
      throw new AppError(
        '获取聊天历史失败',
        ErrorCodes.DATABASE.QUERY_FAILED,
        { error, talker, page, pageSize }
      )
    }
  }

  async searchMessages(
    keyword: string,
    dateRange?: [number, number],
    messageTypes?: number[],
    talker?: string
  ): Promise<ChatMessage[]> {
    try {
      let conditions = ['content LIKE ?']
      let params = [`%${keyword}%`]

      if (dateRange) {
        conditions.push('createTime BETWEEN ? AND ?')
        params.push(dateRange[0].toString(), dateRange[1].toString())
      }

      if (messageTypes && messageTypes.length > 0) {
        const placeholders = messageTypes.map(() => '?').join(',')
        conditions.push(`type IN (${placeholders})`)
        params.push(...messageTypes.map(type => type.toString()))
      }

      if (talker) {
        conditions.push('talker = ?')
        params.push(talker)
      }

      const whereClause = conditions.join(' AND ')
      const query = `SELECT msgId, talker, content, createTime, type FROM message WHERE ${whereClause} ORDER BY createTime DESC LIMIT 100`

      const result = await this.db.all(query, params)
      return result.map(this.mapRowToMessage)
    } catch (error) {
      this.logger.error('搜索消息失败: %s', error)
      throw new AppError(
        '搜索消息失败',
        ErrorCodes.DATABASE.QUERY_FAILED,
        { error, keyword, dateRange, messageTypes, talker }
      )
    }
  }

  async getChatStatistics(): Promise<ChatStats> {
    try {
      // 获取总消息数和联系人数量
      const totalMessages = await this.db.get('SELECT COUNT(*) as count FROM message')
      const totalTalkers = await this.db.get('SELECT COUNT(DISTINCT talker) as count FROM message')

      // 获取消息类型统计
      const messageTypes = await this.db.all(
        'SELECT type, COUNT(*) as count FROM message GROUP BY type ORDER BY count DESC'
      )

      // 获取每日消息统计
      const dailyMessages = await this.db.all(
        "SELECT date(createTime, 'unixepoch') as date, COUNT(*) as count FROM message GROUP BY date ORDER BY date DESC LIMIT 30"
      )

      // 获取最活跃联系人
      const topTalkers = await this.db.all(
        'SELECT talker, COUNT(*) as count FROM message GROUP BY talker ORDER BY count DESC LIMIT 10'
      )

      return {
        totalMessages: totalMessages.count,
        totalTalkers: totalTalkers.count,
        messageTypes: messageTypes.map((row: any) => ({
          type: row.type,
          count: row.count
        })),
        dailyMessages: dailyMessages.map((row: any) => ({
          date: row.date,
          count: row.count
        })),
        topTalkers: topTalkers.map((row: any) => ({
          talker: row.talker,
          count: row.count
        }))
      }
    } catch (error) {
      this.logger.error('获取聊天统计失败: %s', error)
      throw new AppError(
        '获取聊天统计失败',
        ErrorCodes.DATABASE.QUERY_FAILED,
        { error }
      )
    }
  }

  async getGroupInfo(groupId: string): Promise<GroupInfo> {
    try {
      const result = await this.db.get(
        `SELECT 
          g.wxid,
          g.name,
          g.avatar,
          g.owner,
          g.createTime,
          COUNT(gm.wxid) as memberCount
        FROM group_info g
        LEFT JOIN group_member gm ON g.wxid = gm.groupId
        WHERE g.wxid = ?
        GROUP BY g.wxid`,
        [groupId]
      )

      if (!result) {
        throw new AppError(
          '群组不存在',
          ErrorCodes.DATABASE.NOT_FOUND,
          { groupId }
        )
      }

      const members = await this.getGroupMembers(groupId)
      return {
        ...result,
        members
      }
    } catch (error) {
      this.logger.error('获取群组信息失败: %s', error)
      throw new AppError(
        '获取群组信息失败',
        ErrorCodes.DATABASE.QUERY_FAILED,
        { error, groupId }
      )
    }
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const result = await this.db.all(
        `SELECT 
          wxid,
          nickname,
          avatar,
          joinTime,
          role
        FROM group_member
        WHERE groupId = ?
        ORDER BY joinTime DESC`,
        [groupId]
      )
      return result
    } catch (error) {
      this.logger.error('获取群成员列表失败: %s', error)
      throw new AppError(
        '获取群成员列表失败',
        ErrorCodes.DATABASE.QUERY_FAILED,
        { error, groupId }
      )
    }
  }

  async getGroupChatHistory(groupId: string, page: number, pageSize: number): Promise<ChatMessage[]> {
    try {
      const cacheKey = `group_chat_history_${groupId}_${page}_${pageSize}`
      const cachedMessages = this.cache.getMessage(cacheKey)
      if (cachedMessages) {
        return cachedMessages
      }

      const offset = (page - 1) * pageSize
      const result = await this.db.all(
        `SELECT 
          m.msgId, 
          m.talker, 
          m.content, 
          m.createTime, 
          m.type,
          m.filePath,
          m.fileName,
          m.fileSize,
          m.duration,
          m.width,
          m.height,
          m.isGroupMessage,
          m.sender,
          m.groupName
        FROM message m
        WHERE m.talker = ? AND m.isGroupMessage = 1
        ORDER BY m.createTime DESC 
        LIMIT ? OFFSET ?`,
        [groupId, pageSize, offset]
      )
      const messages = result.map(this.mapRowToMessage)
      this.cache.setMessage(cacheKey, messages)
      return messages
    } catch (error) {
      this.logger.error('获取群聊历史失败: %s', error)
      throw new AppError(
        '获取群聊历史失败',
        ErrorCodes.DATABASE.QUERY_FAILED,
        { error, groupId, page, pageSize }
      )
    }
  }

  private mapRowToMessage(row: any): ChatMessage {
    return {
      msgId: row.msgId,
      talker: row.talker,
      content: row.content,
      createTime: row.createTime,
      type: row.type,
      filePath: row.filePath,
      fileName: row.fileName,
      fileSize: row.fileSize,
      duration: row.duration,
      width: row.width,
      height: row.height,
      isGroupMessage: row.isGroupMessage === 1,
      sender: row.sender,
      groupName: row.groupName
    }
  }
} 