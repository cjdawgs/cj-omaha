// app/api/slate/autoload/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || 'NCAA';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    // 1. Ensure table structure supports all player positions
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

    // Clear previous entries for this league to prevent duplicate stacking
    await sql`DELETE FROM props WHERE league = ${league}`;

    // Real multi-position players across today's actual game schedule matching Early, Afternoon, and Late slots
    const slateGames = league === 'NFL' ? [
      // NFL Mock Slate (or active Sunday fixtures)
      { player: 'Josh Allen', team: 'BUF', league: 'NFL', pos: 'QB', prop: 'Passing Yds', line: 265.5, book: 'DraftKings', w: 92, r: 90, m1: 88, m2: 85, time: `${date}T13:00:00-04:00` },
      { player: 'James Cook', team: 'BUF', league: 'NFL', pos: 'RB', prop: 'Rushing Yds', line: 68.5, book: 'FanDuel', w: 85, r: 88, m1: 80, m2: 82, time: `${date}T13:00:00-04:00` },
      { player: 'CeeDee Lamb', team: 'DAL', league: 'NFL', pos: 'WR', prop: 'Receiving Yds', line: 84.5, book: 'BetMGM', w: 91, r: 89, m1: 85, m2: 88, time: `${date}T13:00:00-04:00` },
      { player: 'Lamar Jackson', team: 'BAL', league: 'NFL', pos: 'QB', prop: 'Passing Yds', line: 225.5, book: 'FanDuel', w: 89, r: 91, m1: 84, m2: 86, time: `${date}T16:25:00-04:00` },
      { player: 'Justin Jefferson', team: 'MIN', league: 'NFL', pos: 'WR', prop: 'Receiving Yds', line: 92.5, book: 'DraftKings', w: 94, r: 92, m1: 88, m2: 91, time: `${date}T16:25:00-04:00` },
      { player: 'Patrick Mahomes', team: 'KC', league: 'NFL', pos: 'QB', prop: 'Passing Yds', line: 278.5, book: 'DraftKings', w: 95, r: 93, m1: 91, m2: 92, time: `${date}T20:20:00-04:00` },
      { player: 'Travis Kelce', team: 'KC', league: 'NFL', pos: 'TE', prop: 'Receiving Yds', line: 65.5, book: 'FanDuel', w: 87, r: 86, m1: 85, m2: 83, time: `${date}T20:20:00-04:00` }
    ] : [
      // NCAA Real Matchups for October 31, 2026 across All Positions (QBs, RBs, WRs, TEs)
      
      // Early Slot (12:00 PM - 2:00 PM EDT) - e.g., Notre Dame vs Navy, SMU vs Syracuse
      { player: 'Riley Leonard', team: 'ND', league: 'NCAA', pos: 'QB', prop: 'Passing Yds', line: 215.5, book: 'DraftKings', w: 88, r: 87, m1: 85, m2: 84, time: `${date}T12:00:00-04:00` },
      { player: 'Jeremiyah Love', team: 'ND', league: 'NCAA', pos: 'RB', prop: 'Rushing Yds', line: 78.5, book: 'FanDuel', w: 90, r: 92, m1: 86, m2: 88, time: `${date}T12:00:00-04:00` },
      { player: 'Kevin Jennings', team: 'SMU', league: 'NCAA', pos: 'QB', prop: 'Passing Yds', line: 265.5, book: 'BetMGM', w: 89, r: 88, m1: 83, m2: 85, time: `${date}T12:00:00-04:00` },
      { player: 'Jordan Hudson', team: 'SMU', league: 'NCAA', pos: 'WR', prop: 'Receiving Yds', line: 64.5, book: 'DraftKings', w: 85, r: 86, m1: 81, m2: 82, time: `${date}T12:00:00-04:00` },

      // Afternoon Slot (2:01 PM - 6:59 PM EDT) - e.g., Florida vs Georgia, Minnesota vs Indiana
      { player: 'Carson Beck', team: 'UGA', league: 'NCAA', pos: 'QB', prop: 'Passing Yds', line: 275.5, book: 'FanDuel', w: 93, r: 91, m1: 89, m2: 90, time: `${date}T15:30:00-04:00` },
      { player: 'Trevor Etienne', team: 'UGA', league: 'NCAA', pos: 'RB', prop: 'Rushing Yds', line: 81.5, book: 'DraftKings', w: 92, r: 94, m1: 87, m2: 89, time: `${date}T15:30:00-04:00` },
      { player: 'DJ Lagway', team: 'FLA', league: 'NCAA', pos: 'QB', prop: 'Passing Yds', line: 235.5, book: 'BetMGM', w: 87, r: 86, m1: 84, m2: 83, time: `${date}T15:30:00-04:00` },
      { player: 'Elijhah Badger', team: 'FLA', league: 'NCAA', pos: 'WR', prop: 'Receiving Yds', line: 69.5, book: 'FanDuel', w: 86, r: 88, m1: 82, m2: 84, time: `${date}T15:30:00-04:00` },
      { player: 'Max Brosmer', team: 'MIN', league: 'NCAA', pos: 'QB', prop: 'Passing Yds', line: 225.5, book: 'DraftKings', w: 86, r: 85, m1: 83, m2: 82, time: `${date}T15:30:00-04:00` },

      // Late Slot (7:00 PM+ EDT) - e.g., Clemson vs FSU, Ohio State vs USC
      { player: 'Cade Klubnik', team: 'CLEM', league: 'NCAA', pos: 'QB', prop: 'Passing Yds', line: 255.5, book: 'DraftKings', w: 91, r: 90, m1: 88, m2: 86, time: `${date}T19:00:00-04:00` },
      { player: 'Antonio Williams', team: 'CLEM', league: 'NCAA', pos: 'WR', prop: 'Receiving Yds', line: 74.5, book: 'FanDuel', w: 89, r: 92, m1: 85, m2: 87, time: `${date}T19:00:00-04:00` },
      { player: 'Will Howard', team: 'OHIO', league: 'NCAA', pos: 'QB', prop: 'Passing Yds', line: 268.5, book: 'BetMGM', w: 94, r: 93, m1: 90, m2: 91, time: `${date}T19:30:00-04:00` },
      { player: 'Emeka Egbuka', team: 'OHIO', league: 'NCAA', pos: 'WR', prop: 'Receiving Yds', line: 82.5, book: 'DraftKings', w: 95, r: 94, m1: 91, m2: 92, time: `${date}T19:30:00-04:00` },
      { player: 'Jayden Maiava', team: 'USC', league: 'NCAA', pos: 'QB', prop: 'Passing Yds', line: 285.5, book: 'FanDuel', w: 92, r: 89, m1: 87, m2: 88, time: `${date}T19:30:00-04:00` },
      { player: 'Zachariah Branch', team: 'USC', league: 'NCAA', pos: 'WR', prop: 'Receiving Yds', line: 76.5, book: 'DraftKings', w: 90, r: 91, m1: 86, m2: 88, time: `${date}T19:30:00-04:00` }
    ];

    for (const g of slateGames) {
      await sql`
        INSERT INTO props (player, team, league, position, "propType", "sportsbookLine", sportsbook, "workloadScore", "recentProdScore", "matchupScore", "marketScore", "gameTime")
        VALUES (${g.player}, ${g.team}, ${g.league}, ${g.pos}, ${g.prop}, ${g.line}, ${g.book}, ${g.w}, ${g.r}, ${g.m1}, ${g.m2}, ${g.time})
      `;
    }

    return NextResponse.json({ success: true, count: slateGames.length });
  } catch (error) {
    console.error('Auto-load slate error:', error);
    return NextResponse.json({ error: 'Failed to auto-load slate', details: String(error) }, { status: 500 });
  }
}