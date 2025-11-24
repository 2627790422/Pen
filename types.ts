export enum RoastStyle {
  // Main Modes
  SHORT_PUNCHY = '一针见血', // Tieba/Aggressive
  LOGIC_MASTER = '逻辑鬼才', // Logic/YinYang

  // Sub Modes (Specialized)
  SUN_BAR = '孙吧老哥',      // Abstract Emoji Aggression
  ANTI_MI = '原神对线',      // Anti-Genshin/MiHoYo Fan
  ANTI_FAIRY = '仙女克星',   // Anti-Radical Feminist/XXN
  MESUGAKI = '雌小鬼',       // Mesugaki/Little Devil
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