import { ipcRenderer } from 'electron'

export const ipc = {
  // 文件选择
  selectFile: () => ipcRenderer.invoke('select-file'),

  // 数据库操作
  decryptDatabase: (dbPath: string) => ipcRenderer.invoke('decrypt-database', dbPath),
  getAllTalkers: () => ipcRenderer.invoke('get-all-talkers'),
  getChatHistory: (talker: string, page: number, pageSize: number) => 
    ipcRenderer.invoke('get-chat-history', talker, page, pageSize),
  searchMessages: (keyword: string, dateRange?: [number, number], messageTypes?: number[], talker?: string) =>
    ipcRenderer.invoke('search-messages', keyword, dateRange, messageTypes, talker),

  // 导出功能
  exportChatHistory: (talker: string, format: string) =>
    ipcRenderer.invoke('export-chat-history', talker, format),
  exportSearchResults: (keyword: string, dateRange?: [number, number], messageTypes?: number[], talker?: string, format: string = 'json') =>
    ipcRenderer.invoke('export-search-results', keyword, dateRange, messageTypes, talker, format),

  // 头像管理
  getAvatar: (wxid: string) => ipcRenderer.invoke('get-avatar', wxid)
} 