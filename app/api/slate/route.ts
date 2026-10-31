// app/api/slate/route.ts
import { NextResponse } from 'next/server';
import { getTimeSlotFromDate, getTodayDateString } from '@/lib/slates';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('league') || 'NFL'; // 'NFL' or 'NCAA'
  const date = searchParams.get('date') || getTodayDateString();
  const slot = searchParams.get('slot') || 'ALL'; // 'EARLY' | 'AFTERNOON' | 'LATE' | 'ALL'

  try {
    // Replace this section with your external odds/stats provider call (e.g., The-Odds-API or SportsData.io)
    // For demonstration, querying scheduled slates:
    const mockGames = [
      { id: '1', player: 'Josh Allen', team: 'BUF', league: 'NFL', propType: 'Passing Yds', sportsbookLine: 265.5, sportsbook: 'DraftKings', kickOffTime: `${date}T13:00:00-04:00` },
      { id: '2', player: 'Lamar Jackson', team: 'BAL', league: 'NFL', propType: 'Rushing Yds', sportsbookLine: 52.5, sportsbook: 'FanDuel', kickOffTime: `${date}T16:25:00-04:00` },
      { id: '3', player: 'Patrick Mahomes', team: 'KC', league: 'NFL', propType: 'Passing Yds', sportsbookLine: 278.5, sportsbook: 'BetMGM', kickOffTime: `${date}T20:20:00-04:00` }
    ];

    const filtered = mockGames.filter(game => {
      if (game.league !== sport) return false;
      const gameSlot = getTimeSlotFromDate(new Date(game.kickOffTime));
      if (slot !== 'ALL' && gameSlot !== slot) return false;
      return true;
    });

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch slate props' }, { status: 500 });
  }
}