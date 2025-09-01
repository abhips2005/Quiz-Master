// Test script for the weekly competition system
// Run this after applying the database migration

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWeeklySystem() {
  console.log('🧪 Testing Weekly Competition System...\n');

  try {
    // Test 1: Check if weekly competitions exist
    console.log('1. Checking weekly competitions...');
    const { data: competitions, error: compError } = await supabase
      .from('weekly_competitions')
      .select('*')
      .order('week_number', { ascending: true });

    if (compError) {
      console.error('❌ Error fetching competitions:', compError);
      return;
    }

    console.log(`✅ Found ${competitions.length} weekly competitions`);
    competitions.forEach(comp => {
      console.log(`   Week ${comp.week_number}: ${comp.title}`);
    });

    // Test 2: Check if cumulative_scores table exists
    console.log('\n2. Checking cumulative_scores table...');
    const { data: cumulativeData, error: cumError } = await supabase
      .from('cumulative_scores')
      .select('*')
      .limit(5);

    if (cumError) {
      console.error('❌ Error fetching cumulative scores:', cumError);
    } else {
      console.log(`✅ Cumulative scores table accessible (${cumulativeData.length} records)`);
    }

    // Test 3: Check if weekly_scores table exists
    console.log('\n3. Checking weekly_scores table...');
    const { data: weeklyData, error: weeklyError } = await supabase
      .from('weekly_scores')
      .select('*')
      .limit(5);

    if (weeklyError) {
      console.error('❌ Error fetching weekly scores:', weeklyError);
    } else {
      console.log(`✅ Weekly scores table accessible (${weeklyData.length} records)`);
    }

    // Test 4: Test the cumulative leaderboard function
    console.log('\n4. Testing cumulative leaderboard function...');
    const { data: leaderboard, error: leaderboardError } = await supabase
      .rpc('get_cumulative_leaderboard', { limit_count: 5 });

    if (leaderboardError) {
      console.error('❌ Error calling cumulative leaderboard function:', leaderboardError);
    } else {
      console.log(`✅ Cumulative leaderboard function working (${leaderboard.length} results)`);
    }

    // Test 5: Test the weekly leaderboard function
    console.log('\n5. Testing weekly leaderboard function...');
    const { data: weeklyLeaderboard, error: weeklyLeaderboardError } = await supabase
      .rpc('get_weekly_leaderboard', { week_num: 1, limit_count: 5 });

    if (weeklyLeaderboardError) {
      console.error('❌ Error calling weekly leaderboard function:', weeklyLeaderboardError);
    } else {
      console.log(`✅ Weekly leaderboard function working (${weeklyLeaderboard.length} results)`);
    }

    console.log('\n🎉 All tests completed!');
    console.log('\n📋 Summary:');
    console.log(`   - Weekly competitions: ${competitions.length}`);
    console.log(`   - Cumulative scores accessible: ${!cumError}`);
    console.log(`   - Weekly scores accessible: ${!weeklyError}`);
    console.log(`   - Cumulative leaderboard function: ${!leaderboardError}`);
    console.log(`   - Weekly leaderboard function: ${!weeklyLeaderboardError}`);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testWeeklySystem();
