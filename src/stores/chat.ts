import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChatMessage, ChatStats } from '../../electron/services/database'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const talkers = ref<string[]>([])
  const selectedTalker = ref('')
  const searchKeyword = ref('')
  const dateRange = ref<[string, string]>(['', ''])
  const selectedTypes = ref<number[]>([])
  const chatStats = ref<ChatStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const filteredMessages = computed(() => {
    if (!selectedTalker.value) return messages.value
    return messages.value.filter(msg => msg.talker === selectedTalker.value)
  })

  const searchParams = computed(() => ({
    keyword: searchKeyword.value,
    dateRange: dateRange.value,
    messageTypes: selectedTypes.value,
    talker: selectedTalker.value
  }))

  function setMessages(newMessages: ChatMessage[]) {
    messages.value = newMessages
  }

  function setTalkers(newTalkers: string[]) {
    talkers.value = newTalkers
  }

  function setSelectedTalker(talker: string) {
    selectedTalker.value = talker
  }

  function setSearchKeyword(keyword: string) {
    searchKeyword.value = keyword
  }

  function setDateRange(range: [string, string]) {
    dateRange.value = range
  }

  function setSelectedTypes(types: number[]) {
    selectedTypes.value = types
  }

  function setChatStats(stats: ChatStats) {
    chatStats.value = stats
  }

  function setLoading(status: boolean) {
    loading.value = status
  }

  function setError(message: string | null) {
    error.value = message
  }

  function reset() {
    messages.value = []
    talkers.value = []
    selectedTalker.value = ''
    searchKeyword.value = ''
    dateRange.value = ['', '']
    selectedTypes.value = []
    chatStats.value = null
    loading.value = false
    error.value = null
  }

  return {
    messages,
    talkers,
    selectedTalker,
    searchKeyword,
    dateRange,
    selectedTypes,
    chatStats,
    loading,
    error,
    filteredMessages,
    searchParams,
    setMessages,
    setTalkers,
    setSelectedTalker,
    setSearchKeyword,
    setDateRange,
    setSelectedTypes,
    setChatStats,
    setLoading,
    setError,
    reset
  }
}) 