import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { Database } from './services/database'
import { Exporter } from './services/exporter'
import { AvatarManager } from './services/avatar'
import { Decryptor } from './services/decrypt'
import { Logger } from './utils/logger'
import { mkdir } from 'fs/promises'
import { FileService } from './services/file'

// 获取当前文件的目录路径
const currentDir = dirname(fileURLToPath(import.meta.url))

// 禁用安全警告
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

// 确保只在一个进程中运行
if (process.type === 'renderer') {
  process.exit(0)
}

let mainWindow: BrowserWindow | null = null
let db: Database | null = null
let exporter: Exporter | null = null
let avatarManager: AvatarManager | null = null
let decryptor: Decryptor | null = null
let logger: Logger | null = null
let fileService: FileService | null = null

async function initLogger() {
  try {
    const userDataPath = app.getPath('userData')
    const logsPath = join(userDataPath, 'logs')
    await mkdir(logsPath, { recursive: true })
    logger = Logger.getInstance()
    return true
  } catch (err) {
    console.error('初始化日志失败:', err)
    return false
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: join(currentDir, 'preload.js')
    }
  })

  // 移除默认菜单
  const emptyMenu = Menu.buildFromTemplate([])
  Menu.setApplicationMenu(emptyMenu)

  // 加载应用
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(currentDir, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 初始化服务
function initServices() {
  avatarManager = new AvatarManager()
  decryptor = new Decryptor()
  fileService = new FileService()
}

// 注册IPC处理器
function registerIpcHandlers() {
  // 选择文件
  ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [{ name: '微信数据库', extensions: ['db'] }]
    })
    return result.filePaths[0]
  })

  // 选择微信安装目录
  ipcMain.handle('select-wechat-path', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: '选择微信安装目录',
      defaultPath: 'C:\\Program Files (x86)\\Tencent\\WeChat'
    })
    return result.filePaths[0]
  })

  // 解密数据库
  ipcMain.handle('decrypt-database', async (_, params) => {
    try {
      if (!decryptor) {
        throw new Error('解密服务未初始化')
      }
      const { dbPath, wechatPath } = params
      await decryptor.decryptDatabase(dbPath, wechatPath)
      const decryptedPath = join(app.getPath('userData'), 'decrypted.db')
      
      // 初始化数据库服务
      db = new Database()
      await db.init(decryptedPath)
      exporter = new Exporter(db)
      
      logger?.info('数据库初始化成功')
    } catch (error) {
      logger?.error('数据库初始化失败: %s', error)
      throw error
    }
  })

  // 获取联系人列表
  ipcMain.handle('get-talkers', async () => {
    if (!db) {
      throw new Error('数据库未初始化')
    }
    return db.getAllTalkers()
  })

  // 获取聊天记录
  ipcMain.handle('get-chat-history', async (_, params) => {
    if (!db) {
      throw new Error('数据库未初始化')
    }
    const { talker, page, pageSize } = params
    return db.getChatHistory(talker, page, pageSize)
  })

  // 搜索消息
  ipcMain.handle('search-messages', async (_, params) => {
    if (!db) {
      throw new Error('数据库未初始化')
    }
    const { keyword, dateRange, messageTypes, talker } = params
    return db.searchMessages(keyword, dateRange, messageTypes, talker)
  })

  // 获取头像
  ipcMain.handle('get-avatar', async (_, params) => {
    if (!avatarManager) {
      throw new Error('头像服务未初始化')
    }
    const { wxid } = params
    return avatarManager.getAvatar(wxid)
  })

  // 测试问候
  ipcMain.handle('greet', async (_, name) => {
    return `Hello ${name}!`
  })

  // 保存文件
  ipcMain.handle('save-file', async (_, message) => {
    if (!fileService) {
      throw new Error('文件服务未初始化')
    }
    return fileService.saveFile(message)
  })

  // 获取群组信息
  ipcMain.handle('get-group-info', async (_, groupId) => {
    if (!db) {
      throw new Error('数据库未初始化')
    }
    return db.getGroupInfo(groupId)
  })

  // 获取群成员列表
  ipcMain.handle('get-group-members', async (_, groupId) => {
    if (!db) {
      throw new Error('数据库未初始化')
    }
    return db.getGroupMembers(groupId)
  })

  // 获取群聊历史
  ipcMain.handle('get-group-chat-history', async (_, params) => {
    if (!db) {
      throw new Error('数据库未初始化')
    }
    const { groupId, page, pageSize } = params
    return db.getGroupChatHistory(groupId, page, pageSize)
  })
}

async function initializeApp() {
  const loggerInitialized = await initLogger()
  if (!loggerInitialized) {
    console.error('无法初始化日志系统，应用将退出')
    app.quit()
    return
  }

  initServices()
  if (fileService) {
    await fileService.init()
  }
  createWindow()
  registerIpcHandlers()
}

app.whenReady().then(initializeApp)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
}) 