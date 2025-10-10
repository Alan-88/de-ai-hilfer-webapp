<script lang="ts">
  import { onMount } from 'svelte';
  // 核心改动：导入新的 LearningSessionWord 类型
  import type { LearningSessionWord } from '$lib/types';
  import { CardState, ReviewQuality } from '$lib/types';
  import { getInsightHint, generateDynamicExample, submitReview } from '$lib/learningApi';
  import QualityRating from './QualityRating.svelte';
  import Modal from './Modal.svelte';
  import MarkdownRenderer from './MarkdownRenderer.svelte';

  // 核心改动：更新 wordData 的类型
  export let wordData: LearningSessionWord;
  export let onReviewed: (word: LearningSessionWord, quality: number) => void = () => {};

  let cardState: CardState = CardState.FRONT;
  let insightContent = '';
  let isLoading = false;
  let error: string | null = null;
  let showExampleModal = false;
  let exampleData: { sentence: string; translation: string } | null = null;
  let isSubmitting = false;

  async function handleForgot() {
    isLoading = true;
    error = null;
    try {
      const hintData = await getInsightHint(wordData.entry_id);
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


  async function submitReviewWithQuality(quality: ReviewQuality) {
    if (isSubmitting) return;
    
    isSubmitting = true;
    try {
      await submitReview(wordData.entry_id, quality);
      onReviewed(wordData, quality);
    } catch (e: any) {
      error = e.message || '提交复习结果失败';
      isSubmitting = false;
    }
  }

  async function handleGenerateExample() {
    // 逻辑不变
  }

  function resetCard() {
    cardState = CardState.FRONT;
    insightContent = '';
    error = null;
    isSubmitting = false;
    showExampleModal = false;
    exampleData = null;
  }

  // 使用 key 语句在 wordData 变化时重置卡片
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
        <button on:click={handleForgot} disabled={isLoading} class="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white font-medium rounded-lg">
          {isLoading ? '获取提示中...' : '忘记了 (获取提示)'}
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
      
      <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 max-h-64 overflow-y-auto border border-yellow-200 dark:border-yellow-800">
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
        <button on:click={handleShowAnswer} class="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg">
          仍然忘记，看答案
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
      
      <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700">
        <MarkdownRenderer markdownContent={wordData.analysis_markdown} />
      </div>
      <QualityRating 
        onRating={submitReviewWithQuality} 
        disabled={isSubmitting}
      />
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
          <p class="text-gray-900 dark:text-white font-medium">{exampleData.sentence}</p>
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
