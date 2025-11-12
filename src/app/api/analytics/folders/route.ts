import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Get list of available CSV data folders
 */
export async function GET(request: NextRequest) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    
    // Check if data directory exists
    if (!fs.existsSync(dataDir)) {
      return NextResponse.json({ folders: [] });
    }

    // Get all subdirectories in data folder
    const entries = fs.readdirSync(dataDir, { withFileTypes: true });
    const folders = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .filter(name => {
        // Check if folder contains required CSV files (with flexible naming)
        const folderPath = path.join(dataDir, name);
        const files = fs.readdirSync(folderPath);
        
        // Check for Firebase_overview*.csv
        const hasOverview = files.some(file => 
          file.toLowerCase().startsWith('firebase_overview') && file.toLowerCase().endsWith('.csv')
        );
        
        // Check for Events_Event_name*.csv
        const hasEvents = files.some(file => 
          file.toLowerCase().startsWith('events_event_name') && file.toLowerCase().endsWith('.csv')
        );
        
        // Check for Pages_and_screens_Page_title_and_screen_class*.csv
        const hasPages = files.some(file => 
          file.toLowerCase().startsWith('pages_and_screens_page_title_and_screen_class') && file.toLowerCase().endsWith('.csv')
        );
        
        return hasOverview && hasEvents && hasPages;
      })
      .sort();

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error', folders: [] },
      { status: 500 }
    );
  }
}

