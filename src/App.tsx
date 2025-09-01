import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { supabase, ensureBadgesExist } from './lib/supabase';
import { LandingPage } from './components/Landing/LandingPage';
import { AuthForm } from './components/Auth/AuthForm';
import { Header } from './components/Layout/Header';
import { TeacherDashboard } from './components/Teacher/TeacherDashboard';
import { StudentDashboard } from './components/Student/StudentDashboard';
import { CompetitionDashboard } from './components/Shared/CompetitionDashboard';
import { GamePlay } from './components/Student/GamePlay';
import { GameLobby } from './components/Teacher/GameLobby';

function App() {
  const { user, loading } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

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

  const handleGetStarted = () => {
    setAuthMode('signup');
    setShowAuth(true);
  };

  const handleSignIn = () => {
    setAuthMode('login');
    setShowAuth(true);
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    window.location.reload();
  };

  const handleBackToLanding = () => {
    setShowAuth(false);
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
    if (showAuth) {
      return <AuthForm onSuccess={handleAuthSuccess} initialMode={authMode} onBack={handleBackToLanding} />;
    }
    return <LandingPage onGetStarted={handleGetStarted} onSignIn={handleSignIn} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header user={user} userProfile={userProfile} />
        <main className="pb-safe">
          <Routes>
            <Route path="/" element={
              userProfile?.role === 'teacher' ? (
                <TeacherDashboard userId={user.id} />
              ) : (
                <StudentDashboard userId={user.id} />
              )
            } />
            <Route path="/competition" element={<CompetitionDashboard />} />
            <Route path="/game/:sessionId" element={<GamePlay />} />
            <Route path="/lobby/:sessionId" element={<GameLobby />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;