/// <reference types="vite/client" />
/// <reference types="electron" />
import { IpcChannels } from './electron/ipc'

interface ImportMetaEnv {
  readonly VITE_DEV_SERVER_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  electron: {
    ipcRenderer: {
      invoke<T = any>(channel: string, ...args: any[]): Promise<T>
    }
  }
} 