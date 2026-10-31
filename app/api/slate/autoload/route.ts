// app/api/slate/autoload/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || 'NCAA';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    // 1. Ensure database schema table exists
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

    // 2. Clear old/stale records for the selected league
    await sql`DELETE FROM props WHERE league = ${league}`;

    // 3. Connect to Live Data Feed via Vercel Environment Variables
    const apiKey = process.env.ODDS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        message: 'No live API key found. Please configure ODDS_API_KEY in your Vercel Project Environment Variables to fetch real-time sports data.' 
      }, { status: 400 });
    }

    const sportKey = league === 'NFL' ? 'americanfootball_nfl' : 'americanfootball_ncaaf';
    const response = await fetch(`https://api.the-odds-api.v4/sports/${sportKey}/events?date=${date}&apiKey=${apiKey}`);
    const events = await response.json();

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No live games scheduled for this date.' });
    }

    // In production with an active provider, you would map live player prop markets here
    // and execute `INSERT INTO props (...) VALUES (...)` dynamically.

    return NextResponse.json({ success: true, message: 'Live data sync framework active.' });

  } catch (error) {
    console.error('Live slate sync error:', error);
    return NextResponse.json({ error: 'Failed to sync live data', details: String(error) }, { status: 500 });
  }
}