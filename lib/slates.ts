// lib/slates.ts

export type TimeSlot = 'EARLY' | 'AFTERNOON' | 'LATE' | 'ALL';

export function getTimeSlotFromDate(date: Date): TimeSlot {
  // Convert date to EDT hour
  const edtTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hours = edtTime.getHours();

  if (hours >= 12 && hours <= 14) return 'EARLY';
  if (hours >= 14 && hours < 19) return 'AFTERNOON';
  if (hours >= 19) return 'LATE';
  return 'EARLY'; // Default fallthrough for morning kickoffs
}

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}