<script lang="ts">
  import { onMount } from 'svelte';
  import type { AnalyzeResponse, RecentItem, Suggestion, DBSuggestion, FollowUpItem, IntelligentSearchRequest, SuggestionType } from '$lib/types';
  import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
  import FollowUp from '$lib/components/FollowUp.svelte';
  import ManagementActions from '$lib/components/ManagementActions.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import FullDictionary from '$lib/components/FullDictionary.svelte';
  import AdvancedSearch from '$lib/components/AdvancedSearch.svelte';
  import DataManagement from '$lib/components/DataManagement.svelte'; // 1. 导入 DataManagement
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
  let showFullDictionary = false;
  let showAdvancedSearch = false;
  let showDataManagement = false; // 2. 添加用于控制模态框的状态
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
        body: JSON.stringify({ query_text: term, entry_type: 'WORD' }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `服务器错误: ${response.status}`);
      }
      searchResult = await response.json();
      fetchRecentItems();
    } catch (e: any) {
      console.error('搜索时发生错误:', e);
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

  function handleActionSuccess(event: CustomEvent<string>) {
    showSuccessToast(event.detail);
    fetchRecentItems();
  }

  function handleActionError(event: CustomEvent<string>) {
      error = event.detail;
  }
  
  function handleEntryUpdated(event: CustomEvent<AnalyzeResponse>) {
      searchResult = event.detail;
  }

  function handleEntryDeleted(event: CustomEvent<string>) {
      showSuccessToast(event.detail);
      searchResult = null;
      fetchRecentItems();
  }
  
  function handleItemClickFromModal(event: CustomEvent<string>) {
    showFullDictionary = false;
    handleSearch(event.detail);
  }

  function handleAdvancedSearchSuccess(event: CustomEvent<AnalyzeResponse>) {
    showAdvancedSearch = false;
    searchResult = event.detail;
    searchQuery = event.detail.query_text;
    fetchRecentItems();
  }

  // 3. 添加处理恢复成功的事件函数
  function handleRestoreSuccess(event: CustomEvent<string>) {
    showDataManagement = false;
    showSuccessToast(event.detail);
    clearSearch();
    fetchRecentItems();
  }

  function handleInstallClick() {
    if (installPromptEvent) {
      installPromptEvent.prompt();
    }
  }

  onMount(() => {
    // 监听 PWA 安装提示事件
    window.addEventListener('beforeinstallprompt', (e) => {
      // 阻止默认的迷你信息栏弹出
      e.preventDefault();
      // 保存事件，以便稍后触发
      installPromptEvent = e;
    });

    fetchRecentItems();
  });
</script>

{#if successMessage}
<div class="fixed top-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-50">
  {successMessage}
</div>
{/if}

<Modal bind:showModal={showDataManagement} on:close={() => showDataManagement = false}>
  <DataManagement 
    on:close={() => showDataManagement = false}
    on:restoreSuccess={handleRestoreSuccess}
  />
</Modal>

<Modal bind:showModal={showAdvancedSearch} on:close={() => showAdvancedSearch = false}>
  <AdvancedSearch 
    initialTerm={searchQuery}
    on:close={() => showAdvancedSearch = false}
    on:searchSuccess={handleAdvancedSearchSuccess}
  />
</Modal>

<Modal bind:showModal={showFullDictionary} on:close={() => showFullDictionary = false}>
  <FullDictionary on:close={() => showFullDictionary = false} on:itemClick={handleItemClickFromModal} />
</Modal>

<div class="min-h-screen flex flex-col items-center justify-start pt-20 px-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
  
  <div class="text-center mb-12">
    <h1 class="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white">De-AI-Hilfer</h1>
    <p class="mt-4 text-lg text-gray-500 dark:text-gray-400">你的下一代个人德语学习助理</p>
  </div>
  
  <div class="w-full max-w-2xl mx-auto relative">
    <form on:submit|preventDefault={() => handleSearch()}>
      <div class="relative bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700">
        <input 
          type="text" 
          placeholder="输入德语单词，例如 'Hilfe'..." 
          class="w-full bg-transparent text-lg pl-6 pr-28 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          bind:value={searchQuery}
          on:input={fetchSuggestions}
          on:focus={() => showSuggestions = suggestions.length > 0}
          on:blur={() => setTimeout(() => showSuggestions = false, 200)}
          disabled={isLoading}
        >
        {#if searchQuery}
          <button 
            type="button" 
            on:click={clearSearch}
            aria-label="Clear search"
            class="absolute top-1/2 right-[52px] -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        {/if}
        <button type="submit" aria-label="Search" class="absolute top-1/2 right-3 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95" disabled={isLoading}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </button>
      </div>
    </form>
    
    {#if showSuggestions && suggestions.length > 0}
      <div class="absolute top-full w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 z-10 p-2">
        <ul class="space-y-1">
          {#each suggestions as suggestion}
            {#if suggestion.suggestion_type === 'db_match'}
              <li>
                <button
                  class="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  on:click={() => handleSearch((suggestion as DBSuggestion).query_text)}
                >
                  <p class="font-semibold text-gray-900 dark:text-white pointer-events-none">{(suggestion as DBSuggestion).query_text}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 truncate pointer-events-none">{(suggestion as DBSuggestion).preview}</p>
                </button>
              </li>
            {:else if suggestion.suggestion_type === 'spell_correction'}
              <li>
                <button
                  class="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  on:click={() => handleSearch((suggestion as any).corrected_query)}
                >
                  <p class="font-semibold text-gray-900 dark:text-white pointer-events-none">
                    ↩️ {(suggestion as any).corrected_query}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 truncate pointer-events-none">
                    拼写修正: {(suggestion as any).original_query}
                  </p>
                </button>
              </li>
            {/if}
          {/each}
        </ul>
      </div>
    {/if}
  </div>
  
  <div class="w-full max-w-2xl mx-auto mt-8">
    {#if isLoading}
      <div class="text-center p-8 text-gray-500 dark:text-gray-400"><p>🧠 AI 正在分析中，请稍候...</p></div>
    {:else if error}
      <div class="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl" role="alert">
        <strong class="font-bold">查询失败:</strong>
        <span class="block sm:inline">{error}</span>
      </div>
    {:else if searchResult}
      <div class="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
        <div class="flex items-center gap-4 mb-4">
          <h2 class="text-4xl font-bold text-gray-900 dark:text-white">{searchResult.query_text}</h2>
          <span class:bg-green-100={searchResult.source === '知识库'} class:text-green-800={searchResult.source === '知识库'} class:dark:bg-green-900={searchResult.source === '知识库'} class:dark:text-green-300={searchResult.source === '知识库'} class:bg-blue-100={searchResult.source === 'generated'} class:text-blue-800={searchResult.source === 'generated'} class:dark:bg-blue-900={searchResult.source === 'generated'} class:dark:text-blue-300={searchResult.source === 'generated'} class="text-sm font-medium px-3 py-1 rounded-full">
            {searchResult.source}
          </span>
        </div>
        
        <MarkdownRenderer markdownContent={searchResult.analysis_markdown} followUps={searchResult.follow_ups} />
        <FollowUp entryId={searchResult.entry_id} on:newFollowUp={handleNewFollowUp} />
        <ManagementActions 
          entry={searchResult}
          on:actionSuccess={handleActionSuccess}
          on:actionError={handleActionError}
          on:entryUpdated={handleEntryUpdated}
          on:entryDeleted={handleEntryDeleted}
        />
      </div>
    {:else if searchQuery === ""}
      <div class="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">学习功能</h3>
          <div class="flex items-center space-x-4">
            <a href="/learn" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              智能学习
            </a>
            {#if installPromptEvent}
              <button on:click={handleInstallClick} class="text-sm font-semibold text-green-600 dark:text-green-400 hover:underline">
                安装应用
              </button>
            {/if}
          </div>
        </div>
        
        <div class="flex justify-between items-center mb-4 border-t dark:border-gray-700 pt-4">
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">知识库操作</h3>
          <div class="flex items-center space-x-4">
            <button on:click={() => showDataManagement = true} class="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              备份/恢复
            </button>
            <button on:click={() => showAdvancedSearch = true} class="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              高级查询
            </button>
            <button on:click={() => showFullDictionary = true} class="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              浏览全部 →
            </button>
          </div>
        </div>
        
        {#if recentItems.length > 0}
          <ul class="space-y-2 border-t dark:border-gray-700 pt-4">
            {#each recentItems as item}
              <li class="rounded-lg">
                <button class="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500" on:click={() => handleSearch(item.query_text)}>
                  <p class="font-semibold text-gray-900 dark:text-white pointer-events-none">{item.query_text}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 truncate pointer-events-none">{item.preview}</p>
                </button>
              </li>
            {/each}
          </ul>
        {:else}
          <div class="text-center py-8 text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-4">
            <p>暂无最近记录</p>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <footer class="text-center mt-16 pb-8"><p class="text-gray-400 dark:text-gray-500 text-sm">De-AI-Hilfer V4.0 Web Client</p></footer>
  <footer class="text-center mt-16 pb-8 space-y-2">
    <div class="flex justify-center">
      <ServerStatus />
    </div>
    <p class="text-gray-400 dark:text-gray-500 text-sm">De-AI-Hilfer V4.0 Web Client</p>
  </footer>
</div>
