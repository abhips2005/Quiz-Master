import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { Quiz, GameSettings } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Ensure badges are seeded
export const ensureBadgesExist = async () => {
  const { data: existingBadges, error } = await supabase
    .from('badges')
    .select('*');
  
  if (error) {
    console.error('Error checking badges:', error);
    return;
  }
  
  if (!existingBadges || existingBadges.length === 0) {
    console.log('No badges found, seeding badges...');
    const badgeData = [
      {
        name: 'First Steps',
        description: 'Join your first quiz game',
        icon: '🎯',
        rarity: 'common',
        requirement: 'Join 1 game',
        points_value: 50
      },
      {
        name: 'Quick Draw',
        description: 'Answer a question in under 5 seconds',
        icon: '⚡',
        rarity: 'common',
        requirement: 'Answer in <5s',
        points_value: 100
      },
      {
        name: 'Perfect Score',
        description: 'Get 100% correct answers in a quiz',
        icon: '💯',
        rarity: 'rare',
        requirement: 'Perfect score',
        points_value: 500
      },
      {
        name: 'Streak Master',
        description: 'Get 10 correct answers in a row',
        icon: '🔥',
        rarity: 'rare',
        requirement: '10 streak',
        points_value: 300
      },
      {
        name: 'Perfect Streak',
        description: 'Maintain a 25 answer streak',
        icon: '🚀',
        rarity: 'epic',
        requirement: '25 streak',
        points_value: 1000
      },
      {
        name: 'Knowledge Seeker',
        description: 'Participate in 50 quiz games',
        icon: '📚',
        rarity: 'legendary',
        requirement: '50 games',
        points_value: 2000
      }
    ];
    
    const { error: insertError } = await supabase
      .from('badges')
      .insert(badgeData);
    
    if (insertError) {
      console.error('Error seeding badges:', insertError);
    } else {
      console.log('Badges seeded successfully');
    }
  } else {
    console.log('Badges already exist:', existingBadges.length);
  }
};

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
      current_question_index: 0, // Initialize individual question progress
    }])
    .select()
    .single();
  
  console.log('joinGameSession result:', { data, error });
  return { data, error };
};

// Leaderboard operations
export const getSessionLeaderboard = async (sessionId: string) => {
  console.log('getSessionLeaderboard called for session:', sessionId);
  
  const { data, error } = await supabase
    .from('participants')
    .select(`
      id,
      nickname,
      score,
      user_id,
      users (
        name
      )
    `)
    .eq('session_id', sessionId)
    .order('score', { ascending: false })
    .limit(10);
  
  console.log('getSessionLeaderboard raw result:', { data, error });
  
  return { data, error };
};

// User stats operations
export const getUserStats = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('total_points, streak, level, name')
    .eq('id', userId)
    .single();
  
  return { data, error };
};

