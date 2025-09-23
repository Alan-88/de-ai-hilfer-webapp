<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { RecentItem } from '$lib/types';

  let allItems: RecentItem[] = [];
  let isLoading = true;
  const dispatch = createEventDispatcher();

  onMount(async () => {
    try {
      const response = await fetch(`https://de-ai-hilfer-api.onrender.com/api/v1/entries/all`);
      if (response.ok) {
        allItems = await response.json();
      }
    } catch (e) {
      console.error('获取所有条目失败:', e);
    } finally {
      isLoading = false;
    }
  });

  function handleItemClick(query: string) {
    dispatch('itemClick', query);
  }
</script>

<header class="flex items-center justify-between p-4 border-b dark:border-gray-700">
  <h2 class="text-xl font-bold">浏览知识库 ({allItems.length} 个条目)</h2>
  <button 
    on:click={() => dispatch('close')}
    class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
    aria-label="关闭"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  </button>
</header>

<main class="flex-1 overflow-y-auto p-4">
  {#if isLoading}
    <p class="text-center">正在加载所有词条...</p>
  {:else}
    <ul class="space-y-2">
      {#each allItems as item (item.query_text)}
        <li class="rounded-lg">
          <button 
            class="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            on:click={() => handleItemClick(item.query_text)}
          >
            <p class="font-semibold text-gray-900 dark:text-white pointer-events-none">{item.query_text}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 truncate pointer-events-none">{item.preview}</p>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</main>