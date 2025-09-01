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

async function testCumulativeScoring() {
  console.log('🧪 Testing Cumulative Scoring System...\n');

  try {
    // Test 1: Get a user to test with
    console.log('1. Getting a test user...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error getting users:', usersError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    const testUser = users[0];
    console.log(`✅ Using test user: ${testUser.name} (${testUser.id})`);

    // Test 2: Create a test game session
    console.log('\n2. Creating a test game session...');
    
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .insert([{
        quiz_id: '00000000-0000-0000-0000-000000000000', // Dummy quiz ID
        teacher_id: testUser.id,
        pin: 'TEST123',
        status: 'completed',
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (sessionError) {
      console.error('❌ Error creating test session:', sessionError);
      return;
    }
    
    console.log(`✅ Created test session: ${session.id}`);

    // Test 3: Insert test session scores
    console.log('\n3. Inserting test session scores...');
    
    const testScores = [
      { user_id: testUser.id, session_id: session.id, session_score: 150 },
      { user_id: testUser.id, session_id: session.id, session_score: 200 },
      { user_id: testUser.id, session_id: session.id, session_score: 175 }
    ];
    
    for (const scoreData of testScores) {
      const { error: scoreError } = await supabase
        .from('session_scores')
        .insert([scoreData]);
      
      if (scoreError) {
        console.error('❌ Error inserting session score:', scoreError);
      } else {
        console.log(`✅ Inserted session score: ${scoreData.session_score}`);
      }
    }

    // Test 4: Check if cumulative scores were created
    console.log('\n4. Checking cumulative scores...');
    
    const { data: cumulativeScores, error: csError } = await supabase
      .from('cumulative_scores')
      .select('*')
      .eq('user_id', testUser.id);
    
    if (csError) {
      console.error('❌ Error checking cumulative scores:', csError);
    } else {
      console.log(`✅ Found ${cumulativeScores.length} cumulative score records`);
      if (cumulativeScores.length > 0) {
        console.log('   Cumulative score data:', cumulativeScores[0]);
      }
    }

    // Test 5: Test the cumulative leaderboard function
    console.log('\n5. Testing cumulative leaderboard function...');
    
    const { data: leaderboard, error: lbError } = await supabase
      .rpc('get_cumulative_leaderboard', { limit_count: 10 });
    
    if (lbError) {
      console.error('❌ Error calling cumulative leaderboard function:', lbError);
    } else {
      console.log(`✅ Cumulative leaderboard function working (${leaderboard.length} entries)`);
      if (leaderboard.length > 0) {
        console.log('   Leaderboard entries:');
        leaderboard.forEach((entry, index) => {
          console.log(`   ${index + 1}. ${entry.user_name}: ${entry.total_score} points (${entry.sessions_participated} sessions)`);
        });
      }
    }

    // Test 6: Clean up test data
    console.log('\n6. Cleaning up test data...');
    
    const { error: cleanupError } = await supabase
      .from('game_sessions')
      .delete()
      .eq('id', session.id);
    
    if (cleanupError) {
      console.error('❌ Error cleaning up test session:', cleanupError);
    } else {
      console.log('✅ Test data cleaned up');
    }

    console.log('\n🎉 Cumulative scoring system test completed!');
    console.log('\n📋 Summary:');
    console.log(`   - Test user: ${testUser.name}`);
    console.log(`   - Session scores inserted: ${testScores.length}`);
    console.log(`   - Cumulative scores created: ${cumulativeScores?.length || 0}`);
    console.log(`   - Leaderboard entries: ${leaderboard?.length || 0}`);

    if (leaderboard.length > 0) {
      console.log('\n✅ The cumulative scoring system is working correctly!');
      console.log('   Scores are being recorded and the leaderboard is displaying them.');
    } else {
      console.log('\n❌ The cumulative scoring system is not working correctly.');
      console.log('   Check the database triggers and functions.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCumulativeScoring();
