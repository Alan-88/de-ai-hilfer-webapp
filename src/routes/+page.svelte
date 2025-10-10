<script lang="ts">
  import { onMount } from 'svelte';
  import type { AnalyzeResponse, RecentItem, Suggestion, DBSuggestion, FollowUpItem } from '$lib/types';
  import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
  import FollowUp from '$lib/components/FollowUp.svelte';
  import ManagementActions from '$lib/components/ManagementActions.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import AdvancedSearch from '$lib/components/AdvancedSearch.svelte';
  import DataManagement from '$lib/components/DataManagement.svelte';
  import WordLibraryManager from '$lib/components/WordLibraryManager.svelte';
  import ServerStatus from '$lib/components/ServerStatus.svelte';

  // --- 状态管理 ---
  let searchQuery = "";
  let searchResult: AnalyzeResponse | null = null;
  let isLoading = false;
  let error: string | null = null;
  let recentItems: RecentItem[] = [];
  let suggestions: Suggestion[] = [];
  let showSuggestions = false;
  let successMessage: string | null = null;
  let showAdvancedSearch = false;
  let showDataManagement = false;
  let showWordLibraryManager = false;
  let installPromptEvent: any = null;

  // --- API 调用与逻辑 ---
  async function handleSearch(query?: string) {
    const term = query || searchQuery;
    if (!term.trim()) return;

    searchQuery = term;
    showSuggestions = false;
    isLoading = true;
    error = null;
    successMessage = null;
    searchResult = null;

    try {
      const response = await fetch(`https://de-ai-hilfer-api.onrender.com/api/v1/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query_text: term }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `服务器错误: ${response.status}`);
      }
      searchResult = await response.json();
      fetchRecentItems();
    } catch (e: any) {
      error = e.message || '发生未知错误，请稍后重试。';
    } finally {
      isLoading = false;
    }
  }

  function clearSearch() {
    searchQuery = '';
    searchResult = null;
    error = null;
    suggestions = [];
    showSuggestions = false;
  }

  async function fetchSuggestions() {
    if (!searchQuery.trim()) {
      suggestions = [];
      showSuggestions = false;
      return;
    }
    try {
      const response = await fetch(`https://de-ai-hilfer-api.onrender.com/api/v1/suggestions?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        suggestions = data.suggestions.filter((s: Suggestion) => s.suggestion_type === 'db_match');
        showSuggestions = suggestions.length > 0;
      }
    } catch (e) {
      console.error('获取建议失败:', e);
    }
  }

  async function fetchRecentItems() {
    try {
      const response = await fetch(`https://de-ai-hilfer-api.onrender.com/api/v1/entries/recent`);
      if (response.ok) {
        recentItems = await response.json();
      }
    } catch (e) {
      console.error('获取最近记录失败:', e);
    }
  }
  
  function handleNewFollowUp(event: CustomEvent<FollowUpItem>) {
    if (searchResult) {
      searchResult.follow_ups = [...searchResult.follow_ups, event.detail];
    }
  }

  function showSuccessToast(message: string) {
      successMessage = message;
      setTimeout(() => successMessage = null, 3000);
  }
  
  function handleWordClickFromManager(event: CustomEvent<AnalyzeResponse>) {
    showWordLibraryManager = false;
    searchResult = event.detail;
    searchQuery = event.detail.query_text;
    fetchRecentItems();
  }

  function handleActionSuccess(event: CustomEvent<string>) { showSuccessToast(event.detail); fetchRecentItems(); }
  function handleActionError(event: CustomEvent<string>) { error = event.detail; }
  function handleEntryUpdated(event: CustomEvent<AnalyzeResponse>) { searchResult = event.detail; }
  function handleEntryDeleted(event: CustomEvent<string>) { showSuccessToast(event.detail); searchResult = null; fetchRecentItems(); }
  function handleAdvancedSearchSuccess(event: CustomEvent<AnalyzeResponse>) { showAdvancedSearch = false; searchResult = event.detail; searchQuery = event.detail.query_text; fetchRecentItems(); }
  function handleRestoreSuccess(event: CustomEvent<string>) { showDataManagement = false; showSuccessToast(event.detail); clearSearch(); fetchRecentItems(); }
  function handleWordAdded(event: CustomEvent<string>) { showWordLibraryManager = false; showSuccessToast(event.detail); fetchRecentItems(); }

  function handleInstallClick() {
    if (installPromptEvent) {
      installPromptEvent.prompt();
    }
  }

  onMount(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      installPromptEvent = e;
    });
    fetchRecentItems();
  });
