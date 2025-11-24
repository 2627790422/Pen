export enum RoastStyle {
  // Main Modes
  SHORT_PUNCHY = '一针见血', // Main 1: Aggressive Tieba/Zuan
  LOGIC_MASTER = '逻辑鬼才', // Main 2: Colloquial Logic/Metaphor

  // Sub Modes (Specialized)
  SUN_BAR = '孙吧哥',      // Abstract Emoji/Malice
  ANTI_MI = '米卫兵',      // Anti-Genshin/OP
  ANTI_FAIRY = '小仙女',   // Anti-Fairy/Gender
  MESUGAKI = '雌小鬼',     // Imp/Zayu
}

export interface RoastResponse {
  id: string;
  style: string;
  content: string;
  attackPower: number; // 1-100
}

export interface HistoryItem {
  id: string;
  input: string;
  responses: RoastResponse[];
  timestamp: number;
}