<script lang="ts">
  import { onMount } from 'svelte';
  import { addWordToLearning } from '$lib/learningApi';
  import Modal from './Modal.svelte';
  import MarkdownRenderer from './MarkdownRenderer.svelte';

  export let onWordAdded: () => void;

  let allWords = [];
  let isLoading = false;
  let error: string | null = null;
  let showAddModal = false;
  let selectedWord = null;
  let searchQuery = '';
  let filteredWords = [];
  let learningStats = null;

  onMount(async () => {
    await loadAllWords();
    await loadLearningStats();
  });

  async function loadAllWords() {
    isLoading = true;
    error = null;
    try {
      const response = await fetch('https://de-ai-hilfer-api.onrender.com/api/v1/entries');
      if (!response.ok) throw new Error('获取词库失败');
      const data = await response.json();
      allWords = data;
      filteredWords = data;
    } catch (e: any) {
      error = e.message;
    } finally {
      isLoading = false;
    }
  }

  async function loadLearningStats() {
    try {
      const response = await fetch('https://de-ai-hilfer-api.onrender.com/api/v1/learning/stats');
      if (!response.ok) throw new Error('获取统计失败');
      learningStats = await response.json();
    } catch (e: any) {
      console.error('获取统计失败:', e);
    }
  }

  $: filteredWords = allWords.filter(word => 
    word.query_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleAddWord(word: any) {
    try {
      await addWordToLearning(word.id);
      showAddModal = false;
      selectedWord = null;
      onWordAdded();
      await loadLearningStats();
    } catch (e: any) {
      error = e.message;
    }
  }

  function openAddModal(word: any) {
    selectedWord = word;
    showAddModal = true;
    error = null;
  }

  function getWordStatus(word: any) {
    // 这里可以检查单词是否已在学习计划中
    // 简单实现：假设所有词库中的单词都可以添加
    return 'available';
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'learning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'mastered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'learning': return '学习中';
      case 'review': return '需复习';
      case 'mastered': return '已掌握';
      default: return '未开始';
    }
  }
</script>

<div class="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">📚 词库管理</h2>
    <button
      on:click={() => loadAllWords()}
      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
    >
      刷新词库
    </button>
  </div>

  {#if learningStats}
    <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">📊 学习统计</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center">
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{learningStats.total_words}</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">总学习单词</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{learningStats.due_today}</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">今日待复习</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-green-600 dark:text-green-400">{learningStats.average_ease_factor}</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">平均难度</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
          <p class="text-sm text-gray-600 dark:text-gray-400">掌握分布</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- 搜索框 -->
  <div class="mb-6">
    <input
      type="text"
      placeholder="搜索单词..."
      bind:value={searchQuery}
      class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
    />
  </div>

  {#if error}
    <div class="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-4" role="alert">
      <strong class="font-bold">错误:</strong>
      <span class="block sm:inline">{error}</span>
    </div>
  {/if}

  {#if isLoading}
    <div class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600 dark:text-gray-400">正在加载词库...</p>
    </div>
  {:else if filteredWords.length === 0}
    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
      <p>没有找到匹配的单词</p>
    </div>
  {:else}
    <div class="space-y-4 max-h-96 overflow-y-auto">
      {#each filteredWords as word}
        <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {word.query_text}
                </h3>
                <span class="px-2 py-1 text-xs font-medium rounded-full {getStatusBadge(getWordStatus(word))}">
                  {getStatusText(getWordStatus(word))}
                </span>
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                类型: {word.entry_type}
              </div>
              <div class="prose prose-sm max-w-none">
                <MarkdownRenderer markdownContent={word.preview} />
              </div>
            </div>
            <div class="ml-4">
              <button
                on:click={() => openAddModal(word)}
                class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                添加学习
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- 添加确认模态框 -->
<Modal bind:showModal={showAddModal} on:close={() => showAddModal = false}>
  {#if selectedWord}
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">添加到学习计划</h3>
      
      <div class="mb-4">
        <p class="text-2xl font-bold text-gray-900 dark:text-white mb-2">{selectedWord.query_text}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">类型: {selectedWord.entry_type}</p>
        <div class="prose prose-sm max-w-none">
          <MarkdownRenderer markdownContent={selectedWord.preview} />
        </div>
      </div>
      
      {#if error}
        <div class="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-4" role="alert">
          <strong class="font-bold">错误:</strong>
          <span class="block sm:inline">{error}</span>
        </div>
      {/if}
      
      <div class="flex justify-end space-x-3">
        <button
          on:click={() => showAddModal = false}
          class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          取消
        </button>
        <button
          on:click={() => handleAddWord(selectedWord)}
          class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          确认添加
        </button>
      </div>
    </div>
  {/if}
</Modal>
