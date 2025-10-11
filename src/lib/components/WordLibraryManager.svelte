<script lang="ts">
  import { onMount } from 'svelte';
  import { addWordToLearning } from '$lib/learningApi';
  import Modal from './Modal.svelte';
  import MarkdownRenderer from './MarkdownRenderer.svelte';

  // Props
  export let onClose: () => void;
  export let onWordClick: (word: any) => void;
  export let onWordAdded: (message: string) => void;

  // Types
  interface WordData {
    query_text: string;
    preview: string;
    entry_type?: string;
    entry_id?: number;
    analysis_markdown?: string;
    _error?: string;
  }

  // Component State
  let allWords: WordData[] = [];
  let isLoading = false;
  let error: string | null = null;
  let showAddModal = false;
  let selectedWord: WordData | null = null;
  let searchQuery = '';
  let filteredWords: WordData[] = [];
  let learningStats: any = null;
  let learningProgress: any = null;
  let addModalError: string | null = null;
  let filterStatus: 'all' | 'learning' | 'review' | 'mastered' | 'available' = 'all';

  // Lifecycle
  onMount(async () => {
    isLoading = true;
    await loadLearningProgress();
    await loadAllWords();
    await loadLearningStats();
  });

  // Functions
  async function loadAllWords() {
    isLoading = true;
    error = null;
    try {
      const response = await fetch('https://de-ai-hilfer-api.onrender.com/api/v1/entries/all');
      if (!response.ok) throw new Error('获取词库失败');
      
      const wordsFromApi = await response.json();
      allWords = wordsFromApi.map((word: WordData) => ({
          ...word,
          analysis_markdown: word.preview
      }));
      applyFilters();
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

  async function loadLearningProgress() {
    try {
      const response = await fetch('https://de-ai-hilfer-api.onrender.com/api/v1/learning/progress');
      if (!response.ok) throw new Error('获取学习进度失败');
      learningProgress = await response.json();
    } catch (e: any) {
      console.error('获取学习进度失败:', e);
    }
  }
  
  function applyFilters() {
    filteredWords = allWords.filter(word => {
      const matchesSearch = word.query_text.toLowerCase().includes(searchQuery.toLowerCase());
      if (filterStatus === 'all') return matchesSearch;
      return matchesSearch && getWordStatus(word) === filterStatus;
    });
  }

  $: if (searchQuery || filterStatus) {
    applyFilters();
  }
  
  async function handleAddWord(word: any) {
    try {
      const entryId = word.entry_id || word.id;
      if (!entryId) throw new Error('单词ID缺失，无法添加到学习计划');
      
      await addWordToLearning(entryId);
      showAddModal = false;
      selectedWord = null;
      onWordAdded(`成功添加 "${word.query_text}" 到学习计划`);

      await loadLearningProgress();
      await loadLearningStats();

      const wordIndex = allWords.findIndex(w => w.entry_id === entryId);
      if (wordIndex !== -1) {
        allWords[wordIndex] = { ...allWords[wordIndex] };
        applyFilters();
      }
    } catch (e: any) {
      addModalError = e.message;
      if (selectedWord) {
        selectedWord = { ...selectedWord, _error: e.message };
      }
    }
  }

  function handleWordClick(word: WordData) { onWordClick(word); }
  function openAddModal(word: any) {
    selectedWord = word;
    showAddModal = true;
    error = null;
  }

  function getWordStatus(word: any) {
    if (!learningProgress || !word.entry_id) return 'available';
    const progress = learningProgress.progress?.[word.entry_id];
    if (!progress) return 'available';
    if (progress.mastery_level >= 4) return 'mastered';
    if (progress.next_review_at && new Date(progress.next_review_at) <= new Date()) return 'review';
    return 'learning';
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'learning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'mastered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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

  const filterTabs: { status: 'all' | 'learning' | 'review' | 'mastered' | 'available', text: string }[] = [
    { status: 'all', text: '全部' },
    { status: 'available', text: '未开始' },
    { status: 'learning', text: '学习中' },
    { status: 'review', text: '需复习' },
    { status: 'mastered', text: '已掌握' }
  ];
</script>

<style>
    details > summary { list-style: none; }
    details > summary::-webkit-details-marker { display: none; }
    .custom-arrow { transition: transform 0.2s; }
    details[open] .custom-arrow { transform: rotate(180deg); }
    
    .collapsed-view, .expanded-view { display: none; }
    details[open] > summary .expanded-view { display: flex; }
    details:not([open]) > summary .collapsed-view { display: flex; }
</style>

<div class="flex flex-1 flex-col min-h-0 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">

    <header class="sticky top-0 z-20 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 p-4">
        <div class="flex items-center justify-between gap-4">
            <h2 class="text-xl font-bold text-white whitespace-nowrap">📚 词库管理</h2>
            <div class="relative flex-1 min-w-0">
                <input type="text" placeholder="搜索词库..." bind:value={searchQuery} class="w-full pl-9 pr-4 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" /></svg>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button on:click={loadAllWords} class="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label="刷新">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                </button>
                <button on:click={onClose} class="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label="关闭">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        </div>
    </header>

    {#if learningStats}
    <details class="border-b border-gray-700 bg-gray-900" open>
        <summary class="p-4 cursor-pointer hover:bg-gray-800 flex justify-between items-center">
            <div class="collapsed-view items-center w-full gap-1">
                <div class="flex-1 text-center font-semibold text-lg" title="总学习单词">📊</div>
                 <div class="flex-1 text-center font-semibold text-lg text-blue-400" title="总学习单词">{learningStats.total_words}</div>
                <div class="flex-1 text-center font-semibold text-lg text-yellow-400" title="今日待复习">{learningStats.due_today}</div>
                <div class="flex-1 text-center font-semibold text-lg text-green-400" title="平均难度">{learningStats.average_ease_factor}</div>
                <div class="flex-1 text-center font-semibold text-lg text-purple-400" title="已掌握">-</div>
            </div>
            <h3 class="expanded-view text-md font-semibold text-white">📊 学习统计</h3>
            <div class="custom-arrow">
                <svg class="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
            </div>
        </summary>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 pt-0">
            <div class="text-center bg-gray-800/50 p-3 rounded-lg"><p class="text-2xl font-bold text-blue-400">{learningStats.total_words}</p><p class="text-xs text-gray-400">总学习单词</p></div>
            <div class="text-center bg-gray-800/50 p-3 rounded-lg"><p class="text-2xl font-bold text-yellow-400">{learningStats.due_today}</p><p class="text-xs text-gray-400">今日待复习</p></div>
            <div class="text-center bg-gray-800/50 p-3 rounded-lg"><p class="text-2xl font-bold text-green-400">{learningStats.average_ease_factor}</p><p class="text-xs text-gray-400">平均难度</p></div>
            <div class="text-center bg-gray-800/50 p-3 rounded-lg"><p class="text-2xl font-bold text-purple-400">-</p><p class="text-xs text-gray-400">掌握分布</p></div>
        </div>
    </details>
    {/if}
    
    <div class="sticky top-[73px] z-10 bg-gray-900 pt-3 pb-3 border-b border-gray-700">
        <div class="px-4">
            <div class="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
                {#each filterTabs as tab}
                  <button
                    on:click={() => filterStatus = tab.status}
                    class="flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 {filterStatus === tab.status ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}"
                  >
                    {tab.text}
                  </button>
                {/each}
            </div>
        </div>
    </div>

    <div class="flex-1 overflow-y-auto min-h-0">
      {#if isLoading}
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-400">正在加载词库...</p>
        </div>
      {:else if error}
        <div class="p-4">
          <div class="bg-red-900/30 border border-red-600 text-red-300 px-4 py-3 rounded-xl" role="alert">
            <strong class="font-bold">错误:</strong>
            <span class="block sm:inline">{error}</span>
          </div>
        </div>
      {:else if filteredWords.length === 0}
        <div class="text-center py-12 text-gray-500">
          <p>没有找到匹配的单词</p>
        </div>
      {:else}
        <div class="p-4 space-y-3">
            {#each filteredWords as word (word.entry_id)}
            <div 
              class="bg-gray-800/50 rounded-lg p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
              on:click={() => handleWordClick(word)}
              on:keydown={(e) => e.key === 'Enter' && handleWordClick(word)}
              role="button"
              tabindex="0"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-lg font-semibold text-white">{word.query_text}</h3>
                    <span class="px-2 py-0.5 text-xs font-medium rounded-full {getStatusBadge(getWordStatus(word))}">
                      {getStatusText(getWordStatus(word))}
                    </span>
                  </div>
                  <p class="text-sm text-gray-400">{word.preview}</p>
                </div>
                <div class="ml-4">
                  {#if getWordStatus(word) === 'available'}
                    <button
                      on:click|stopPropagation={() => openAddModal(word)}
                      class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
                    >
                      添加学习
                    </button>
                  {:else}
                    <div class="px-3 py-1 bg-gray-600 text-gray-400 text-sm font-medium rounded-lg">
                      已添加
                    </div>
                  {/if}
                </div>
              </div>
            </div>
            {/each}
        </div>
      {/if}
    </div>
</div>

<Modal bind:showModal={showAddModal} on:close={() => showAddModal = false}>
  {#if selectedWord}
    <div class="bg-gray-800 rounded-xl p-6 max-w-lg w-full">
      <h3 class="text-xl font-semibold text-white mb-4">添加到学习计划</h3>
      
      <div class="mb-4">
        <p class="text-2xl font-bold text-white mb-2">{selectedWord.query_text}</p>
        {#if selectedWord.entry_type}
        <p class="text-sm text-gray-400 mb-4">类型: {selectedWord.entry_type}</p>
        {/if}
        <div class="prose prose-sm prose-invert max-w-none">
          <MarkdownRenderer markdownContent={selectedWord.preview} />
        </div>
      </div>
      
      {#if addModalError}
        <div class="bg-red-900/30 border border-red-600 text-red-300 px-4 py-3 rounded-xl mb-4" role="alert">
          <strong class="font-bold">错误:</strong>
          <span class="block sm:inline">{addModalError}</span>
        </div>
      {/if}
      
      <div class="flex justify-end space-x-3">
        <button
          on:click={() => showAddModal = false}
          class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
        >
          取消
        </button>
        <button
          on:click={() => handleAddWord(selectedWord)}
          class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
        >
          确认添加
        </button>
      </div>
    </div>
  {/if}
</Modal>
