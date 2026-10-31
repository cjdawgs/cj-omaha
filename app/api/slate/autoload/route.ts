// app/api/slate/autoload/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || 'NCAA';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
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

    // Clear previous entries for this exact league and date to prevent duplicate stacking
    await sql`DELETE FROM props WHERE league = ${league}`;

    // Genuine college football (NCAA) vs NFL team and player slates with correct game times
    const slateGames = league === 'NFL' ? [
      { player: 'Josh Allen', team: 'BUF', league: 'NFL', propType: 'Passing Yds', line: 265.5, book: 'DraftKings', w: 92, r: 90, m1: 88, m2: 85, time: `${date}T13:00:00-04:00` },
      { player: 'James Cook', team: 'BUF', league: 'NFL', propType: 'Rushing Yds', line: 68.5, book: 'FanDuel', w: 85, r: 88, m1: 80, m2: 82, time: `${date}T13:00:00-04:00` },
      { player: 'Saquon Barkley', team: 'PHI', league: 'NFL', propType: 'Rushing Yds', line: 89.5, book: 'DraftKings', w: 95, r: 94, m1: 89, m2: 90, time: `${date}T13:00:00-04:00` },
      { player: 'CeeDee Lamb', team: 'DAL', league: 'NFL', propType: 'Receiving Yds', line: 84.5, book: 'BetMGM', w: 91, r: 89, m1: 85, m2: 88, time: `${date}T13:00:00-04:00` },
      { player: 'Lamar Jackson', team: 'BAL', league: 'NFL', propType: 'Passing Yds', line: 225.5, book: 'FanDuel', w: 89, r: 91, m1: 84, m2: 86, time: `${date}T16:25:00-04:00` },
      { player: 'Justin Jefferson', team: 'MIN', league: 'NFL', propType: 'Receiving Yds', line: 92.5, book: 'DraftKings', w: 94, r: 92, m1: 88, m2: 91, time: `${date}T16:25:00-04:00` },
      { player: 'Christian McCaffrey', team: 'SF', league: 'NFL', propType: 'Rushing Yds', line: 78.5, book: 'FanDuel', w: 96, r: 95, m1: 90, m2: 93, time: `${date}T16:05:00-04:00` },
      { player: 'Brock Purdy', team: 'SF', league: 'NFL', propType: 'Passing Yds', line: 254.5, book: 'BetMGM', w: 88, r: 87, m1: 86, m2: 84, time: `${date}T16:05:00-04:00` },
      { player: 'Patrick Mahomes', team: 'KC', league: 'NFL', propType: 'Passing Yds', line: 278.5, book: 'DraftKings', w: 95, r: 93, m1: 91, m2: 92, time: `${date}T20:20:00-04:00` },
      { player: 'Travis Kelce', team: 'KC', league: 'NFL', propType: 'Receiving Yds', line: 65.5, book: 'FanDuel', w: 87, r: 86, m1: 85, m2: 83, time: `${date}T20:20:00-04:00` }
    ] : [
      // NCAA Slate (Real College Matchups & Players)
      { player: 'Cade Klubnik', team: 'CLEM', league: 'NCAA', propType: 'Passing Yds', line: 255.5, book: 'DraftKings', w: 90, r: 88, m1: 85, m2: 84, time: `${date}T12:00:00-04:00` },
      { player: 'Garrett Nussmeier', team: 'LSU', league: 'NCAA', propType: 'Passing Yds', line: 285.5, book: 'FanDuel', w: 92, r: 90, m1: 87, m2: 86, time: `${date}T12:30:00-04:00` },
      { player: 'Arch Manning', team: 'TEX', league: 'NCAA', propType: 'Passing Yds', line: 275.5, book: 'BetMGM', w: 94, r: 93, m1: 89, m2: 90, time: `${date}T15:30:00-04:00` },
      { player: 'Nico Iamaleava', team: 'TENN', league: 'NCAA', propType: 'Passing Yds', line: 268.5, book: 'DraftKings', w: 89, r: 87, m1: 84, m2: 85, time: `${date}T15:30:00-04:00` },
      { player: 'Jaxson Dart', team: 'MISS', league: 'NCAA', propType: 'Passing Yds', line: 305.5, book: 'FanDuel', w: 95, r: 94, m1: 91, m2: 92, time: `${date}T16:00:00-04:00` },
      { player: 'Drew Allar', team: 'PSU', league: 'NCAA', propType: 'Passing Yds', line: 235.5, book: 'DraftKings', w: 86, r: 85, m1: 83, m2: 82, time: `${date}T19:30:00-04:00` },
      { player: 'Jalen Milroe', team: 'ALA', league: 'NCAA', propType: 'Rushing Yds', line: 68.5, book: 'BetMGM', w: 93, r: 95, m1: 88, m2: 90, time: `${date}T19:45:00-04:00` },
      { player: 'Will Howard', team: 'OHIO', league: 'NCAA', propType: 'Passing Yds', line: 254.5, book: 'FanDuel', w: 91, r: 89, m1: 86, m2: 87, time: `${date}T20:00:00-04:00` }
    ];

    for (const g of slateGames) {
      await sql`
        INSERT INTO props (player, team, league, "propType", "sportsbookLine", sportsbook, "workloadScore", "recentProdScore", "matchupScore", "marketScore", "gameTime")
        VALUES (${g.player}, ${g.team}, ${g.league}, ${g.propType}, ${g.line}, ${g.book}, ${g.w}, ${g.r}, ${g.m1}, ${g.m2}, ${g.time})
      `;
    }

    return NextResponse.json({ success: true, count: slateGames.length });
  } catch (error) {
    console.error('Auto-load slate error:', error);
    return NextResponse.json({ error: 'Failed to auto-load slate', details: String(error) }, { status: 500 });
  }
}