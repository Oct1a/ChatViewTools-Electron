<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Filter, Download } from '@element-plus/icons-vue'
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
const loading = ref(false)
const keyword = ref('')
const dateRange = ref<[Date, Date] | null>(null)
const messageTypes = ref<number[]>([])
const talkers = ref<string[]>([])
const selectedTalker = ref('')

const messageTypeOptions = [
  { label: '文本消息', value: 1 },
  { label: '图片消息', value: 3 },
  { label: '语音消息', value: 34 },
  { label: '视频消息', value: 43 },
  { label: '文件消息', value: 49 },
  { label: '链接消息', value: 50 }
]

const loadTalkers = async () => {
  try {
    const result = await ipc.getAllTalkers()
    talkers.value = result
  } catch (error) {
    ElMessage.error('加载联系人列表失败：' + error)
  }
}

const handleSearch = async () => {
  if (!keyword.value) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  
  loading.value = true
  try {
    const result = await ipc.searchMessages(
      keyword.value,
      dateRange.value ? [
        Math.floor(dateRange.value[0].getTime() / 1000),
        Math.floor(dateRange.value[1].getTime() / 1000)
      ] : undefined,
      messageTypes.value,
      selectedTalker.value
    )
    
    messages.value = result
  } catch (error) {
    ElMessage.error('搜索失败：' + error)
  } finally {
    loading.value = false
  }
}

const handleExport = async () => {
  try {
    await ipc.exportSearchResults(
      keyword.value,
      dateRange.value ? [
        Math.floor(dateRange.value[0].getTime() / 1000),
        Math.floor(dateRange.value[1].getTime() / 1000)
      ] : undefined,
      messageTypes.value,
      selectedTalker.value
    )
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败：' + error)
  }
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString()
}

onMounted(() => {
  loadTalkers()
})
</script>

<template>
  <div class="search-container">
    <div class="search-header">
      <h2>消息搜索</h2>
      <el-button type="primary" @click="handleExport" :disabled="!messages.length">
        <el-icon><Download /></el-icon>
        导出搜索结果
      </el-button>
    </div>

    <div class="search-form">
      <el-form :inline="true">
        <el-form-item label="关键词">
          <el-input v-model="keyword" placeholder="请输入搜索关键词" />
        </el-form-item>

        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>

        <el-form-item label="消息类型">
          <el-select v-model="messageTypes" multiple placeholder="请选择消息类型">
            <el-option
              v-for="option in messageTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="联系人">
          <el-select v-model="selectedTalker" placeholder="请选择联系人">
            <el-option
              v-for="talker in talkers"
              :key="talker"
              :label="talker"
              :value="talker"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="search-results" v-loading="loading">
      <div v-for="msg in messages" :key="msg.msg_id" class="message">
        <div class="message-header">
          <span class="talker">{{ msg.talker }}</span>
          <span class="time">{{ formatTime(msg.create_time) }}</span>
        </div>
        <div class="message-content">{{ msg.content }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.search-results {
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.talker {
  font-weight: bold;
}

.time {
  color: #999;
  font-size: 0.9em;
}

.message-content {
  line-height: 1.5;
}
</style> 