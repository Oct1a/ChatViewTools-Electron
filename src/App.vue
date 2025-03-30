<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import ExportSettings from './components/ExportSettings.vue'
import { useChatStore } from './stores/chat'

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

const searchParams = computed(() => ({
  keyword: searchKeyword.value,
  dateRange: dateRange.value,
  messageTypes: selectedTypes.value,
  talker: selectedTalker.value
}));

const filteredMessages = computed(() => {
  if (!selectedTalker.value) return messages.value;
  return messages.value.filter(msg => msg.talker === selectedTalker.value);
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
    <div v-if="showDatabaseSelect" class="database-select">
      <h2>选择微信数据库文件</h2>
      <p>请选择微信的数据库文件（通常位于：WeChat Files/All Users/Global/IM/Msg/）</p>
      <button @click="selectDatabase">选择数据库文件</button>
    </div>
    <div v-else-if="showWechatPathSelect" class="database-select">
      <h2>选择微信安装目录</h2>
      <p>请选择微信的安装目录（通常位于：C:\Program Files (x86)\Tencent\WeChat）</p>
      <button @click="selectWechatPath">选择微信安装目录</button>
    </div>
    <div v-else>
      <div class="sidebar">
        <div class="search-box">
          <input 
            v-model="searchKeyword" 
            type="text" 
            placeholder="搜索消息..."
            @input="handleSearch"
          >
          <button @click="handleSearch">搜索</button>
        </div>
        
        <div class="filter-section">
          <h3>筛选条件</h3>
          <div class="date-range">
            <label>日期范围：</label>
            <input 
              type="date" 
              v-model="dateRange.start"
              @change="handleSearch"
            >
            <span>至</span>
            <input 
              type="date" 
              v-model="dateRange.end"
              @change="handleSearch"
            >
          </div>
          
          <div class="message-types">
            <label>消息类型：</label>
            <div class="type-options">
              <label>
                <input 
                  type="checkbox" 
                  v-model="selectedTypes" 
                  :value="1"
                > 文本
              </label>
              <label>
                <input 
                  type="checkbox" 
                  v-model="selectedTypes" 
                  :value="3"
                > 图片
              </label>
              <label>
                <input 
                  type="checkbox" 
                  v-model="selectedTypes" 
                  :value="34"
                > 语音
              </label>
              <label>
                <input 
                  type="checkbox" 
                  v-model="selectedTypes" 
                  :value="43"
                > 视频
              </label>
            </div>
          </div>
          
          <div class="talker-select">
            <label>联系人：</label>
            <select v-model="selectedTalker" @change="handleSearch">
              <option value="">全部</option>
              <option 
                v-for="talker in talkers" 
                :key="talker" 
                :value="talker"
              >
                {{ talker }}
              </option>
            </select>
          </div>
        </div>
        
        <ExportSettings 
          :selected-talker="selectedTalker"
          :search-results="searchResults"
          :search-params="searchParams"
        />
      </div>
      
      <div class="main-content">
        <div class="chat-list">
          <div 
            v-for="talker in talkers" 
            :key="talker"
            class="chat-item"
            :class="{ active: selectedTalker === talker }"
            @click="selectTalker(talker)"
          >
            <img 
              :src="getAvatarUrl(talker)" 
              :alt="talker"
              class="avatar"
            >
            <div class="chat-info">
              <div class="name">{{ talker }}</div>
              <div class="last-message">{{ getLastMessage(talker) }}</div>
            </div>
          </div>
        </div>
        
        <div class="message-list">
          <div 
            v-for="msg in filteredMessages" 
            :key="msg.id"
            class="message"
            :class="{ 'message-self': msg.is_self }"
          >
            <img 
              :src="getAvatarUrl(msg.talker)" 
              :alt="msg.talker"
              class="avatar"
            >
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
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.logo.vite:hover {
  filter: drop-shadow(0 0 2em #747bff);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #249b73);
}

.filter-section {
  margin: 20px 0;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.date-range {
  margin: 10px 0;
}

.date-range input {
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.message-types {
  margin: 10px 0;
}

.type-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 5px;
}

.talker-select {
  margin: 10px 0;
}

.talker-select select {
  width: 100%;
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.database-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 20px;
  text-align: center;
}

.database-select h2 {
  margin-bottom: 20px;
}

.database-select p {
  margin-bottom: 30px;
  color: #666;
}

.database-select button {
  padding: 12px 24px;
  font-size: 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.database-select button:hover {
  background-color: #45a049;
}
</style>
<style>
:root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;

  color: #0f0f0f;
  background-color: #f6f6f6;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

/* 去除滚动条 */
::-webkit-scrollbar {
  display: none;
}

* {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.container {
  margin: 0;
  padding-top: 10vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: 0.75s;
}

.logo.tauri:hover {
  filter: drop-shadow(0 0 2em #24c8db);
}

.row {
  display: flex;
  justify-content: center;
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}

a:hover {
  color: #535bf2;
}

h1 {
  text-align: center;
}

input,
button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  color: #0f0f0f;
  background-color: #ffffff;
  transition: border-color 0.25s;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.2);
}

button {
  cursor: pointer;
}

button:hover {
  border-color: #396cd8;
}
button:active {
  border-color: #396cd8;
  background-color: #e8e8e8;
}

input,
button {
  outline: none;
}

#greet-input {
  margin-right: 5px;
}

@media (prefers-color-scheme: dark) {
  :root {
    color: #f6f6f6;
    background-color: #2f2f2f;
  }

  a:hover {
    color: #24c8db;
  }

  input,
  button {
    color: #ffffff;
    background-color: #0f0f0f98;
  }
  button:active {
    background-color: #0f0f0f69;
  }
}

#app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
}

</style>