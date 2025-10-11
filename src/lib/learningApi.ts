// src/lib/learningApi.ts

import type {
  LearningSessionResponse,
  InsightResponse,
  DynamicExampleResponse,
  DynamicQuizResponse,
  ReviewQuality
} from '$lib/types';

const API_BASE_URL = 'https://de-ai-hilfer-api.onrender.com/api/v1/learning';

/**
 * 获取学习会话 V2: 获取当前需要学习的单词
 */
export async function getLearningSession(newWordsLimit = 5): Promise<LearningSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/session/v2?limit_new_words=${newWordsLimit}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `获取学习会话失败: ${response.status}`);
  }
  return response.json();
}

/**
 * 提交复习结果 V2
 */
export async function submitReview(entryId: number, quality: ReviewQuality): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/review/v2/${entryId}?quality=${quality}`, {
    method: 'POST'
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `提交复习结果失败: ${response.status}`);
  }
  await response.json();
}

// --- 其他辅助 API 调用保持不变 ---

/**
 * 获取"深度解析"提示
 */
export async function getInsightHint(entryId: number): Promise<InsightResponse> {
  const response = await fetch(`${API_BASE_URL}/insight/${entryId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `获取深度解析失败: ${response.status}`);
  }
  return response.json();
}

/**
 * AI 动态生成例句
 */
export async function generateDynamicExample(entryId: number): Promise<DynamicExampleResponse> {
  const response = await fetch(`${API_BASE_URL}/example/${entryId}`, {
    method: 'POST'
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `生成例句失败: ${response.status}`);
  }
  return response.json();
}

/**
 * AI 动态生成测验题
 */
export async function generateDynamicQuiz(entryId: number): Promise<DynamicQuizResponse> {
  const response = await fetch(`${API_BASE_URL}/quiz/${entryId}`, {
    method: 'POST'
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `生成测验题失败: ${response.status}`);
  }
  return response.json();
}

/**
 * 添加单词到学习计划
 */
export async function addWordToLearning(entryId: number): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/add/${entryId}`, {
    method: 'POST'
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `添加单词到学习计划失败: ${response.status}`);
  }
  return response.json();
}