</script>

{#if successMessage}
<div class="fixed top-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-50 animate-pulse">
  {successMessage}
</div>
{/if}

<Modal bind:showModal={showDataManagement} on:close={() => showDataManagement = false}>
  <DataManagement on:close={() => showDataManagement = false} on:restoreSuccess={handleRestoreSuccess} />
</Modal>
<Modal bind:showModal={showAdvancedSearch} on:close={() => showAdvancedSearch = false}>
  <AdvancedSearch initialTerm={searchQuery} on:close={() => showAdvancedSearch = false} on:searchSuccess={handleAdvancedSearchSuccess} />
</Modal>
<Modal bind:showModal={showWordLibraryManager} on:close={() => showWordLibraryManager = false} fullScreen={true}>
  <WordLibraryManager on:close={() => showWordLibraryManager = false} on:wordAdded={handleWordAdded} on:wordClick={handleWordClickFromManager} />
</Modal>

<div class="w-full max-w-3xl mx-auto flex flex-col h-screen bg-gray-50 dark:bg-gray-900">

  <header class="sticky top-0 z-20 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm pt-6 pb-4">
    <div class="px-4">
      <div class="text-center mb-4">
        <h1 class="text-3xl font-extrabold text-gray-900 dark:text-white">De-AI-Hilfer</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">你的下一代个人德语学习助理</p>
      </div>
      <form on:submit|preventDefault={() => handleSearch()}>
        <div class="relative">
          <input 
            type="text" 
            placeholder="输入德语单词，例如 'Hilfe'..." 
            class="w-full bg-white dark:bg-gray-800 text-md pl-10 pr-24 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            bind:value={searchQuery}
            on:input={fetchSuggestions}
            on:focus={() => showSuggestions = suggestions.length > 0}
            on:blur={() => setTimeout(() => showSuggestions = false, 200)}
            disabled={isLoading}
          >
          {#if searchQuery && !isLoading}
          <button type="button" on:click={clearSearch} aria-label="Clear search" class="absolute top-1/2 right-14 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          {/if}
          <button type="submit" aria-label="Search" class="absolute top-1/2 right-2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 flex items-center justify-center transition-all" disabled={isLoading}>
            {#if isLoading}
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            {/if}
          </button>
        </div>
      </form>
       {#if showSuggestions && suggestions.length > 0}
        <div class="absolute w-full max-w-3xl px-4 left-1/2 -translate-x-1/2">
            <div class="mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-10 p-2">
                <ul class="space-y-1">
                {#each suggestions as suggestion}
                    <li>
                        <button class="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50" on:click={() => handleSearch((suggestion as DBSuggestion).query_text)}>
                        <p class="font-semibold text-gray-900 dark:text-white">{(suggestion as DBSuggestion).query_text}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{(suggestion as DBSuggestion).preview}</p>
                        </button>
                    </li>
                {/each}
                </ul>
            </div>
        </div>
      {/if}
    </div>
  </header>

  <main class="flex-1 overflow-y-auto">
    <div class="p-4 space-y-6">
      {#if isLoading}
        <div class="text-center p-8 text-gray-500 dark:text-gray-400"><p>🧠 AI 正在分析中，请稍候...</p></div>
      {:else if error}
        <div class="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl" role="alert">
          <strong class="font-bold">查询失败:</strong>
          <span class="block sm:inline">{error}</span>
        </div>
      {:else if searchResult}
        <div class="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center gap-4 mb-4">
            <h2 class="text-4xl font-bold text-gray-900 dark:text-white">{searchResult.query_text}</h2>
            <span class:bg-green-100={searchResult.source === '知识库'} class:text-green-800={searchResult.source === '知识库'} class:dark:bg-green-900={searchResult.source === '知识库'} class:dark:text-green-300={searchResult.source === '知识库'} class:bg-blue-100={searchResult.source === 'generated'} class:text-blue-800={searchResult.source === 'generated'} class:dark:bg-blue-900={searchResult.source === 'generated'} class:dark:text-blue-300={searchResult.source === 'generated'} class="text-sm font-medium px-3 py-1 rounded-full">
              {searchResult.source}
            </span>
          </div>
          <MarkdownRenderer markdownContent={searchResult.analysis_markdown} followUps={searchResult.follow_ups} />
          <FollowUp entryId={searchResult.entry_id} on:newFollowUp={handleNewFollowUp} />
          <ManagementActions entry={searchResult} on:actionSuccess={handleActionSuccess} on:actionError={handleActionError} on:entryUpdated={handleEntryUpdated} on:entryDeleted={handleEntryDeleted} />
        </div>
      {:else}
        <div class="space-y-6">
            <a href="/learn" class="block bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:opacity-90 transition-opacity">
                <h3 class="text-xl font-bold mb-2">智能学习</h3>
                <p class="text-sm opacity-80">基于间隔重复算法，开始今天的学习任务。</p>
            </a>
            <div>
                <h3 class="text-md font-semibold text-gray-500 dark:text-gray-400 mb-3 px-2">知识库</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button on:click={() => showWordLibraryManager = true} class="bg-white dark:bg-gray-800 hover:dark:bg-gray-700 p-4 rounded-lg text-left transition-colors shadow">
                        <h4 class="font-semibold text-gray-900 dark:text-white">📚 词库管理</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">浏览、搜索和管理你的所有词汇。</p>
                    </button>
                    <button on:click={() => showAdvancedSearch = true} class="bg-white dark:bg-gray-800 hover:dark:bg-gray-700 p-4 rounded-lg text-left transition-colors shadow">
                        <h4 class="font-semibold text-gray-900 dark:text-white">🔍 高级查询</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">通过模糊拼写和中文提示查找单词。</p>
                    </button>
                    <button on:click={() => showDataManagement = true} class="bg-white dark:bg-gray-800 hover:dark:bg-gray-700 p-4 rounded-lg text-left transition-colors shadow">
                        <h4 class="font-semibold text-gray-900 dark:text-white">⚙️ 数据管理</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">备份或从文件恢复你的知识库。</p>
                    </button>
                </div>
            </div>
            <div>
                <h3 class="text-md font-semibold text-gray-500 dark:text-gray-400 mb-3 px-2">最近历史</h3>
                {#if recentItems.length > 0}
                <div class="space-y-2">
                    {#each recentItems as item}
                        <button class="w-full text-left p-3 rounded-lg bg-white dark:bg-gray-800 hover:dark:bg-gray-700 transition-colors shadow" on:click={() => handleSearch(item.query_text)}>
                            <p class="font-semibold text-gray-900 dark:text-white">{item.query_text}</p>
                            <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{item.preview}</p>
                        </button>
                    {/each}
                </div>
                {:else}
                    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>暂无最近记录</p>
                    </div>
                {/if}
            </div>
        </div>
      {/if}
    </div>
  </main>
  
  <footer class="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
      <ServerStatus />
      {#if installPromptEvent}
        <button on:click={handleInstallClick} class="text-xs text-blue-600 dark:text-blue-400 hover:underline w-full text-center mt-2">
            安装应用到桌面
        </button>
      {/if}
  </footer>
</div>
