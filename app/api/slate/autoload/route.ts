// app/api/slate/autoload/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || 'NFL';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    // 1. In production, you would fetch real game matchups & player props here from an API 
    // e.g., fetch(`https://api.the-odds-api.v4/...&date=${date}`)
    
    // 2. For demonstration/slate automation, here is a generated batch of games & players for the selected date:
    const slateGames = league === 'NFL' ? [
      { player: 'Josh Allen', team: 'BUF', league: 'NFL', propType: 'Passing Yds', sportsbookLine: 265.5, sportsbook: 'DraftKings', gameTime: `${date}T13:00:00-04:00` },
      { player: 'James Cook', team: 'BUF', league: 'NFL', propType: 'Rushing Yds', sportsbookLine: 68.5, sportsbook: 'FanDuel', gameTime: `${date}T13:00:00-04:00` },
      { player: 'Lamar Jackson', team: 'BAL', league: 'NFL', propType: 'Passing Yds', sportsbookLine: 225.5, sportsbook: 'FanDuel', gameTime: `${date}T16:25:00-04:00` },
      { player: 'Patrick Mahomes', team: 'KC', league: 'NFL', propType: 'Passing Yds', sportsbookLine: 278.5, sportsbook: 'DraftKings', gameTime: `${date}T20:20:00-04:00` }
    ] : [
      { player: 'Caleb Williams', team: 'USC', league: 'NCAA', propType: 'Passing Yds', sportsbookLine: 285.5, sportsbook: 'DraftKings', gameTime: `${date}T12:30:00-04:00` },
      { player: 'Carson Beck', team: 'UGA', league: 'NCAA', propType: 'Passing Yds', sportsbookLine: 275.5, sportsbook: 'FanDuel', gameTime: `${date}T15:30:00-04:00` },
      { player: 'Quinn Ewers', team: 'TEX', league: 'NCAA', propType: 'Passing Yds', sportsbookLine: 295.5, sportsbook: 'BetMGM', gameTime: `${date}T19:30:00-04:00` }
    ];

    // 3. Automatically insert or sync these slate players into your Neon database
    for (const g of slateGames) {
      await sql`
        INSERT INTO props (player, team, league, "propType", "sportsbookLine", sportsbook, "workloadScore", "recentProdScore", "matchupScore", "marketScore", "gameTime")
        VALUES (${g.player}, ${g.team}, ${g.league}, ${g.propType}, ${g.sportsbookLine}, ${g.sportsbook}, 88, 85, 82, 80, ${g.gameTime})
        ON CONFLICT DO NOTHING;
      `;
    }

    return NextResponse.json({ success: true, count: slateGames.length, message: `Auto-loaded ${slateGames.length} players for ${league} on ${date}` });
  } catch (error) {
    console.error('Auto-load slate error:', error);
    return NextResponse.json({ error: 'Failed to auto-load slate' }, { status: 500 });
  }
}