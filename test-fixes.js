// Test script to verify the fixes for the weekly competition system
// Run this after applying the fix migration

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFixes() {
  console.log('🧪 Testing Weekly Competition System Fixes...\n');

  try {
    // Test 1: Check if weekly competitions are accessible
    console.log('1. Testing weekly_competitions access...');
    const { data: competitions, error: compError } = await supabase
      .from('weekly_competitions')
      .select('*')
      .limit(3);

    if (compError) {
      console.error('❌ Error accessing weekly_competitions:', compError);
    } else {
      console.log(`✅ weekly_competitions accessible (${competitions.length} records)`);
    }

    // Test 2: Check if cumulative_scores are accessible
    console.log('\n2. Testing cumulative_scores access...');
    const { data: cumulativeData, error: cumError } = await supabase
      .from('cumulative_scores')
      .select('*')
      .limit(3);

    if (cumError) {
      console.error('❌ Error accessing cumulative_scores:', cumError);
    } else {
      console.log(`✅ cumulative_scores accessible (${cumulativeData.length} records)`);
    }

    // Test 3: Test the fixed cumulative leaderboard function
    console.log('\n3. Testing fixed cumulative leaderboard function...');
    const { data: leaderboard, error: leaderboardError } = await supabase
      .rpc('get_cumulative_leaderboard', { limit_count: 3 });

    if (leaderboardError) {
      console.error('❌ Error calling cumulative leaderboard function:', leaderboardError);
    } else {
      console.log(`✅ Cumulative leaderboard function working (${leaderboard.length} results)`);
      if (leaderboard.length > 0) {
        console.log('   Sample data:', {
          user_name: leaderboard[0].user_name,
          total_score: leaderboard[0].total_score,
          rank: leaderboard[0].rank,
          rank_type: typeof leaderboard[0].rank
        });
      }
    }

    // Test 4: Test the weekly leaderboard function
    console.log('\n4. Testing weekly leaderboard function...');
    const { data: weeklyLeaderboard, error: weeklyLeaderboardError } = await supabase
      .rpc('get_weekly_leaderboard', { week_num: 1, limit_count: 3 });

    if (weeklyLeaderboardError) {
      console.error('❌ Error calling weekly leaderboard function:', weeklyLeaderboardError);
    } else {
      console.log(`✅ Weekly leaderboard function working (${weeklyLeaderboardError.length} results)`);
    }

    // Test 5: Check RLS policies
    console.log('\n5. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'weekly_competitions' })
      .catch(() => ({ data: null, error: 'Function not available' }));

    if (policiesError) {
      console.log('   ℹ️  RLS policies check not available (this is normal)');
    } else {
      console.log('   ✅ RLS policies check available');
    }

    console.log('\n🎉 Fix verification completed!');
    console.log('\n📋 Summary:');
    console.log(`   - weekly_competitions accessible: ${!compError}`);
    console.log(`   - cumulative_scores accessible: ${!cumError}`);
    console.log(`   - Cumulative leaderboard function: ${!leaderboardError}`);
    console.log(`   - Weekly leaderboard function: ${!weeklyLeaderboardError}`);

    if (compError || cumError || leaderboardError || weeklyLeaderboardError) {
      console.log('\n⚠️  Some issues remain. Check the error messages above.');
    } else {
      console.log('\n✅ All tests passed! The weekly competition system should now work correctly.');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testFixes();
