import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      player, team, league, position, propType, 
      sportsbookLine, sportsbook, odds, 
      workloadScore, recentProdScore, matchupScore, marketScore 
    } = body;

    // 1. Check if player exists, or create a new player record
    let existingPlayer = await sql`SELECT id FROM players WHERE name = ${player} LIMIT 1`;
    let playerId = existingPlayer[0]?.id;

    if (!playerId) {
      const newPlayer = await sql`
        INSERT INTO players (name, league, team, position, avatar_url)
        VALUES (${player}, ${league}, ${team}, ${position || 'ATH'}, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')
        RETURNING id
      `;
      playerId = newPlayer[0].id;
    }

    // 2. Insert the new prop into the player_props table
    const newProp = await sql`
      INSERT INTO player_props (
        player_id, prop_type, sportsbook_line, sportsbook, odds, 
        workload_score, recent_prod_score, matchup_score, market_score
      )
      VALUES (
        ${playerId}, ${propType}, ${sportsbookLine}, ${sportsbook || 'FanDuel'}, ${odds || '-110'},
        ${workloadScore}, ${recentProdScore}, ${matchupScore}, ${marketScore}
      )
      RETURNING id
    `;

    return NextResponse.json({ success: true, propId: newProp[0].id });
  } catch (error) {
    console.error('Error creating prop:', error);
    return NextResponse.json({ error: 'Failed to create prop' }, { status: 500 });
  }
}