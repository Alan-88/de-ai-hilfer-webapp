<script lang="ts">
  import { onMount } from 'svelte';
  import type { SessionWord } from '$lib/types';
  import { ReviewQuality } from '$lib/types';
  import { generateDynamicQuiz, submitReview } from '$lib/learningApi';
  import QualityRating from './QualityRating.svelte';
  import MarkdownRenderer from './MarkdownRenderer.svelte';

  export let wordData: SessionWord;
  export let onReviewed: () => void;

  let quizData: { question: string; options: string[]; correct_answer: string; explanation?: string } | null = null;
  let selectedOption: string | null = null;
  let isAnswered = false;
  let isLoading = true;
  let error: string | null = null;
  let isSubmitting = false;

  onMount(async () => {
    await loadQuiz();
  });

  async function loadQuiz() {
    isLoading = true;
    error = null;
    try {
      const data = await generateDynamicQuiz(wordData.entry_id);
      quizData = data;
    } catch (e: any) {
      error = e.message || '生成测验题失败';
    } finally {
      isLoading = false;
    }
  }

  function handleSelectOption(option: string) {
    if (isAnswered) return;
    selectedOption = option;
  }

  function handleSubmitAnswer() {
    if (!selectedOption) return;
    isAnswered = true;
  }

  async function submitReviewWithQuality(quality: ReviewQuality) {
    if (isSubmitting) return;
    
    isSubmitting = true;
    try {
      await submitReview(wordData.entry_id, quality);
      onReviewed();
    } catch (e: any) {
      error = e.message || '提交复习结果失败';
      isSubmitting = false;
    }
  }

  function getOptionClass(option: string) {
    if (!isAnswered) {
      return selectedOption === option 
        ? 'bg-blue-100 border-blue-500 dark:bg-blue-900/30 dark:border-blue-400' 
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700';
    }

    if (option === quizData?.correct_answer) {
      return 'bg-green-100 border-green-500 dark:bg-green-900/30 dark:border-green-400';
    }

    if (option === selectedOption && option !== quizData?.correct_answer) {
      return 'bg-red-100 border-red-500 dark:bg-red-900/30 dark:border-red-400';
    }

    return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600';
  }

  function getOptionIcon(option: string) {
    if (!isAnswered) return null;

    if (option === quizData?.correct_answer) {
      return '✓';
    }

    if (option === selectedOption && option !== quizData?.correct_answer) {
      return '✗';
    }

    return null;
  }

  function getInitialQuality(): ReviewQuality {
    if (!isAnswered || !selectedOption) return ReviewQuality.COMPLETELY_FORGOT;
    
    if (selectedOption === quizData?.correct_answer) {
      return ReviewQuality.PERFECT;
    }
    
    return ReviewQuality.COMPLETELY_FORGOT;
  }

  function resetQuiz() {
    quizData = null;
    selectedOption = null;
    isAnswered = false;
    isLoading = true;
    error = null;
    isSubmitting = false;
    loadQuiz();
  }

  // 当单词数据变化时重置测验
  $: if (wordData) {
    resetQuiz();
  }
</script>

<div class="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-2xl mx-auto">
  {#if error}
    <div class="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-4" role="alert">
      <strong class="font-bold">错误:</strong>
      <span class="block sm:inline">{error}</span>
    </div>
  {/if}

  {#if isLoading}
    <div class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600 dark:text-gray-400">AI正在生成测验题...</p>
    </div>

  {:else if quizData}
    <div class="space-y-6">
      <!-- 题目 -->
      <div class="text-center">
        <div class="mb-4">
          <span class="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-sm font-medium rounded-full">
            智能问答模式
          </span>
        </div>
        <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          {quizData.question}
        </h3>
      </div>

      <!-- 选项 -->
      <div class="space-y-3">
        {#each quizData.options as option}
          <button
            on:click={() => handleSelectOption(option)}
            disabled={isAnswered}
            class="w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between
                   {getOptionClass(option)}
                   {!isAnswered ? 'hover:scale-[1.02] active:scale-[0.98]' : ''}"
          >
            <span class="flex-1">{option}</span>
            {#if getOptionIcon(option)}
              <span class="ml-2 text-xl font-bold">
                {#if option === quizData?.correct_answer}
                  <span class="text-green-600 dark:text-green-400">✓</span>
                {:else}
                  <span class="text-red-600 dark:text-red-400">✗</span>
                {/if}
              </span>
            {/if}
          </button>
        {/each}
      </div>

      <!-- 提交答案按钮 -->
      {#if !isAnswered}
        <button
          on:click={handleSubmitAnswer}
          disabled={!selectedOption}
          class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
        >
          提交答案
        </button>
      {/if}

      <!-- 答案揭晓后 -->
      {#if isAnswered}
        <div class="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <!-- 正确答案说明 -->
          {#if quizData.explanation}
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p class="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">解释：</p>
              <p class="text-gray-700 dark:text-gray-300">{quizData.explanation}</p>
            </div>
          {/if}

          <!-- 单词完整解析 -->
          <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {wordData.query_text} - 完整解析
            </h4>
            <MarkdownRenderer markdownContent={wordData.analysis_markdown || wordData.preview} />
          </div>

          <!-- 评分 -->
          <QualityRating 
            onRating={submitReviewWithQuality} 
            disabled={isSubmitting}
          />

          <!-- 答题结果提示 -->
          <div class="text-center">
            {#if selectedOption === quizData?.correct_answer}
              <p class="text-green-600 dark:text-green-400 font-medium">🎉 回答正确！</p>
            {:else}
              <p class="text-red-600 dark:text-red-400 font-medium">💡 再接再厉！</p>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
