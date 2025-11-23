export enum RoastStyle {
  YIN_YANG = '阴阳怪气', // Passive aggressive, sarcastic
  LOGIC_MASTER = '逻辑暴击', // Deconstructs arguments logically but harshly
  CULTURAL_REF = '引经据典', // Uses memes, poems, or obscure references
  SHORT_PUNCHY = '言简意赅', // Short, emotional damage
}

export interface Source {
  title: string;
  uri: string;
}

export interface RoastResponse {
  style: string;
  content: string;
  attackPower: number; // 1-100
  explanation?: string; // Why this works
  sources?: Source[]; // Grounding sources
}

export interface HistoryItem {
  id: string;
  input: string;
  responses: RoastResponse[];
  timestamp: number;
}