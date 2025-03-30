export const ipc = {
  // 选择文件
  selectFile: () => window.electron.ipcRenderer.invoke('select-file'),

  // 选择微信安装目录
  selectWechatPath: () => window.electron.ipcRenderer.invoke('select-wechat-path'),

  // 解密数据库
  decryptDatabase: (params: { dbPath: string; wechatPath: string }) => 
    window.electron.ipcRenderer.invoke('decrypt-database', params),

  // 获取联系人列表
  getTalkers: () => window.electron.ipcRenderer.invoke('get-talkers'),

  // 获取聊天记录
  getChatHistory: (params: { talker: string; page: number; pageSize: number }) =>
    window.electron.ipcRenderer.invoke('get-chat-history', params),

  // 搜索消息
  searchMessages: (params: { 
    keyword: string; 
    dateRange?: [number, number]; 
    messageTypes?: number[]; 
    talker?: string 
  }) => window.electron.ipcRenderer.invoke('search-messages', params),

  // 获取头像
  getAvatar: (params: { wxid: string }) => 
    window.electron.ipcRenderer.invoke('get-avatar', params),

  // 保存文件
  saveFile: (message: any) => 
    window.electron.ipcRenderer.invoke('save-file', message),

  // 获取群组信息
  getGroupInfo: (groupId: string) => 
    window.electron.ipcRenderer.invoke('get-group-info', groupId),

  // 获取群成员列表
  getGroupMembers: (groupId: string) => 
    window.electron.ipcRenderer.invoke('get-group-members', groupId),

  // 获取群聊历史
  getGroupChatHistory: (params: { 
    groupId: string; 
    page: number; 
    pageSize: number 
  }) => window.electron.ipcRenderer.invoke('get-group-chat-history', params)
} 