<template>
  <div class="export-settings">
    <h3>导出设置</h3>
    
    <div class="format-select">
      <label>导出格式：</label>
      <el-select v-model="selectedFormat">
        <el-option value="json" label="JSON" />
        <el-option value="csv" label="CSV" />
        <el-option value="txt" label="TXT" />
        <el-option value="html" label="HTML" />
      </el-select>
    </div>
    
    <div class="export-actions">
      <el-button 
        @click="exportChatHistory" 
        :disabled="!selectedTalker"
        type="primary"
      >
        导出聊天记录
      </el-button>
      
      <el-button 
        @click="exportSearchResults" 
        :disabled="!hasSearchResults"
        type="primary"
      >
        导出搜索结果
      </el-button>
    </div>
    
    <div v-if="exportPath" class="export-result">
      <p>导出成功！文件保存在：</p>
      <p class="path">{{ exportPath }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { ipc } from '../services/ipc'

const props = defineProps({
  selectedTalker: {
    type: String,
    default: ''
  },
  searchResults: {
    type: Array,
    default: () => []
  },
  searchParams: {
    type: Object,
    default: () => ({})
  }
})

const selectedFormat = ref('json')
const exportPath = ref('')

const hasSearchResults = computed(() => props.searchResults.length > 0)

const exportChatHistory = async () => {
  try {
    const path = await ipc.exportChatHistory(props.selectedTalker, selectedFormat.value)
    exportPath.value = path
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败：' + error)
  }
}

const exportSearchResults = async () => {
  try {
    const path = await ipc.exportSearchResults(
      props.searchParams.keyword,
      props.searchParams.dateRange,
      props.searchParams.messageTypes,
      props.searchParams.talker,
      selectedFormat.value
    )
    exportPath.value = path
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败：' + error)
  }
}
</script>

<style scoped>
.export-settings {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.format-select {
  margin: 20px 0;
}

.export-actions {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.export-result {
  margin-top: 20px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.path {
  word-break: break-all;
  color: #666;
  font-size: 0.9em;
}
</style> 