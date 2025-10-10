<script lang="ts">
  import { onMount } from 'svelte';
  import type { SessionWord } from '$lib/types';
  import { CardState, ReviewQuality } from '$lib/types';
  import { getInsightHint, generateDynamicExample, submitReview } from '$lib/learningApi';
  import QualityRating from './QualityRating.svelte';
  import Modal from './Modal.svelte';
  import MarkdownRenderer from './MarkdownRenderer.svelte';

  export let wordData: SessionWord;
  export let onReviewed: (word: SessionWord, quality: number) => void = () => {};

  let cardState: CardState = CardState.FRONT;
  let insightContent = '';
  let isLoading = false;
  let error: string | null = null;
  let showExampleModal = false;
  let exampleData: { example_sentence: string; translation: string } | null = null;
  let isSubmitting = false;

  async function handleForgot() {
    isLoading = true;
    error = null;
    try {
      const entryId = wordData.entry_id || wordData.id;
      const hintData = await getInsightHint(entryId);
      insightContent = hintData.insight;
      cardState = CardState.HINT;
    } catch (e: any) {
      error = e.message || '获取提示失败';
    } finally {
      isLoading = false;
    }
  }

  function handleShowAnswer() {
    cardState = CardState.BACK;
  }

  async function handleRememberedWithHint() {
    await submitReviewWithQuality(ReviewQuality.INCORRECT_WITH_HINT);
  }

  function handleStillForgot() {
    cardState = CardState.BACK;
  }

  async function submitReviewWithQuality(quality: ReviewQuality) {
    if (isSubmitting) return;
    
    isSubmitting = true;
    try {
      const entryId = wordData.entry_id || wordData.id;
      await submitReview(entryId, quality);
      onReviewed(wordData, quality);
    } catch (e: any) {
      error = e.message || '提交复习结果失败';
      isSubmitting = false;
    }
  }

  async function handleGenerateExample() {
    if (isSubmitting) return;
    
    isSubmitting = true;
    try {
      const entryId = wordData.entry_id || wordData.id;
      const data = await generateDynamicExample(entryId);
      exampleData = data;
      showExampleModal = true;
    } catch (e: any) {
      error = e.message || 'AI生成例句失败';
    } finally {
      isSubmitting = false;
    }
  }

  function resetCard() {
    cardState = CardState.FRONT;
    insightContent = '';
    error = null;
    isSubmitting = false;
  }

  // 当单词数据变化时重置卡片状态
  $: if (wordData) {
    resetCard();
  }
</script>

<div class="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-2xl mx-auto">
  {#if error}
    <div class="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-4" role="alert">
      <strong class="font-bold">错误:</strong>
      <span class="block sm:inline">{error}</span>
    </div>
  {/if}

  {#if cardState === CardState.FRONT}
    <!-- 正面：显示单词 -->
    <div class="text-center py-12">
      <h2 class="text-5xl font-bold text-gray-900 dark:text-white mb-8">
        {wordData.query_text}
      </h2>
      <div class="space-y-4">
        <button
          on:click={handleForgot}
          disabled={isLoading}
          class="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors duration-200"
        >
          {isLoading ? '获取提示中...' : '忘记了'}
        </button>
        <button
          on:click={handleShowAnswer}
          class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          查看答案
        </button>
      </div>
    </div>

  {:else if cardState === CardState.HINT}
    <!-- 提示面：显示深度解析 -->
    <div class="space-y-6">
      <div class="text-center">
        <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          {wordData.query_text}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">提示：深度解析</p>
      </div>
      
      <!-- 固定高度的提示展示区域 -->
      <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 h-64 overflow-y-auto">
        <MarkdownRenderer markdownContent={insightContent} />
      </div>
      
      <div class="space-y-3">
        <button
          on:click={handleRememberedWithHint}
          disabled={isSubmitting}
          class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors duration-200"
        >
          {isSubmitting ? '提交中...' : '有提示后记起'}
        </button>
        <button
          on:click={handleStillForgot}
          class="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          仍忘记，看答案
        </button>
      </div>
    </div>

  {:else if cardState === CardState.BACK}
    <!-- 背面：显示完整答案和评分 -->
    <div class="space-y-6">
      <div class="text-center">
        <h3 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {wordData.query_text}
        </h3>
      </div>
      
      <!-- 固定高度的释义展示区域 -->
      <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 h-64 overflow-y-auto border border-gray-200 dark:border-gray-700">
        <MarkdownRenderer markdownContent={wordData.analysis_markdown || wordData.preview} />
      </div>
      
      <QualityRating 
        onRating={submitReviewWithQuality} 
        disabled={isSubmitting}
      />
      
      <div class="flex justify-center">
        <button
          on:click={handleGenerateExample}
          disabled={isSubmitting}
          class="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          {isSubmitting ? '生成中...' : 'AI造句'}
        </button>
      </div>
    </div>
  {/if}
</div>

<!-- AI例句模态框 -->
<Modal bind:showModal={showExampleModal} on:close={() => showExampleModal = false}>
  <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full">
    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">AI动态例句</h3>
    {#if exampleData}
      <div class="space-y-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p class="text-gray-900 dark:text-white font-medium">{exampleData.example_sentence}</p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p class="text-gray-700 dark:text-gray-300">{exampleData.translation}</p>
        </div>
      </div>
    {/if}
    <div class="mt-6 flex justify-end">
      <button
        on:click={() => showExampleModal = false}
        class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
      >
        关闭
      </button>
    </div>
  </div>
</Modal>
