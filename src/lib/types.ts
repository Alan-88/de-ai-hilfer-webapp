// --- 与后端 app/schemas/dictionary.py 中的数据模型对应 ---

/**
 * 最近查询条目的数据结构
 */
export interface RecentItem {
  query_text: string;
  preview: string;
}

/**
 * 数据库匹配建议的数据结构 (对应后端的 DBSuggestion)
 */
export interface Suggestion {
  suggestion_type: "db_match";
  entry_id: number;
  query_text: string;
  preview: string;
  analysis_markdown: string;
  source: "generated" | "知识库";
  follow_ups: FollowUpItem[];
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
 * 后端 /analyze 接口成功返回的数据结构
 */
export interface AnalyzeResponse {
  entry_id: number;
  query_text: string;
  analysis_markdown: string;
  source: "generated" | "知识库";
  follow_ups: FollowUpItem[];
}

export interface IntelligentSearchRequest {
  term: string;
  hint: string;
}