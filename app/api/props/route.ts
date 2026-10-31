import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    // Automatically ensure the table exists so it never throws a 500 error
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

    const props = await sql`SELECT * FROM props ORDER BY id DESC`;
    return NextResponse.json(props);
  } catch (error) {
    console.error('Failed to fetch props:', error);
    return NextResponse.json({ error: 'Failed to fetch props', details: String(error) }, { status: 500 });
  }
}