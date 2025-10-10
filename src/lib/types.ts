// src/lib/types.ts

// --- 与后端 app/schemas/dictionary.py 中的数据模型对应 ---

/**
 * 条目类型枚举
 */
export enum EntryType {
  WORD = "WORD",
  PHRASE = "PHRASE",
  PREFIX = "PREFIX",
  SUFFIX = "SUFFIX"
}

/**
 * 建议类型枚举
 */
export enum SuggestionType {
  DB_MATCH = "db_match",
  SPELL_CORRECTION = "spell_correction",
  NEW_WORD = "new_word"
}


/**
 * 最近查询条目的数据结构
 */
export interface RecentItem {
  query_text: string;
  preview: string;
}

/**
 * 建议基类
 */
export interface BaseSuggestion {
  suggestion_type: string;
}

/**
 * 数据库匹配建议的数据结构 (对应后端的 DBSuggestion)
 */
export interface DBSuggestion extends BaseSuggestion {
  suggestion_type: SuggestionType.DB_MATCH;
  entry_id: number;
  query_text: string;
  preview: string;
  analysis_markdown: string;
  source: "generated" | "知识库";
  follow_ups: FollowUpItem[];
}

/**
 * 拼写修正建议的数据结构
 */
export interface SpellCorrectionSuggestion extends BaseSuggestion {
  suggestion_type: SuggestionType.SPELL_CORRECTION;
  original_query: string;
  corrected_query: string;
}

/**
 * 新词建议的数据结构
 */
export interface NewWordSuggestion extends BaseSuggestion {
  suggestion_type: SuggestionType.NEW_WORD;
  query_text: string;
}

/**
 * 联合建议类型
 */
export type Suggestion = DBSuggestion | SpellCorrectionSuggestion | NewWordSuggestion;

/**
 * 建议响应数据结构
 */
export interface SuggestionResponse {
  suggestions: Suggestion[];
}

/**
 * 追问条目的数据结构
 */
export interface FollowUpItem {
  id: number;
  question: string;
  answer: string;
}
export interface AnalyzeResponse {
  entry_id: number;
  query_text: string;
  analysis_markdown: string;
  source: "generated" | "知识库";
  follow_ups: FollowUpItem[];
}

/**
 * 智能搜索请求数据结构
 */
export interface IntelligentSearchRequest {
  term: string;
  hint: string;
}

/**
 * 创建追问请求数据结构
 */
export interface FollowUpCreateRequest {
  entry_id: number;
  question: string;
}

/**
 * 创建别名请求数据结构
 */
export interface AliasCreateRequest {
  alias_text: string;
  entry_query_text: string;
}

// --- 学习模块 V2 类型定义 ---

/**
 * 学习进度的数据模型 (对应后端的 LearningProgressResponse)
 */
export interface LearningProgress {
  mastery_level: number;
  review_count: number;
  next_review_at: string;
  last_reviewed_at?: string;
  ease_factor: number;
  interval: number;
}

/**
 * 每日学习队列中的单词模型 (对应后端的 LearningSessionWord)
 */
export interface LearningSessionWord {
  entry_id: number;
  query_text: string;
  analysis_markdown: string;
  repetitions_left: number;
  progress: LearningProgress | null; // progress 可能为 null（新词）
}

/**
 * 新的学习会话响应模型 (对应后端的 LearningSessionResponse)
 */
export interface LearningSessionResponse {
  current_word: LearningSessionWord | null;
  completed_count: number;
  total_count: number;
  is_completed: boolean;
}

/**
 * 复习质量评分枚举
 */
export enum ReviewQuality {
  COMPLETELY_FORGOT = 0,
  INCORRECT_BUT_REMEMBERED = 1,
  INCORRECT_WITH_HINT = 2,
  HESITANT = 3,
  CORRECT_WITH_HESITATION = 4,
  PERFECT = 5
}

/**
 * 卡片状态枚举
 */
export enum CardState {
  FRONT = 'front',
  HINT = 'hint',
  BACK = 'back'
}

/**
 * 学习模式枚举
 */
export enum LearningMode {
  CLASSIC = 'classic',
  QUIZ = 'quiz'
}

// ... (其他前端特有的类型可以保持不变)

// 其他需要的类型定义
export interface InsightResponse {
  insight: string;
}

export interface DynamicExampleResponse {
  example: string;
  translation: string;
}

export interface DynamicQuizResponse {
  question: string;
  options: string[];
  correct_answer: string | number;
  explanation: string;
}
