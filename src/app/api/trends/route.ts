import { NextResponse } from 'next/server';
import googleTrends from 'google-trends-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword');

  if (!keyword) {
    return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
  }

  try {
    // Default to last 1 year if not specified
    const startTime = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    
    const results = await googleTrends.interestOverTime({
      keyword,
      startTime,
    });
    
    const parsedResults = JSON.parse(results);
    
    // The google-trends-api format usually has a default.timelineData array
    // timelineData: [{ time: string, formattedTime: string, formattedAxisTime: string, value: number[], hasData: boolean[] }]
    const timelineData = parsedResults.default?.timelineData || [];
    
    return NextResponse.json(timelineData);
  } catch (error) {
    console.error('Error fetching trends data:', error);
    return NextResponse.json({ error: 'Failed to fetch trends data' }, { status: 500 });
  }
}
