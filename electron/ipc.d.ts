import { ChatMessage, ChatStats } from './services/database'

export interface IpcChannels {
  'get-talkers': () => Promise<{ name: string }[]>
  'get-chat-history': (params: { talker: string; page: number; pageSize: number }) => Promise<ChatMessage[]>
  'search-messages': (params: { keyword: string; dateRange?: [number, number]; messageTypes?: number[]; talker?: string }) => Promise<ChatMessage[]>
  'get-chat-statistics': () => Promise<ChatStats>
  'get-avatar': (params: { wxid: string }) => Promise<string>
  'export-chat-history': (params: { talker: string; format: string }) => Promise<string>
  'export-search-results': (params: { keyword: string; dateRange?: [number, number]; messageTypes?: number[]; talker?: string; format: string }) => Promise<string>
  'decrypt-database': (params: { dbPath: string }) => Promise<void>
  'greet': (name: string) => Promise<string>
} 