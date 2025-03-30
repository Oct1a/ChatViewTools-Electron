const { contextBridge, ipcRenderer } = require('electron')

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => {
      // 白名单通道
      const validChannels = [
        'select-file',
        'select-wechat-path',
        'decrypt-database',
        'get-talkers',
        'get-chat-history',
        'search-messages',
        'get-avatar',
        'greet',
        'save-file',
        'get-group-info',
        'get-group-members',
        'get-group-chat-history'
      ]
      
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args)
      }
      throw new Error(`不允许的 IPC 通道: ${channel}`)
    }
  }
}) 