<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { FollowUpItem } from '$lib/types';

  export let entryId: number;

  let question = '';
  let isLoading = false;
  let error: string | null = null;

  const dispatch = createEventDispatcher();

  async function handleFollowUp() {
    if (!question.trim()) return;
    isLoading = true;
    error = null;

    try {
      const response = await fetch(`https://de-ai-hilfer-api.onrender.com/api/v1/follow-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entryId, question: question })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '请求失败');
      }
      
      const newFollowUp: FollowUpItem = await response.json();
      
      // 派遣 'newFollowUp' 事件，将新数据传递给父组件
      dispatch('newFollowUp', newFollowUp); 

      question = ''; // 清空输入框
      
    } catch (e: any) {
      error = e.message;
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="mt-8 border-t dark:border-gray-700 pt-6">
  <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">提出追问</h4>
  <form on:submit|preventDefault={handleFollowUp}>
    <textarea
      bind:value={question}
      disabled={isLoading}
      rows={3}
      placeholder="例如：这个词和 helfen 有什么区别？"
      class="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    ></textarea>
    {#if error}
      <p class="text-red-500 text-sm mt-1">{error}</p>
    {/if}
    <div class="flex justify-end mt-2">
      <button 
        type="submit"
        disabled={isLoading || !question.trim()}
        class="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? '思考中...' : '发送'}
      </button>
    </div>
  </form>
</div>