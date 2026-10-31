import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const props = await sql`SELECT * FROM props ORDER BY id DESC`;
    return NextResponse.json(props);
  } catch (error) {
    console.error('Failed to fetch props:', error);
    return NextResponse.json({ error: 'Failed to fetch props' }, { status: 500 });
  }
}