export const getUserGameHistory = async (userId: string, limit = 10) => {
  const { data, error } = await supabase
    .from('participants')
    .select(`
      score,
      join_time,
      game_sessions (
        quiz_id,
        ended_at,
        quizzes (
          title
        )
      )
    `)
    .eq('user_id', userId)
    .order('join_time', { ascending: false })
    .limit(limit);
  
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

// Badge checking and awarding functions
export const getBadgeByName = async (badgeName: string) => {
  console.log('getBadgeByName called with:', badgeName);
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('name', badgeName)
    .single();
  
  console.log('getBadgeByName result:', { data, error });
  return { data, error };
};

export const hasUserEarnedBadge = async (userId: string, badgeId: string) => {
  console.log('hasUserEarnedBadge called with:', { userId, badgeId });
  const { data, error } = await supabase
    .from('achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully
  
  console.log('hasUserEarnedBadge result:', { data, error, hasEarned: !!data });
  
  // If there's a 406 error, it might be an RLS issue, but we can still check if data exists
  if (error && error.code !== 'PGRST116') {
    console.warn('hasUserEarnedBadge error (but continuing):', error);
  }
  
  return { data: !!data, error: error?.code === 'PGRST116' ? null : error };
};

export const checkAndAwardBadges = async (userId: string, context: {
  gameCompleted?: boolean;
  perfectScore?: boolean;
  fastAnswers?: number;
  streak?: number;
  totalGames?: number;
  answerTime?: number;
  isFirstGame?: boolean;
}) => {
  console.log('checkAndAwardBadges called with:', { userId, context });
  const badges = [];
  
  try {
    // First Steps - Join your first quiz game
    if (context.isFirstGame) {
      console.log('Checking First Steps badge for first-time player');
      const { data: badge, error: badgeError } = await getBadgeByName('First Steps');
      console.log('First Steps badge lookup result:', { badge, badgeError });
      
      if (badge) {
        const { data: hasEarned, error: earnedError } = await hasUserEarnedBadge(userId, badge.id);
        console.log('First Steps earned check result:', { hasEarned, earnedError });
        
        if (!hasEarned) {
          console.log('Awarding First Steps badge...');
          const awardResult = await awardBadge(userId, badge.id, 'First game participation');
          console.log('Award result:', awardResult);
          
          if (!awardResult.error) {
            badges.push(badge);
          } else {
            console.error('Error awarding First Steps badge:', awardResult.error);
          }
        } else {
          console.log('User already has First Steps badge');
        }
      } else {
        console.log('First Steps badge not found in database');
      }
    }
    
    // Quick Draw - Answer a question in under 5 seconds
    if (context.answerTime && context.answerTime < 5) {
      const { data: badge } = await getBadgeByName('Quick Draw');
      if (badge) {
        const { data: hasEarned } = await hasUserEarnedBadge(userId, badge.id);
        if (!hasEarned) {
          await awardBadge(userId, badge.id, `Answered in ${context.answerTime}s`);
          badges.push(badge);
        }
      }
    }
    
    // Perfect Score - Get 100% correct answers in a quiz
    if (context.perfectScore && context.gameCompleted) {
      const { data: badge } = await getBadgeByName('Perfect Score');
      if (badge) {
        const { data: hasEarned } = await hasUserEarnedBadge(userId, badge.id);
        if (!hasEarned) {
          await awardBadge(userId, badge.id, 'Perfect score achieved');
          badges.push(badge);
        }
      }
    }
    
    // Streak Master - Get 10 correct answers in a row
    if (context.streak && context.streak >= 10) {
      const { data: badge } = await getBadgeByName('Streak Master');
      if (badge) {
        const { data: hasEarned } = await hasUserEarnedBadge(userId, badge.id);
        if (!hasEarned) {
          await awardBadge(userId, badge.id, `${context.streak} answer streak`);
          badges.push(badge);
        }
      }
    }
    
    // Perfect Streak - Maintain a 25 answer streak
    if (context.streak && context.streak >= 25) {
      const { data: badge } = await getBadgeByName('Perfect Streak');
      if (badge) {
        const { data: hasEarned } = await hasUserEarnedBadge(userId, badge.id);
        if (!hasEarned) {
          await awardBadge(userId, badge.id, `${context.streak} answer streak`);
          badges.push(badge);
        }
      }
    }
    
    // Knowledge Seeker - Participate in 50 quiz games
    if (context.totalGames && context.totalGames >= 50) {
      const { data: badge } = await getBadgeByName('Knowledge Seeker');
      if (badge) {
        const { data: hasEarned } = await hasUserEarnedBadge(userId, badge.id);
        if (!hasEarned) {
          await awardBadge(userId, badge.id, `${context.totalGames} games played`);
          badges.push(badge);
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking/awarding badges:', error);
  }
  
  return badges;
};

// Security Violation Functions
export const recordSecurityViolation = async (
  sessionId: string,
  participantId: string,
  violationType: 'tab_switch' | 'right_click' | 'keyboard_shortcut' | 'dev_tools' | 'copy_paste' | 'focus_loss'
) => {
  try {
    // Check if a violation of this type already exists for this participant in this session
    const { data: existing, error: selectError } = await supabase
      .from('security_violations')
      .select('*')
      .eq('session_id', sessionId)
      .eq('participant_id', participantId)
      .eq('violation_type', violationType)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    if (existing) {
      // Update existing violation count
      const { error: updateError } = await supabase
        .from('security_violations')
        .update({ 
          violation_count: existing.violation_count + 1 
        })
        .eq('id', existing.id);
      
      if (updateError) throw updateError;
    } else {
      // Create new violation record
      const { error: insertError } = await supabase
        .from('security_violations')
        .insert({
          session_id: sessionId,
          participant_id: participantId,
          violation_type: violationType,
          violation_count: 1
        });
      
      if (insertError) throw insertError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error recording security violation:', error);
    return { success: false, error };
  }
};

export const getSecurityViolationsForSession = async (sessionId: string) => {
  try {
    const { data, error } = await supabase
      .from('security_violations')
      .select(`
        *,
        participants!inner(nickname, user_id, users(name))
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching security violations:', error);
    return { data: null, error };
  }
};

export const getFlaggedPlayersForSession = async (sessionId: string) => {
  try {
    const { data: violations, error } = await getSecurityViolationsForSession(sessionId);
    
    if (error || !violations) {
      return { data: [], error };
    }

    // Group violations by participant
    const participantViolations = violations.reduce((acc: any, violation: any) => {
      const participantId = violation.participant_id;
      if (!acc[participantId]) {
        acc[participantId] = {
          participant: violation.participants,
          violations: [],
          totalViolations: 0
        };
      }
      acc[participantId].violations.push(violation);
      acc[participantId].totalViolations += violation.violation_count;
      return acc;
    }, {});

    // Filter for high-risk players (5+ violations) and format
    const flaggedPlayers = Object.values(participantViolations)
      .filter((player: any) => player.totalViolations >= 5)
      .map((player: any) => ({
        participant: player.participant,
        totalViolations: player.totalViolations,
        violations: player.violations,
        riskLevel: player.totalViolations >= 15 ? 'severe' : 
                   player.totalViolations >= 10 ? 'high' : 'medium'
      }))
      .sort((a: any, b: any) => b.totalViolations - a.totalViolations);

    return { data: flaggedPlayers, error: null };
  } catch (error) {
    console.error('Error getting flagged players:', error);
    return { data: [], error };
  }
};

// Cumulative Score Operations
export const recordSessionScore = async (
  userId: string,
  sessionId: string,
  sessionScore: number
) => {
  try {
    // Check if score already exists for this user and session
    const { data: existingScore } = await supabase
      .from('session_scores')
      .select('id')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .maybeSingle();

    if (existingScore) {
      // Update existing score
      const { data, error } = await supabase
        .from('session_scores')
        .update({ session_score: sessionScore })
        .eq('id', existingScore.id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } else {
      // Insert new score
      const { data, error } = await supabase
        .from('session_scores')
        .insert([{
          user_id: userId,
          session_id: sessionId,
          session_score: sessionScore
        }])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    }
  } catch (error) {
    console.error('Error recording session score:', error);
    return { data: null, error };
  }
};

export const getCumulativeLeaderboard = async (limit = 10) => {
  const { data, error } = await supabase
    .rpc('get_cumulative_leaderboard', { limit_count: limit });
  
  return { data, error };
};

export const getUserSessionHistory = async (userId: string, limit = 10) => {
  const { data, error } = await supabase
    .rpc('get_user_session_history', { 
      user_uuid: userId, 
      limit_count: limit 
    });
  
  return { data, error };
};

export const getUserCumulativeStats = async (userId: string) => {
  const { data, error } = await supabase
    .from('cumulative_scores')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  return { data, error };
};

// Function to record session scores when a game session is completed
export const recordGameSessionScore = async (sessionId: string) => {
  try {
    // Get the game session details
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .select(`
        id,
        quiz_id,
        teacher_id,
        status,
        participants (
          id,
          user_id,
          score,
          nickname
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;
    if (!session || session.status !== 'completed') {
      throw new Error('Session not found or not completed');
    }

    // Record scores for each participant
    const scorePromises = session.participants
      .filter(participant => participant.score > 0) // Record for all participants with scores
      .map(async (participant) => {
        try {
          if (participant.user_id) {
            // Record for registered users
            await recordSessionScore(
              participant.user_id,
              sessionId,
              participant.score
            );
            return { userId: participant.user_id, success: true, type: 'registered' };
          } else {
            // For anonymous users, we can't record in cumulative leaderboard
            // but we can log that they completed the session
            console.log(`Anonymous participant ${participant.nickname} completed with score ${participant.score}`);
            return { userId: null, success: true, type: 'anonymous', nickname: participant.nickname };
          }
        } catch (error) {
          console.error(`Failed to record score for participant ${participant.user_id || participant.nickname}:`, error);
          return { userId: participant.user_id, success: false, error };
        }
      });

    const results = await Promise.all(scorePromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Session scores recorded: ${successful} successful, ${failed} failed`);

    return {
      success: true,
      message: `Session scores recorded for ${successful} participants`,
      results
    };

  } catch (error) {
    console.error('Error recording session scores:', error);
    throw error;
  }
};

