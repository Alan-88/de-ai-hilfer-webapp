<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { SessionWord } from '$lib/types';
  import { LearningMode, ReviewQuality } from '$lib/types';
  import { getLearningSession } from '$lib/learningApi';
  import ClassicCard from './ClassicCard.svelte';
  import QuizCard from './QuizCard.svelte';

  const QUIZ_MODE_MASTERY_THRESHOLD = 3;
  const QUIZ_MODE_PROBABILITY = 0.7;

  // --- 核心状态变量 ---
  let sessionWords: SessionWord[] = [];
  let currentIndex = 0;
  let relearningQueue: SessionWord[] = [];
  let isRelearningPhase = false;
  let initialWordCount = 0; // 用于计算进度条

  let isLoading = true;
  let error: string | null = null;
  let learningMode: LearningMode = LearningMode.CLASSIC;
  
  // --- 状态持久化 ---
  const SESSION_STORAGE_KEY = 'learning_session_state';

  function saveSessionState() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const state = {
        sessionWords,
        currentIndex,
        relearningQueue,
        isRelearningPhase,
        initialWordCount
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
    }
  }

  function loadSessionState() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedState = localStorage.getItem(SESSION_STORAGE_KEY);
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          // 简单验证一下 state 是否有效
          if (state && Array.isArray(state.sessionWords) && state.sessionWords.length > 0) {
            sessionWords = state.sessionWords;
            currentIndex = state.currentIndex;
            relearningQueue = state.relearningQueue;
            isRelearningPhase = state.isRelearningPhase;
            initialWordCount = state.initialWordCount;
            isLoading = false;
            return true; // 表示成功从 localStorage 加载
          }
        } catch (e) {
          console.error("Failed to parse saved session state:", e);
          clearSessionState();
        }
      }
    }
    return false; // 表示没有加载到有效状态
  }

  function clearSessionState() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  onMount(async () => {
    // 尝试从 localStorage 恢复会话，如果失败或不存在，则加载新会话
    if (!loadSessionState()) {
      await loadNewSession();
    }
  });
  
  // 页面关闭前清理状态
  onDestroy(() => {
    // 可以选择在这里清理，或者让用户手动开始新会话
    // clearSessionState(); 
  });

  // --- 学习流程控制 ---
  
  async function loadNewSession() {
    isLoading = true;
    error = null;
    clearSessionState(); // 开始新会话前清空旧状态

    try {
      const { review_words, new_words } = await getLearningSession(5);
      const combined = [...review_words, ...new_words];
      
      if (combined.length === 0) {
          sessionWords = [];
          initialWordCount = 0;
      } else {
          sessionWords = combined.sort(() => Math.random() - 0.5);
          initialWordCount = sessionWords.length;
      }
      
      currentIndex = 0;
      relearningQueue = [];
      isRelearningPhase = false;

    } catch (e: any) {
      error = e.message || '获取学习会话失败';
    } finally {
      isLoading = false;
    }
  }

  function handleReviewed(word: SessionWord, quality: number) {
    // 记忆质量差，加入"重学队列"
    if (quality < 4) {
      // 避免重复添加
      if (!relearningQueue.some(item => item.id === word.id)) {
          relearningQueue.push(word);
      }
    }

    if (isRelearningPhase) {
      // 巩固阶段：如果答对了，就从队列中移除
      if (quality >= 4) {
        relearningQueue = relearningQueue.filter(item => item.id !== word.id);
      } else {
        // 如果答错了，把它移到队尾，实现轮换
        const failedWord = relearningQueue.shift();
        if (failedWord) {
            relearningQueue.push(failedWord);
        }
      }
    } else {
      // 学习阶段：正常推进
      currentIndex++;
    }

    // 检查是否需要切换到巩固阶段
    if (!isRelearningPhase && currentIndex >= sessionWords.length && relearningQueue.length > 0) {
      isRelearningPhase = true;
    }
  }

  function handleRestart() {
    loadNewSession();
  }

  // --- 响应式计算属性 ---

  // 当前应该学习的单词
  $: currentWord = isRelearningPhase ? relearningQueue[0] : sessionWords[currentIndex];

  // 是否已完成所有学习
  $: isCompleted = !isLoading && initialWordCount > 0 && currentIndex >= sessionWords.length && relearningQueue.length === 0;

  // 进度条计算（只反映主线学习进度）
  $: progress = initialWordCount > 0 ? (currentIndex / initialWordCount) * 100 : 0;

  // 自动切换学习模式
  $: if (currentWord) {
    learningMode = LearningMode.CLASSIC; // 默认
    if (currentWord.mastery_level && currentWord.mastery_level >= QUIZ_MODE_MASTERY_THRESHOLD) {
      if (Math.random() < QUIZ_MODE_PROBABILITY) {
        learningMode = LearningMode.QUIZ;
      }
    }
  }
  
  // 每次状态变化后都保存
  $: if (!isLoading) {
      saveSessionState();
  }
</script>

<div class="min-h-screen flex flex-col items-center justify-start pt-20 px-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
  <div class="w-full max-w-4xl mx-auto mb-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">智能学习</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
            {#if isRelearningPhase}
                正在巩固今天不熟悉的单词...
            {:else}
                基于间隔重复的个性化学习体验
            {/if}
        </p>
      </div>
       <button on:click={() => window.history.back()} class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200">
        返回
      </button>
    </div>

    {#if initialWordCount > 0}
      <div class="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {#if isRelearningPhase}
              巩固阶段 (剩余 {relearningQueue.length} 个)
            {:else}
              学习进度
            {/if}
          </span>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {Math.min(currentIndex, initialWordCount)} / {initialWordCount}
          </span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" style="width: {progress}%"></div>
        </div>
      </div>
    {/if}
  </div>

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
          <button on:click={loadNewSession} class="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200">
            重试
          </button>
        </div>
      </div>
    {:else if isCompleted}
      <div class="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div class="mb-6">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">🎉 今日学习完成！</h2>
        </div>
        <div class="space-y-3">
          <button on:click={handleRestart} class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200">
            开始新的学习
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
      <div class="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">暂无学习内容</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">今天没有需要复习的单词，也没有新词要学习。</p>
        <button on:click={loadNewSession} class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200">
          刷新会话
        </button>
      </div>
    {/if}
  </div>
</div>
