<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import ExportSettings from './components/ExportSettings.vue'
import { useChatStore } from './stores/chat'
import { Search } from '@element-plus/icons-vue'

interface Message {
  id: number;
  talker: string;
  content: string;
  create_time: number;
  is_self: boolean;
  type: number;
}

interface Talker {
  name: string;
}

interface DateRange {
  start: string;
  end: string;
}

interface SearchParams {
  keyword: string;
  dateRange: DateRange;
  messageTypes: number[];
  talker: string;
}

const chatStore = useChatStore()
const showDatabaseSelect = ref(true)
const showWechatPathSelect = ref(false)
const selectedDbPath = ref('')

const searchKeyword = ref("");
const dateRange = ref<DateRange>({ start: "", end: "" });
const selectedTypes = ref<number[]>([]);
const selectedTalker = ref("");
const talkers = ref<string[]>([]);
const searchResults = ref<Message[]>([]);
const messages = ref<Message[]>([]);
const avatarUrls = ref<Record<string, string>>({});
const lastMessages = ref<Record<string, string>>({});

const searchParams = computed<SearchParams>(() => ({
  keyword: searchKeyword.value,
  dateRange: dateRange.value,
  messageTypes: selectedTypes.value,
  talker: selectedTalker.value
}));

const filteredMessages = computed(() => {
  if (!selectedTalker.value) return messages.value;
  return messages.value.filter((msg: Message) => msg.talker === selectedTalker.value);
});

async function selectDatabase() {
  try {
    const dbPath = await window.electron.ipcRenderer.invoke('select-file');
    if (dbPath) {
      selectedDbPath.value = dbPath;
      showDatabaseSelect.value = false;
      showWechatPathSelect.value = true;
    }
  } catch (error) {
    console.error('选择数据库失败：', error);
    chatStore.setError(error instanceof Error ? error.message : '选择数据库失败');
  }
}

async function selectWechatPath() {
  try {
    const wechatPath = await window.electron.ipcRenderer.invoke('select-wechat-path');
    if (wechatPath) {
      await window.electron.ipcRenderer.invoke('decrypt-database', { 
        dbPath: selectedDbPath.value,
        wechatPath 
      });
      showWechatPathSelect.value = false;
      await loadData();
    }
  } catch (error) {
    console.error('选择微信安装目录失败：', error);
    chatStore.setError(error instanceof Error ? error.message : '选择微信安装目录失败');
    showWechatPathSelect.value = false;
    showDatabaseSelect.value = true;
  }
}

async function loadData() {
  try {
    chatStore.setLoading(true)
    // Fetch talkers
    const talkersResponse = await window.electron.ipcRenderer.invoke("get-talkers");
    chatStore.setTalkers(talkersResponse.map((talker: Talker) => talker.name));
    
    // Load avatars and last messages for all talkers
    for (const talker of chatStore.talkers) {
      await loadAvatar(talker);
      await loadLastMessage(talker);
    }
  } catch (error) {
    chatStore.setError(error instanceof Error ? error.message : '加载数据失败')
  } finally {
    chatStore.setLoading(false)
  }
}

onMounted(() => {
  if (!showDatabaseSelect.value) {
    loadData();
  }
});

async function handleSearch() {
  try {
    const searchDateRange = dateRange.value.start && dateRange.value.end
      ? [dateRange.value.start, dateRange.value.end]
      : null;

    const result = await window.electron.ipcRenderer.invoke('search_messages', {
      keyword: searchKeyword.value,
      dateRange: searchDateRange,
      messageTypes: selectedTypes.value,
      talker: selectedTalker.value || null
    });

    searchResults.value = result;
    messages.value = result;
  } catch (error) {
    console.error('搜索失败：', error);
  }
}

function selectTalker(talker: string) {
  selectedTalker.value = talker;
}

async function loadAvatar(talker: string) {
  try {
    const avatarPath = await window.electron.ipcRenderer.invoke('get-avatar', { wxid: talker });
    if (avatarPath) {
      // TODO: 更新头像显示
    }
  } catch (error) {
    console.error('获取头像失败：', error);
  }
}

async function loadLastMessage(talker: string) {
  try {
    const messages = await window.electron.ipcRenderer.invoke('get-chat_history', {
      talker,
      page: 1,
      pageSize: 1
    });
    if (messages && messages.length > 0) {
      // TODO: 更新最后一条消息显示
    }
  } catch (error) {
    console.error('获取最后一条消息失败：', error);
  }
}

function getAvatarUrl(talker: string): string {
  return avatarUrls.value[talker] || '';
}

function getLastMessage(talker: string): string {
  return lastMessages.value[talker] || '';
}

function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
</script>

