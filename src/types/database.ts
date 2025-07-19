export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: 'teacher' | 'student';
          name: string;
          avatar_url?: string;
          created_at: string;
          total_points: number;
          streak: number;
          level: number;
        };
        Insert: {
          id: string;
          email: string;
          role: 'teacher' | 'student';
          name: string;
          avatar_url?: string;
          total_points?: number;
          streak?: number;
          level?: number;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'teacher' | 'student';
          name?: string;
          avatar_url?: string;
          total_points?: number;
          streak?: number;
          level?: number;
        };
      };
      quizzes: {
        Row: {
          id: string;
          title: string;
          description: string;
          teacher_id: string;
          created_at: string;
          updated_at: string;
          difficulty: 'easy' | 'medium' | 'hard';
          category: string;
          time_limit: number;
          is_active: boolean;
        };
        Insert: {
          title: string;
          description: string;
          teacher_id: string;
          difficulty: 'easy' | 'medium' | 'hard';
          category: string;
          time_limit: number;
          is_active?: boolean;
        };
        Update: {
          title?: string;
          description?: string;
          difficulty?: 'easy' | 'medium' | 'hard';
          category?: string;
          time_limit?: number;
          is_active?: boolean;
        };
      };
      questions: {
        Row: {
          id: string;
          quiz_id: string;
          question: string;
          options: string[];
          correct_answer: number;
          explanation?: string;
          points: number;
          time_limit: number;
          order: number;
          type: 'multiple_choice' | 'true_false' | 'short_answer';
        };
        Insert: {
          quiz_id: string;
          question: string;
          options: string[];
          correct_answer: number;
          explanation?: string;
          points: number;
          time_limit: number;
          order: number;
          type: 'multiple_choice' | 'true_false' | 'short_answer';
        };
        Update: {
          question?: string;
          options?: string[];
          correct_answer?: number;
          explanation?: string;
          points?: number;
          time_limit?: number;
          order?: number;
          type?: 'multiple_choice' | 'true_false' | 'short_answer';
        };
      };
      game_sessions: {
        Row: {
          id: string;
          quiz_id: string;
          teacher_id: string;
          pin: string;
          status: 'waiting' | 'active' | 'completed';
          current_question: number;
          created_at: string;
          started_at?: string;
          ended_at?: string;
          settings: any;
        };
        Insert: {
          quiz_id: string;
          teacher_id: string;
          pin: string;
          status?: 'waiting' | 'active' | 'completed';
          current_question?: number;
          settings: any;
        };
        Update: {
          status?: 'waiting' | 'active' | 'completed';
          current_question?: number;
          started_at?: string;
          ended_at?: string;
          settings?: any;
        };
      };
      participants: {
        Row: {
          id: string;
          session_id: string;
          user_id?: string;
          nickname: string;
          score: number;
          correct_answers: number;
          streak: number;
          position: number;
          join_time: string;
          is_active: boolean;
        };
        Insert: {
          session_id: string;
          user_id?: string;
          nickname: string;
          score?: number;
          correct_answers?: number;
          streak?: number;
          position?: number;
          is_active?: boolean;
        };
        Update: {
          nickname?: string;
          score?: number;
          correct_answers?: number;
          streak?: number;
          position?: number;
          is_active?: boolean;
        };
      };
      answers: {
        Row: {
          id: string;
          participant_id: string;
          question_id: string;
          answer: string | number;
          is_correct: boolean;
          time_taken: number;
          points_earned: number;
          created_at: string;
        };
        Insert: {
          participant_id: string;
          question_id: string;
          answer: string | number;
          time_taken: number;
        };
        Update: {
          is_correct?: boolean;
          points_earned?: number;
        };
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          rarity: 'common' | 'rare' | 'epic' | 'legendary';
          requirement: string;
          points_value: number;
        };
        Insert: {
          name: string;
          description: string;
          icon: string;
          rarity: 'common' | 'rare' | 'epic' | 'legendary';
          requirement: string;
          points_value: number;
        };
        Update: {
          name?: string;
          description?: string;
          icon?: string;
          rarity?: 'common' | 'rare' | 'epic' | 'legendary';
          requirement?: string;
          points_value?: number;
        };
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
          context: string;
        };
        Insert: {
          user_id: string;
          badge_id: string;
          context: string;
        };
        Update: {
          context?: string;
        };
      };
    };
  };
}