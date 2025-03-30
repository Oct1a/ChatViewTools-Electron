<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ipc } from '../services/ipc'

const dbPath = ref('')

const handleSelectFile = async () => {
  try {
    const selected = await ipc.selectFile()
    if (selected) {
      dbPath.value = selected
    }
  } catch (error) {
    ElMessage.error('选择文件失败：' + error)
  }
}

const handleDecrypt = async () => {
  if (!dbPath.value) {
    ElMessage.warning('请先选择数据库文件')
    return
  }
  
  try {
    await ipc.decryptDatabase(dbPath.value)
    ElMessage.success('数据库解密成功')
  } catch (error) {
    ElMessage.error('数据库解密失败：' + error)
  }
}
</script>

<template>
  <div class="container">
    <el-card class="decrypt-card">
      <template #header>
        <div class="card-header">
          <h2>微信数据库解密工具</h2>
        </div>
      </template>
      <el-form>
        <el-form-item label="数据库路径">
          <el-input v-model="dbPath" placeholder="请选择或输入数据库路径" readonly>
            <template #append>
              <el-button @click="handleSelectFile">选择文件</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleDecrypt">开始解密</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.decrypt-card {
  width: 500px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
}
</style> 