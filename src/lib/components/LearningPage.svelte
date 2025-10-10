<script lang="ts">
  import { onMount } from 'svelte';
  import type { SessionWord } from '$lib/types';
  import { LearningMode } from '$lib/types';
  import { getLearningSession } from '$lib/learningApi';
  import ClassicCard from './ClassicCard.svelte';
  import QuizCard from './QuizCard.svelte';

  const QUIZ_MODE_MASTERY_THRESHOLD = 3; // 熟练度达到3级时，开始进入Quiz模式
  const QUIZ_MODE_PROBABILITY = 0.7; // 达到阈值后，有70%的概率进入Quiz模式

  let sessionWords: SessionWord[] = [];
  let currentIndex = 0;
  let isLoading = true;
  let error: string | null = null;
  let learningMode: LearningMode = LearningMode.CLASSIC;

  onMount(async () => {
    await loadSession();
  });

  async function loadSession() {
    isLoading = true;
    error = null;
    try {
      const { review_words, new_words } = await getLearningSession(5);
      // 注意：后端返回的 review_words 包含 progress 信息，而 new_words 只有 entry 信息
      const combined = [...review_words, ...new_words];
      // 打乱顺序
      sessionWords = combined.sort(() => Math.random() - 0.5);
      currentIndex = 0;
    } catch (e: any) {
      error = e.message || '获取学习会话失败';
    } finally {
      isLoading = false;
    }
  }

  function handleNextWord() {
    currentIndex += 1;
    // 重置学习模式，让系统重新决定
    learningMode = LearningMode.CLASSIC;
  }

  function handleRestart() {
    currentIndex = 0;
    learningMode = LearningMode.CLASSIC;
  }

  function getNewSession() {
    loadSession();
  }

  // 自适应模式切换逻辑
  $: if (sessionWords[currentIndex]) {
    const currentWord = sessionWords[currentIndex];
    
    // 默认经典模式
    learningMode = LearningMode.CLASSIC;
    
    // 新词(没有mastery_level)或熟练度低的词，使用经典模式
    if (currentWord.mastery_level && currentWord.mastery_level >= QUIZ_MODE_MASTERY_THRESHOLD) {
      if (Math.random() < QUIZ_MODE_PROBABILITY) {
        learningMode = LearningMode.QUIZ;
      }
    }
  }

  $: currentWord = sessionWords[currentIndex];
  $: isCompleted = currentIndex >= sessionWords.length;
  $: progress = sessionWords.length > 0 ? (currentIndex / sessionWords.length) * 100 : 0;
</script>

<div class="min-h-screen flex flex-col items-center justify-start pt-20 px-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
  <!-- 头部 -->
  <div class="w-full max-w-4xl mx-auto mb-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">智能学习</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">基于间隔重复的个性化学习体验</p>
      </div>
      <button
        on:click={() => window.history.back()}
        class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
      >
        返回
      </button>
    </div>

    <!-- 进度条 -->
    {#if sessionWords.length > 0}
      <div class="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            学习进度
          </span>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {Math.min(currentIndex + 1, sessionWords.length)} / {sessionWords.length}
          </span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            class="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style="width: {progress}%"
          ></div>
        </div>
      </div>
    {/if}
  </div>

  <!-- 主要内容 -->
  <div class="w-full max-w-4xl mx-auto">
    {#if isLoading}
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">正在准备学习内容...</p>
      </div>

    {:else if error}
      <div class="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-6 py-4 rounded-xl" role="alert">
        <div class="text-center">
          <strong class="font-bold text-lg">加载失败</strong>
          <p class="mt-2">{error}</p>
          <button
            on:click={getNewSession}
            class="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            重试
          </button>
        </div>
      </div>

    {:else if isCompleted}
      <!-- 学习完成 -->
      <div class="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div class="mb-6">
          <div class="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600 dark:text-green-400">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎉 今日学习完成！
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">
            你已经完成了 {sessionWords.length} 个单词的学习
          </p>
        </div>

        <div class="space-y-3">
          <button
            on:click={handleRestart}
            class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            重新学习
          </button>
          <button
            on:click={getNewSession}
            class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            开始新的学习
          </button>
          <button
            on:click={() => window.history.back()}
            class="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            返回主页
          </button>
        </div>
      </div>

    {:else if currentWord}
      <!-- 学习卡片 -->
      <div class="mb-6">
        <!-- 模式指示器 -->
        <div class="flex justify-center mb-4">
          {#if learningMode === LearningMode.QUIZ}
            <span class="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-sm font-medium rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              智能问答模式
            </span>
          {:else}
            <span class="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              经典学习模式
            </span>
          {/if}
        </div>

        {#if learningMode === LearningMode.QUIZ}
          <QuizCard 
            wordData={currentWord} 
            onReviewed={handleNextWord} 
          />
        {:else}
          <ClassicCard 
            wordData={currentWord} 
            onReviewed={handleNextWord} 
          />
        {/if}
      </div>

      <!-- 学习统计 -->
      <div class="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex justify-around text-center">
          <div>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{currentIndex + 1}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">当前进度</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">{sessionWords.length - currentIndex - 1}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">剩余单词</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{Math.round(progress)}%</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">完成度</p>
          </div>
        </div>
      </div>
    {:else}
      <!-- 没有学习内容 -->
      <div class="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div class="mb-6">
          <div class="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-600 dark:text-yellow-400">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            暂无学习内容
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            今天没有需要复习的单词，也没有新词要学习
          </p>
        </div>

        <button
          on:click={getNewSession}
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          刷新页面
        </button>
      </div>
    {/if}
  </div>
</div>
