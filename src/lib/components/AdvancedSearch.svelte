<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { AnalyzeResponse, IntelligentSearchRequest } from '$lib/types';

  export let initialTerm: string = '';

  let term: string = initialTerm;
  let hint: string = '';
  let isLoading = false;
  let error: string | null = null;
  
  const dispatch = createEventDispatcher();

  async function handleAdvancedSearch() {
    if (!term.trim()) {
      error = '德语词不能为空。';
      return;
    }
    isLoading = true;
    error = null;

    try {
      const payload: IntelligentSearchRequest = { term, hint };
      const response = await fetch(`https://de-ai-hilfer-api.onrender.com/api/v1/intelligent_search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || '高级查询失败');
      }

      const result: AnalyzeResponse = await response.json();
      dispatch('searchSuccess', result);

    } catch (e: any) {
      error = e.message;
    } finally {
      isLoading = false;
    }
  }
</script>

<header class="flex items-center justify-between p-4 border-b dark:border-gray-700">
  <h2 class="text-xl font-bold">高级查询</h2>
  <button on:click={() => dispatch('close')} class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" aria-label="关闭">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  </button>
</header>

<main class="p-6">
  <form on:submit|preventDefault={handleAdvancedSearch}>
    <div class="space-y-4">
      <div>
        <label for="term" class="block text-sm font-medium text-gray-700 dark:text-gray-300">德语词 (或拼写)</label>
        <input 
          bind:value={term}
          id="term"
          type="text"
          class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label for="hint" class="block text-sm font-medium text-gray-700 dark:text-gray-300">补充提示 (可选)</label>
        <input 
          bind:value={hint}
          id="hint"
          type="text"
          placeholder="例如：兴趣的意思"
          class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </div>

    {#if error}
      <p class="text-red-500 text-sm mt-4">{error}</p>
    {/if}

    <div class="mt-6 flex justify-end">
      <button 
        type="submit"
        disabled={isLoading}
        class="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {isLoading ? '查询中...' : '提交查询'}
      </button>
    </div>
  </form>
</main>