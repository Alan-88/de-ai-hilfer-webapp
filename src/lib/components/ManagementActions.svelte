<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { AnalyzeResponse } from '$lib/types';

  export let entry: AnalyzeResponse;

  let showAliasForm = false;
  let newAlias = '';
  let isLoading: 'alias' | 'regenerate' | 'delete' | '' = '';
  let error: string | null = null;

  const dispatch = createEventDispatcher();

  // --- Action Handlers (logic remains the same) ---
  async function handleAddAlias() {
    if (!newAlias.trim()) return;
    isLoading = 'alias';
    error = null;
    try {
      const response = await fetch(`https://de-ai-hilfer-api.onrender.com/api/v1/aliases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias_text: newAlias, entry_query_text: entry.query_text })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || '添加别名失败');
      }
      dispatch('actionSuccess', `成功添加别名 "${newAlias}"`);
      newAlias = '';
      showAliasForm = false;
    } catch (e: any) {
      error = e.message;
    } finally {
      isLoading = '';
    }
  }

  async function handleRegenerate() {
    isLoading = 'regenerate';
    try {
      const response = await fetch(`https://de-ai-hilfer-api.onrender.com/api/v1/entries/${entry.entry_id}/regenerate`, {
        method: 'POST'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || '重新生成失败');
      }
      const updatedEntry = await response.json();
      dispatch('entryUpdated', updatedEntry);
      dispatch('actionSuccess', '重新生成分析成功！');
    } catch (e: any) {
      dispatch('actionError', e.message);
    } finally {
      isLoading = '';
    }
  }

  async function handleDelete() {
    if (!confirm(`确定要永久删除词条 "${entry.query_text}" 吗？此操作不可逆！`)) return;
    isLoading = 'delete';
    try {
      const response = await fetch(`https://de-ai-hilfer-api.onrender.com/api/v1/entries/${entry.entry_id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || '删除失败');
      }
      dispatch('entryDeleted', `成功删除词条 "${entry.query_text}"`);
    } catch (e: any) {
      dispatch('actionError', e.message);
    } finally {
      isLoading = '';
    }
  }

</script>

<div class="mt-8 border-t dark:border-gray-700 pt-6">
  <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">管理操作</h4>
  
  <div class="flex flex-wrap gap-3">
    <button on:click={() => showAliasForm = !showAliasForm} class="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
      {showAliasForm ? '取消添加别名' : '＋ 添加别名'}
    </button>
    <button on:click={handleRegenerate} disabled={!!isLoading} class="flex items-center px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50">
      {#if isLoading === 'regenerate'}
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        生成中...
      {:else}
        🔄 重新生成
      {/if}
    </button>
    <button on:click={handleDelete} disabled={!!isLoading} class="flex items-center px-4 py-2 text-sm bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
       {#if isLoading === 'delete'}
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        删除中...
      {:else}
        🗑️ 删除
      {/if}
    </button>
  </div>

  {#if showAliasForm}
    <form on:submit|preventDefault={handleAddAlias} class="mt-4 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
      <input
        bind:value={newAlias}
        type="text"
        placeholder="输入新的别名, 例如 ginge"
        class="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {#if error}
        <p class="text-red-500 text-sm mt-1">{error}</p>
      {/if}
      <div class="flex justify-end mt-2">
        <button type="submit" disabled={!newAlias.trim() || isLoading === 'alias'} class="flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 w-28">
          {#if isLoading === 'alias'}
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          {:else}
            确认添加
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>