<template>
  <div class="app">
    <el-container v-if="showDatabaseSelect || showWechatPathSelect" class="setup-container">
      <el-card class="setup-card">
        <template #header>
          <h2>{{ showDatabaseSelect ? '选择微信数据库文件' : '选择微信安装目录' }}</h2>
        </template>
        <p>{{ showDatabaseSelect ? '请选择微信的数据库文件（通常位于：WeChat Files/All Users/Global/IM/Msg/）' : '请选择微信的安装目录（通常位于：C:\Program Files (x86)\Tencent\WeChat）' }}</p>
        <el-button type="primary" @click="showDatabaseSelect ? selectDatabase() : selectWechatPath()">
          {{ showDatabaseSelect ? '选择数据库文件' : '选择微信安装目录' }}
        </el-button>
      </el-card>
    </el-container>
    <el-container v-else class="main-container">
      <el-aside width="300px" class="sidebar">
        <el-card class="search-card">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索消息..."
            clearable
            @input="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </el-card>
        
        <el-card class="filter-card">
          <template #header>
            <h3>筛选条件</h3>
          </template>
          
          <el-form label-position="top">
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="handleSearch"
              />
            </el-form-item>
            
            <el-form-item label="消息类型">
              <el-checkbox-group v-model="selectedTypes" @change="handleSearch">
                <el-checkbox :label="1">文本</el-checkbox>
                <el-checkbox :label="3">图片</el-checkbox>
                <el-checkbox :label="34">语音</el-checkbox>
                <el-checkbox :label="43">视频</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item label="联系人">
              <el-select v-model="selectedTalker" placeholder="选择联系人" @change="handleSearch">
                <el-option label="全部" value="" />
                <el-option
                  v-for="talker in talkers"
                  :key="talker"
                  :label="talker"
                  :value="talker"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>
        
        <ExportSettings 
          :selected-talker="selectedTalker"
          :search-results="searchResults"
          :search-params="searchParams"
        />
      </el-aside>
      
      <el-container class="main-content">
        <el-aside width="250px" class="chat-list">
          <el-scrollbar>
            <div 
              v-for="talker in talkers" 
              :key="talker"
              class="chat-item"
              :class="{ active: selectedTalker === talker }"
              @click="selectTalker(talker)"
            >
              <el-avatar :src="getAvatarUrl(talker)" :size="40" />
              <div class="chat-info">
                <div class="name">{{ talker }}</div>
                <div class="last-message">{{ getLastMessage(talker) }}</div>
              </div>
            </div>
          </el-scrollbar>
        </el-aside>
        
        <el-main class="message-list">
          <el-scrollbar>
            <div 
              v-for="msg in filteredMessages" 
              :key="msg.id"
              class="message"
              :class="{ 'message-self': msg.is_self }"
            >
              <el-avatar :src="getAvatarUrl(msg.talker)" :size="40" />
              <div class="message-content">
                <div class="message-header">
                  <span class="sender">{{ msg.talker }}</span>
                  <span class="time">{{ formatTime(msg.create_time) }}</span>
                </div>
                <div class="message-body">
                  {{ msg.content }}
                </div>
              </div>
            </div>
          </el-scrollbar>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
.app {
  height: 100vh;
  width: 100vw;
}

.setup-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-bg-color-page);
}

.setup-card {
  width: 500px;
  text-align: center;
}

.setup-card :deep(.el-card__header) {
  padding: 20px;
}

.setup-card h2 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.setup-card p {
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}

.main-container {
  height: 100vh;
}

.sidebar {
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-card :deep(.el-card__header) {
  padding: 10px 0;
}

.filter-card h3 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.chat-list {
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.chat-item:hover {
  background-color: var(--el-fill-color-light);
}

.chat-item.active {
  background-color: var(--el-color-primary-light-9);
}

.chat-info {
  margin-left: 12px;
  flex: 1;
  overflow: hidden;
}

.name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.last-message {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-list {
  background-color: var(--el-bg-color-page);
  padding: 20px;
}

.message {
  display: flex;
  margin-bottom: 20px;
}

.message-self {
  flex-direction: row-reverse;
}

.message-content {
  margin-left: 12px;
  max-width: 70%;
}

.message-self .message-content {
  margin-left: 0;
  margin-right: 12px;
}

.message-header {
  margin-bottom: 4px;
}

.sender {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-right: 8px;
}

.time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.message-body {
  background-color: var(--el-bg-color);
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-self .message-body {
  background-color: var(--el-color-primary-light-9);
}

:deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}
</style>

<style>
:root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
}

/* 去除滚动条 */
::-webkit-scrollbar {
  display: none;
}

* {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

#app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
}
</style>