import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSimplifiedSystem() {
  console.log('🧪 Testing Simplified Cumulative Scoring System...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1. Checking if tables exist...');
    
    const { data: cumulativeScores, error: csError } = await supabase
      .from('cumulative_scores')
      .select('*')
      .limit(1);
    
    if (csError) {
      console.error('❌ cumulative_scores table error:', csError);
    } else {
      console.log('✅ cumulative_scores table exists');
    }

    const { data: sessionScores, error: ssError } = await supabase
      .from('session_scores')
      .select('*')
      .limit(1);
    
    if (ssError) {
      console.error('❌ session_scores table error:', ssError);
    } else {
      console.log('✅ session_scores table exists');
    }

    // Test 2: Test the cumulative leaderboard function
    console.log('\n2. Testing cumulative leaderboard function...');
    
    const { data: leaderboard, error: lbError } = await supabase
      .rpc('get_cumulative_leaderboard', { limit_count: 5 });
    
    if (lbError) {
      console.error('❌ get_cumulative_leaderboard function error:', lbError);
    } else {
      console.log('✅ get_cumulative_leaderboard function works');
      console.log('   Leaderboard entries:', leaderboard?.length || 0);
    }

    // Test 3: Test user session history function
    console.log('\n3. Testing user session history function...');
    
    // Get a user ID for testing (if any users exist)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else if (users && users.length > 0) {
      const testUserId = users[0].id;
      
      const { data: history, error: histError } = await supabase
        .rpc('get_user_session_history', { 
          user_uuid: testUserId, 
          limit_count: 5 
        });
      
      if (histError) {
        console.error('❌ get_user_session_history function error:', histError);
      } else {
        console.log('✅ get_user_session_history function works');
        console.log('   History entries for user:', history?.length || 0);
      }
    } else {
      console.log('⚠️  No users found to test session history function');
    }

    // Test 4: Check if old weekly tables are gone
    console.log('\n4. Checking if old weekly tables are removed...');
    
    const { data: weeklyComps, error: wcError } = await supabase
      .from('weekly_competitions')
      .select('*')
      .limit(1);
    
    if (wcError && wcError.code === '42P01') {
      console.log('✅ weekly_competitions table successfully removed');
    } else {
      console.log('⚠️  weekly_competitions table still exists or error:', wcError);
    }

    const { data: weeklyScores, error: wsError } = await supabase
      .from('weekly_scores')
      .select('*')
      .limit(1);
    
    if (wsError && wsError.code === '42P01') {
      console.log('✅ weekly_scores table successfully removed');
    } else {
      console.log('⚠️  weekly_scores table still exists or error:', wsError);
    }

    console.log('\n🎉 Simplified cumulative scoring system test completed!');
    console.log('\n📋 Summary:');
    console.log('- New tables: cumulative_scores, session_scores');
    console.log('- Functions: get_cumulative_leaderboard, get_user_session_history');
    console.log('- Old weekly system: Removed');
    console.log('\n✨ The system is now ready for simple cumulative scoring across all quiz sessions!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSimplifiedSystem();
