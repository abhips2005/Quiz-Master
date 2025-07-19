export interface User {
  id: string;
  email: string;
  role: 'teacher' | 'student';
  name: string;
  avatar_url?: string;
  created_at: string;
  total_points: number;
  streak: number;
  level: number;
  badges: Badge[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  teacher_id: string;
  questions: Question[];
  created_at: string;
  updated_at: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  time_limit: number;
  is_active: boolean;
}

export interface Question {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  points: number;
  time_limit: number;
  order_index: number;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
}

export interface GameSession {
  id: string;
  quiz_id: string;
  teacher_id: string;
  pin: string;
  status: 'waiting' | 'active' | 'completed';
  current_question: number;
  participants: Participant[];
  created_at: string;
  started_at?: string;
  ended_at?: string;
  settings: GameSettings;
}

export interface Participant {
  id: string;
  session_id: string;
  user_id?: string;
  nickname: string;
  score: number;
  correct_answers: number;
  streak: number;
  position: number;
  answers: Answer[];
  badges_earned: Badge[];
  join_time: string;
  is_active: boolean;
  users?: {
    name: string;
  };
}

export interface Answer {
  id: string;
  participant_id: string;
  question_id: string;
  answer: string | number;
  is_correct: boolean;
  time_taken: number;
  points_earned: number;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: string;
  points_value: number;
}

export interface GameSettings {
  show_leaderboard: boolean;
  allow_powerups: boolean;
  shuffle_questions: boolean;
  show_correct_answers: boolean;
  time_pressure: boolean;
  bonus_points: boolean;
}

export interface Leaderboard {
  participant_id: string;
  nickname: string;
  score: number;
  correct_answers: number;
  streak: number;
  position: number;
  badges: Badge[];
  level: number;
}

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  effect: string;
  duration?: number;
  uses_per_game: number;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  context: string;
}