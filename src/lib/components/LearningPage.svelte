<script lang="ts">
  import { onMount } from 'svelte';
  import type { LearningSessionResponse, LearningSessionWord } from '$lib/types';
  import { LearningMode } from '$lib/types';
  import { getLearningSession, submitReview } from '$lib/learningApi';
  import ClassicCard from './ClassicCard.svelte';
  import QuizCard from './QuizCard.svelte';

  const QUIZ_MODE_MASTERY_THRESHOLD = 3;
  const QUIZ_MODE_PROBABILITY = 0.7;

  // --- 核心状态 V2 ---
  let sessionState: LearningSessionResponse | null = null;
  let isLoading = true;
  let error: string | null = null;
  let learningMode: LearningMode = LearningMode.CLASSIC;

  onMount(async () => {
    await loadNextWord();
  });

  // --- 学习流程控制 V2 ---
  async function loadNextWord() {
    isLoading = true;
    error = null;
    try {
      const data = await getLearningSession();
      sessionState = data;
    } catch (e: any) {
      error = e.message || '获取学习会话失败';
    } finally {
      isLoading = false;
    }
  }

  async function handleReviewed(word: LearningSessionWord, quality: number) {
    try {
      // 1. 先提交复习结果
      await submitReview(word.entry_id, quality);
      // 2. 然后立即获取下一个单词
      await loadNextWord();
    } catch (e: any) {
      error = e.message || '处理复习结果时出错';
    }
  }
  
  function handleRestart() {
    // 这里可以调用一个后端的 "reset" 端点，或者简单地重新加载
    window.location.reload(); 
  }

  // --- 响应式计算属性 V2 ---

  $: currentWord = sessionState?.current_word;
  $: isCompleted = sessionState?.is_completed ?? false;
  $: progress = sessionState ? (sessionState.completed_count / sessionState.total_count) * 100 : 0;
  $: totalCount = sessionState?.total_count ?? 0;
  $: completedCount = sessionState?.completed_count ?? 0;

  // 智能自适应学习流
  $: if (currentWord) {
    // --- 【开关】 ---
    // TODO: 智能问答模式（Quiz Mode）功能开关。设为 true 以启用。
    // 当前该功能因体验问题暂时搁置，待后续在独立分支进行优化。
    const enableQuizMode = false;
    
    learningMode = LearningMode.CLASSIC; // 默认经典模式
    // 如果单词有关联的学习进度并且熟练度达标
    if (enableQuizMode && currentWord.progress && currentWord.progress.mastery_level >= QUIZ_MODE_MASTERY_THRESHOLD) {
      if (Math.random() < QUIZ_MODE_PROBABILITY) {
        learningMode = LearningMode.QUIZ;
      }
    }
  }
</script>

<div class="min-h-screen flex flex-col items-center justify-start pt-20 px-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
  <div class="w-full max-w-4xl mx-auto mb-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">智能学习 V2</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">由每日动态队列驱动</p>
      </div>
      <button on:click={() => window.history.back()} class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors">
        返回
      </button>
    </div>

    {#if totalCount > 0}
      <div class="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">学习进度</span>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{completedCount} / {totalCount}</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: {progress}%"></div>
        </div>
      </div>
    {/if}
  </div>

  <div class="w-full max-w-4xl mx-auto">
    {#if isLoading}
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">正在获取下一个单词...</p>
      </div>
    {:else if error}
       <div class="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 px-6 py-4 rounded-xl" role="alert">
        <div class="text-center">
          <strong class="font-bold text-lg">加载失败</strong>
          <p class="mt-2">{error}</p>
          <button on:click={loadNextWord} class="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg">
            重试
          </button>
        </div>
      </div>
    {:else if isCompleted}
      <div class="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-12 text-center">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">🎉 今日学习完成！</h2>
        <div class="space-y-3 mt-6">
          <button on:click={handleRestart} class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
            开始新的一天
          </button>
        </div>
      </div>
    {:else if currentWord}
      <div class="mb-6">
        {#if learningMode === LearningMode.QUIZ}
          <QuizCard wordData={currentWord} onReviewed={handleReviewed} />
        {:else}
          <ClassicCard wordData={currentWord} onReviewed={handleReviewed} />
        {/if}
      </div>
    {:else}
      <div class="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-12 text-center">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">暂无学习内容</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">今天没有需要复习的单词，也没有新词要学习。</p>
        <button on:click={loadNextWord} class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
          刷新会话
        </button>
      </div>
    {/if}
  </div>
</div>
