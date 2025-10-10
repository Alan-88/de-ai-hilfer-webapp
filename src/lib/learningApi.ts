import type { 
  LearningSessionResponse, 
  InsightResponse, 
  DynamicExampleResponse, 
  DynamicQuizResponse,
  ReviewQuality
} from '$lib/types';

const API_BASE_URL = 'https://de-ai-hilfer-api.onrender.com/api/v1/learning';

/**
 * 获取学习会话 (包含复习词和新词)
 */
export async function getLearningSession(newWordsLimit = 5): Promise<LearningSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/session?limit_new_words=${newWordsLimit}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `获取学习会话失败: ${response.status}`);
  }
  return response.json();
}

/**
 * 提交复习结果
 */
export async function submitReview(entryId: number, quality: ReviewQuality): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/review/${entryId}?quality=${quality}`, { 
    method: 'POST' 
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `提交复习结果失败: ${response.status}`);
  }
}

/**
 * 获取"深度解析"提示
 */
export async function getInsightHint(entryId: number): Promise<InsightResponse> {
  const response = await fetch(`${API_BASE_URL}/insight/${entryId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `获取提示失败: ${response.status}`);
  }
  return response.json();
}

/**
 * AI 动态生成例句
 */
export async function generateDynamicExample(entryId: number): Promise<DynamicExampleResponse> {
  const response = await fetch(`${API_BASE_URL}/generate-example/${entryId}`, { 
    method: 'POST' 
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `AI生成例句失败: ${response.status}`);
  }
  return response.json();
}

/**
 * AI 动态生成测验题
 */
export async function generateDynamicQuiz(entryId: number): Promise<DynamicQuizResponse> {
  const response = await fetch(`${API_BASE_URL}/generate-quiz/${entryId}`, { 
    method: 'POST' 
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `AI生成题目失败: ${response.status}`);
  }
  return response.json();
}

/**
 * 获取学习进度信息
 */
export async function getLearningProgress(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/progress`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `获取学习进度失败: ${response.status}`);
  }
  return response.json();
}

/**
 * 获取学习统计信息
 */
export async function getLearningStats(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/stats`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `获取学习统计失败: ${response.status}`);
  }
  return response.json();
}

/**
 * 获取所有词库单词
 */
export async function getAllWords(): Promise<any[]> {
  const response = await fetch(`https://de-ai-hilfer-api.onrender.com/api/v1/entries/all`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `获取词库失败: ${response.status}`);
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
    throw new Error(errorData.detail || `添加单词失败: ${response.status}`);
  }
  return response.json();
}
