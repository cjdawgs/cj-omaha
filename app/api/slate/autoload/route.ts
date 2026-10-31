// app/api/slate/autoload/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || 'NFL';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const limit = Number(searchParams.get('limit')) || 10;

  try {
    // Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS props (
        id SERIAL PRIMARY KEY,
        player VARCHAR(100) NOT NULL,
        team VARCHAR(20) NOT NULL,
        league VARCHAR(20) NOT NULL,
        position VARCHAR(20) DEFAULT 'QB',
        "propType" VARCHAR(50) NOT NULL,
        "sportsbookLine" NUMERIC NOT NULL,
        sportsbook VARCHAR(50) DEFAULT 'FanDuel',
        odds VARCHAR(20) DEFAULT '-110',
        "workloadScore" NUMERIC DEFAULT 85,
        "recentProdScore" NUMERIC DEFAULT 85,
        "matchupScore" NUMERIC DEFAULT 80,
        "marketScore" NUMERIC DEFAULT 80,
        "gameTime" TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Comprehensive mock slate covering Early, Afternoon, and Late slots for both leagues
    const slateGames = league === 'NFL' ? [
      // Early Slot (12 PM - 2 PM EDT)
      { player: 'Josh Allen', team: 'BUF', league: 'NFL', propType: 'Passing Yds', sportsbookLine: 265.5, sportsbook: 'DraftKings', workload: 92, recent: 90, matchup: 88, market: 85, gameTime: `${date}T13:00:00-04:00` },
      { player: 'James Cook', team: 'BUF', league: 'NFL', propType: 'Rushing Yds', sportsbookLine: 68.5, sportsbook: 'FanDuel', workload: 85, recent: 88, matchup: 80, market: 82, gameTime: `${date}T13:00:00-04:00` },
      { player: 'Saquon Barkley', team: 'PHI', league: 'NFL', propType: 'Rushing Yds', sportsbookLine: 89.5, sportsbook: 'DraftKings', workload: 95, recent: 94, matchup: 89, market: 90, gameTime: `${date}T13:00:00-04:00` },
      { player: 'CeeDee Lamb', team: 'DAL', league: 'NFL', propType: 'Receiving Yds', sportsbookLine: 84.5, sportsbook: 'BetMGM', workload: 91, recent: 89, matchup: 85, market: 88, gameTime: `${date}T13:00:00-04:00` },

      // Afternoon Slot (2:01 PM - 6:59 PM EDT)
      { player: 'Lamar Jackson', team: 'BAL', league: 'NFL', propType: 'Passing Yds', sportsbookLine: 225.5, sportsbook: 'FanDuel', workload: 89, recent: 91, matchup: 84, market: 86, gameTime: `${date}T16:25:00-04:00` },
      { player: 'Justin Jefferson', team: 'MIN', league: 'NFL', propType: 'Receiving Yds', sportsbookLine: 92.5, sportsbook: 'DraftKings', workload: 94, recent: 92, matchup: 88, market: 91, gameTime: `${date}T16:25:00-04:00` },
      { player: 'Christian McCaffrey', team: 'SF', league: 'NFL', propType: 'Rushing Yds', sportsbookLine: 78.5, sportsbook: 'FanDuel', workload: 96, recent: 95, matchup: 90, market: 93, gameTime: `${date}T16:05:00-04:00` },
      { player: 'Brock Purdy', team: 'SF', league: 'NFL', propType: 'Passing Yds', sportsbookLine: 254.5, sportsbook: 'BetMGM', workload: 88, recent: 87, matchup: 86, market: 84, gameTime: `${date}T16:05:00-04:00` },

      // Late Slot (7:00 PM+ EDT)
      { player: 'Patrick Mahomes', team: 'KC', league: 'NFL', propType: 'Passing Yds', sportsbookLine: 278.5, sportsbook: 'DraftKings', workload: 95, recent: 93, matchup: 91, market: 92, gameTime: `${date}T20:20:00-04:00` },
      { player: 'Travis Kelce', team: 'KC', league: 'NFL', propType: 'Receiving Yds', sportsbookLine: 65.5, sportsbook: 'FanDuel', workload: 87, recent: 86, matchup: 85, market: 83, gameTime: `${date}T20:20:00-04:00` }
    ] : [
      // Early Slot (12 PM - 2 PM EDT)
      { player: 'Caleb Williams', team: 'USC', league: 'NCAA', propType: 'Passing Yds', sportsbookLine: 285.5, sportsbook: 'DraftKings', workload: 90, recent: 89, matchup: 85, market: 84, gameTime: `${date}T12:30:00-04:00` },
      { player: 'Arch Manning', team: 'TEX', league: 'NCAA', propType: 'Passing Yds', sportsbookLine: 265.5, sportsbook: 'FanDuel', workload: 88, recent: 87, matchup: 82, market: 80, gameTime: `${date}T12:00:00-04:00` },

      // Afternoon Slot (2:01 PM - 6:59 PM EDT)
      { player: 'Carson Beck', team: 'UGA', league: 'NCAA', propType: 'Passing Yds', sportsbookLine: 275.5, sportsbook: 'FanDuel', workload: 92, recent: 91, matchup: 88, market: 89, gameTime: `${date}T15:30:00-04:00` },
      { player: 'Garrett Nussmeier', team: 'LSU', league: 'NCAA', propType: 'Passing Yds', sportsbookLine: 289.5, sportsbook: 'BetMGM', workload: 89, recent: 88, matchup: 84, market: 85, gameTime: `${date}T16:00:00-04:00` },

      // Late Slot (7:00 PM+ EDT)
      { player: 'Quinn Ewers', team: 'TEX', league: 'NCAA', propType: 'Passing Yds', sportsbookLine: 295.5, sportsbook: 'BetMGM', workload: 93, recent: 92, matchup: 90, market: 91, gameTime: `${date}T19:30:00-04:00` },
      { player: 'Jalen Milroe', team: 'ALA', league: 'NCAA', propType: 'Rushing Yds', sportsbookLine: 64.5, sportsbook: 'DraftKings', workload: 91, recent: 93, matchup: 87, market: 88, gameTime: `${date}T20:00:00-04:00` }
    ];

    for (const g of slateGames) {
      await sql`
        INSERT INTO props (player, team, league, "propType", "sportsbookLine", sportsbook, "workloadScore", "recentProdScore", "matchupScore", "marketScore", "gameTime")
        VALUES (${g.player}, ${g.team}, ${g.league}, ${g.propType}, ${g.sportsbookLine}, ${g.sportsbook}, ${g.workload}, ${g.recent}, ${g.matchup}, ${g.market}, ${g.gameTime})
        ON CONFLICT DO NOTHING;
      `;
    }

    return NextResponse.json({ success: true, count: slateGames.length });
  } catch (error) {
    console.error('Auto-load slate error:', error);
    return NextResponse.json({ error: 'Failed to auto-load slate', details: String(error) }, { status: 500 });
  }
}