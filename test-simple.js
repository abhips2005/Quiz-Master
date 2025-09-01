import { createClient } from '@supabase/supabase-js';

// You'll need to manually set these environment variables or replace with your actual values
const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your actual URL
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your actual key

if (supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.error('❌ Please update the supabaseUrl and supabaseAnonKey in this file with your actual values');
  console.error('   You can find these in your .env file or Supabase dashboard');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabase() {
  console.log('🧪 Testing Database Connection...\n');

  try {
    // Test 1: Check if we can connect to the database
    console.log('1. Testing database connection...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Database connection error:', usersError);
      return;
    } else {
      console.log('✅ Database connection successful');
      console.log('   Users found:', users?.length || 0);
    }

    // Test 2: Check if cumulative_scores table exists
    console.log('\n2. Checking cumulative_scores table...');
    
    const { data: cumulativeScores, error: csError } = await supabase
      .from('cumulative_scores')
      .select('*')
      .limit(1);
    
    if (csError) {
      console.error('❌ cumulative_scores table error:', csError);
      console.log('   This means the migration needs to be applied');
    } else {
      console.log('✅ cumulative_scores table exists');
      console.log('   Records found:', cumulativeScores?.length || 0);
    }

    // Test 3: Check if session_scores table exists
    console.log('\n3. Checking session_scores table...');
    
    const { data: sessionScores, error: ssError } = await supabase
      .from('session_scores')
      .select('*')
      .limit(1);
    
    if (ssError) {
      console.error('❌ session_scores table error:', ssError);
      console.log('   This means the migration needs to be applied');
    } else {
      console.log('✅ session_scores table exists');
      console.log('   Records found:', sessionScores?.length || 0);
    }

    // Test 4: Check if the leaderboard function exists
    console.log('\n4. Testing leaderboard function...');
    
    const { data: leaderboard, error: lbError } = await supabase
      .rpc('get_cumulative_leaderboard', { limit_count: 5 });
    
    if (lbError) {
      console.error('❌ get_cumulative_leaderboard function error:', lbError);
      console.log('   This means the migration needs to be applied');
    } else {
      console.log('✅ get_cumulative_leaderboard function works');
      console.log('   Leaderboard entries:', leaderboard?.length || 0);
    }

    console.log('\n📋 Summary:');
    if (csError || ssError || lbError) {
      console.log('❌ The simplified cumulative scoring system is NOT set up');
      console.log('   You need to apply the database migration first');
      console.log('   Run the SQL in: supabase/migrations/20250721000002_simplify_cumulative_scores.sql');
    } else {
      console.log('✅ The simplified cumulative scoring system is set up');
      console.log('   The issue might be that no scores have been recorded yet');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabase();
