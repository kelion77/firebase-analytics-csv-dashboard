import { NextRequest, NextResponse } from 'next/server';
import { CSVAnalyticsRepository } from '@/repositories/csv-analytics-repository';
import { CSVAnalyticsService } from '@/services/csv-analytics-service';

export async function GET(request: NextRequest) {
  try {
    // Get folder name from query parameter
    const searchParams = request.nextUrl.searchParams;
    const folder = searchParams.get('folder') || 'default';

    // Use CSV-based repository with specified folder
    const repository = new CSVAnalyticsRepository(folder);
    const service = new CSVAnalyticsService(repository);

    const summary = service.getDashboardSummary();

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

