import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { Quiz, GameSettings } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUpWithEmail = async (email: string, password: string, name: string, role: 'teacher' | 'student') => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  });
  
  // If signup successful and user is confirmed, create profile immediately
  if (data.user && !error) {
    try {
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: data.user.id,
          email: data.user.email!,
          name: name,
          role: role,
          total_points: 0,
          streak: 0,
          level: 1,
        }]);
      
      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    } catch (profileError) {
      console.error('Error creating user profile:', profileError);
    }
  }
  
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Real-time subscriptions
export const subscribeToGameSession = (sessionId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`game_session_${sessionId}`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` },
      callback
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'participants', filter: `session_id=eq.${sessionId}` },
      callback
    )
    .subscribe();
};

export const subscribeToParticipants = (sessionId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`participants_${sessionId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'participants', filter: `session_id=eq.${sessionId}` },
      callback
    )
    .subscribe();
};

// Quiz operations
export const createQuiz = async (quiz: Omit<Quiz, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('quizzes')
    .insert([quiz])
    .select()
    .single();
  return { data, error };
};

export const getQuizzes = async (teacherId: string) => {
  const { data, error } = await supabase
    .from('quizzes')
    .select(`
      *,
      questions (
        id
      )
    `)
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const getQuizById = async (id: string) => {
  const { data, error } = await supabase
    .from('quizzes')
    .select(`
      *,
      questions (
        *
      )
    `)
    .eq('id', id)
    .single();
  
  // Sort questions by order_index if data exists
  if (data && data.questions) {
    data.questions.sort((a: any, b: any) => a.order_index - b.order_index);
  }
  
  return { data, error };
};

export const deleteQuiz = async (id: string, teacherId: string) => {
  // First delete all questions associated with this quiz
  const { error: questionsError } = await supabase
    .from('questions')
    .delete()
    .eq('quiz_id', id);
  
  if (questionsError) return { data: null, error: questionsError };
  
  // Then delete the quiz itself
  const { data, error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', id)
    .eq('teacher_id', teacherId) // Ensure only the owner can delete
    .select()
    .single();
  
  return { data, error };
};

// Game session operations
export const createGameSession = async (quizId: string, teacherId: string, settings: GameSettings) => {
  const pin = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const { data, error } = await supabase
    .from('game_sessions')
    .insert([{
      quiz_id: quizId,
      teacher_id: teacherId,
      pin,
      settings,
      status: 'waiting',
      current_question: 0,
    }])
    .select()
    .single();
  
  return { data, error };
};

export const getGameSessionByPin = async (pin: string) => {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*, quizzes(*)')
    .eq('pin', pin)
    .single();
  return { data, error };
};

export const joinGameSession = async (sessionId: string, nickname: string, userId?: string) => {
  console.log('joinGameSession called with:', { sessionId, nickname, userId });
  
  const { data, error } = await supabase
    .from('participants')
    .insert([{
      session_id: sessionId,
      user_id: userId,
      nickname,
      score: 0,
      correct_answers: 0,
      streak: 0,
      position: 0,
      is_active: true,
    }])
    .select()
    .single();
  
  console.log('joinGameSession result:', { data, error });
  return { data, error };
};

// Leaderboard operations
export const getSessionLeaderboard = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('session_id', sessionId)
    .order('score', { ascending: false })
    .limit(10);
  
  return { data, error };
};

export const getGlobalLeaderboard = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, total_points, level, streak')
    .order('total_points', { ascending: false })
    .limit(10);
  
  return { data, error };
};

// Answer submission
export const submitAnswer = async (
  participantId: string,
  questionId: string,
  answer: string | number,
  timeTaken: number
) => {
  const { data, error } = await supabase
    .from('answers')
    .insert([{
      participant_id: participantId,
      question_id: questionId,
      answer,
      time_taken: timeTaken,
    }])
    .select()
    .single();
  
  return { data, error };
};

// Badge operations
export const getUserBadges = async (userId: string) => {
  const { data, error } = await supabase
    .from('achievements')
    .select('*, badges(*)')
    .eq('user_id', userId);
  
  return { data, error };
};

export const awardBadge = async (userId: string, badgeId: string, context: string) => {
  const { data, error } = await supabase
    .from('achievements')
    .insert([{
      user_id: userId,
      badge_id: badgeId,
      context,
    }])
    .select()
    .single();
  
  return { data, error };
};