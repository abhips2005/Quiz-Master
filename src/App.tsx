import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { supabase, ensureBadgesExist } from './lib/supabase';
import { AuthForm } from './components/Auth/AuthForm';
import { Header } from './components/Layout/Header';
import { TeacherDashboard } from './components/Teacher/TeacherDashboard';
import { StudentDashboard } from './components/Student/StudentDashboard';

function App() {
  const { user, loading } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    } else {
      setProfileLoading(false);
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      // Ensure badges exist before loading user profile
      await ensureBadgesExist();
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // If user doesn't exist, create profile

        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{
            id: user?.id,
            email: user?.email,
            name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
            role: user?.user_metadata?.role || 'student',
            total_points: 0,
            streak: 0,
            level: 1,
          }])
          .select()
          .single();

        if (createError) throw createError;
        setUserProfile(newUser);
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onSuccess={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} userProfile={userProfile} />
      <main>
        {userProfile?.role === 'teacher' ? (
          <TeacherDashboard userId={user.id} />
        ) : (
          <StudentDashboard userId={user.id} />
        )}
      </main>
    </div>
  );
}

export default App;