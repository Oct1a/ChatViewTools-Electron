<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ElAvatar } from 'element-plus'
import { Download, Export } from '@element-plus/icons-vue'
import { ipc } from '../services/ipc'

interface ChatMessage {
  msg_id: number
  talker: string
  content: string
  create_time: number
  type: number
  avatar?: string
}

const messages = ref<ChatMessage[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const talker = ref('')
const total = ref(0)

const loadMessages = async () => {
  if (!talker.value) return
  
  loading.value = true
  try {
    const result = await ipc.getChatHistory(talker.value, currentPage.value, pageSize.value)
    messages.value = result.messages
    total.value = result.total
  } catch (error) {
    ElMessage.error('加载聊天记录失败：' + error)
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadMessages()
}

const handleExport = async () => {
  try {
    await ipc.exportChatHistory(talker.value, 'json')
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败：' + error)
  }
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString()
}

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  talker.value = params.get('talker') || ''
  if (talker.value) {
    loadMessages()
  }
})
</script>

<template>
  <div class="chat-container">
    <div class="chat-header">
      <h2>{{ talker }}</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <div class="chat-messages" v-loading="loading">
      <div v-for="msg in messages" :key="msg.msg_id" class="message">
        <div class="message-header">
          <el-avatar :size="40" :src="msg.avatar" />
          <span class="talker">{{ msg.talker }}</span>
          <span class="time">{{ formatTime(msg.create_time) }}</span>
        </div>
        <div class="message-content">{{ msg.content }}</div>
      </div>
    </div>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
        layout="prev, pager, next"
      />
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.message {
  margin-bottom: 20px;
  padding: 10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.talker {
  margin: 0 10px;
  font-weight: bold;
}

.time {
  color: #999;
  font-size: 0.9em;
}

.message-content {
  margin-left: 50px;
  line-height: 1.5;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style> 