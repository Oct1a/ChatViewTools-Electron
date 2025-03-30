<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

interface ChatStats {
  total_messages: number
  total_talkers: number
  message_types: {
    type: number
    count: number
  }[]
  daily_messages: {
    date: string
    count: number
  }[]
  top_talkers: {
    talker: string
    count: number
  }[]
}

const stats = ref<ChatStats | null>(null)
const loading = ref(false)
const messageTypeChart = ref<echarts.ECharts | null>(null)
const dailyChart = ref<echarts.ECharts | null>(null)
const topTalkersChart = ref<echarts.ECharts | null>(null)

const loadStats = async () => {
  loading.value = true
  try {
    // TODO: 替换为实际的 Electron IPC 调用
    const result = await window.electron.ipcRenderer.invoke('get-chat-statistics')
    stats.value = result
    updateCharts()
  } catch (error) {
    ElMessage.error('加载统计数据失败：' + error)
  } finally {
    loading.value = false
  }
}

const initCharts = () => {
  messageTypeChart.value = echarts.init(document.getElementById('messageTypeChart')!)
  dailyChart.value = echarts.init(document.getElementById('dailyChart')!)
  topTalkersChart.value = echarts.init(document.getElementById('topTalkersChart')!)
}

const updateCharts = () => {
  if (!stats.value) return
  
  // 消息类型分布
  messageTypeChart.value?.setOption({
    title: {
      text: '消息类型分布'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        type: 'pie',
        radius: '50%',
        data: stats.value.message_types.map(item => ({
          name: getMessageTypeName(item.type),
          value: item.count
        }))
      }
    ]
  })
  
  // 每日消息数量
  dailyChart.value?.setOption({
    title: {
      text: '每日消息数量'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: stats.value.daily_messages.map(item => item.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: stats.value.daily_messages.map(item => item.count),
        type: 'line',
        smooth: true
      }
    ]
  })
  
  // 活跃联系人排行
  topTalkersChart.value?.setOption({
    title: {
      text: '活跃联系人排行'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: stats.value.top_talkers.map(item => item.talker)
    },
    series: [
      {
        type: 'bar',
        data: stats.value.top_talkers.map(item => item.count)
      }
    ]
  })
}

const getMessageTypeName = (type: number) => {
  const types: Record<number, string> = {
    1: '文本消息',
    3: '图片消息',
    34: '语音消息',
    43: '视频消息',
    49: '文件消息',
    50: '链接消息'
  }
  return types[type] || '其他类型'
}

onMounted(() => {
  initCharts()
  loadStats()
  
  window.addEventListener('resize', () => {
    messageTypeChart.value?.resize()
    dailyChart.value?.resize()
    topTalkersChart.value?.resize()
  })
})
</script>

<template>
  <div class="statistics-container">
    <div class="statistics-header">
      <h2>聊天记录统计</h2>
    </div>

    <div class="statistics-overview" v-loading="loading">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>总消息数</span>
              </div>
            </template>
            <div class="card-value">{{ stats?.total_messages || 0 }}</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>联系人数量</span>
              </div>
            </template>
            <div class="card-value">{{ stats?.total_talkers || 0 }}</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>平均每日消息</span>
              </div>
            </template>
            <div class="card-value">
              {{ Math.round((stats?.total_messages || 0) / (stats?.daily_messages.length || 1)) }}
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="statistics-charts">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="hover">
            <div id="messageTypeChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover">
            <div id="dailyChart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" class="mt-20">
        <el-col :span="24">
          <el-card shadow="hover">
            <div id="topTalkersChart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
.statistics-container {
  padding: 20px;
  height: 100vh;
  background-color: #f5f7fa;
}

.statistics-header {
  margin-bottom: 20px;
}

.statistics-overview {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  text-align: center;
  padding: 20px 0;
}

.chart {
  height: 400px;
}

.mt-20 {
  margin-top: 20px;
}
</style> 