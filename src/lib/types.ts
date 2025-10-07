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

/**
 * 分析请求数据结构
 */
export interface AnalyzeRequest {
  query_text: string;
  entry_type?: EntryType;
}

/**
 * 后端 /analyze 接口成功返回的数据结构
 */
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
