import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { format, parseISO, eachDayOfInterval } from 'date-fns';

export interface AnalyticsEvent {
  eventName: string;
  eventCount: number;
  totalUsers: number;
  eventCountPerUser: number;
  totalRevenue: number;
}

export interface ScreenView {
  screenClass: string;
  views: number;
  activeUsers: number;
  viewsPerActiveUser: number;
  avgEngagementTime: number;
  eventCount: number;
  keyEvents: number;
  totalRevenue: number;
}

export interface DailyActiveUsers {
  date: string;
  activeUsers30Days: number;
  activeUsers7Days: number;
  activeUsers1Day: number;
}

export interface AnalyticsData {
  date: string;
  activeUsers: number;
  newUsers: number;
  sessions: number;
  events: AnalyticsEvent[];
  screenViews: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export class CSVAnalyticsRepository {
  private csvDir: string;

  constructor(csvDir?: string) {
    // If csvDir is provided, use it. Otherwise, use default folder
    // csvDir can be a folder name (e.g., 'default', 'project1') or full path
    if (csvDir) {
      // Check if it's a folder name (not a full path)
      if (!path.isAbsolute(csvDir) && !csvDir.includes(path.sep)) {
        // It's a folder name, construct path relative to data directory
        this.csvDir = path.join(process.cwd(), 'data', csvDir);
      } else {
        // It's a full path
        this.csvDir = csvDir;
      }
    } else {
      // Default to data/default folder
      this.csvDir = path.join(process.cwd(), 'data', 'default');
    }
  }

  /**
   * Find CSV file by pattern (handles files with or without numbers in name)
   * e.g., "Firebase_overview.csv" or "Firebase_overview1.csv"
   */
  private findCSVFile(pattern: string): string | null {
    if (!fs.existsSync(this.csvDir)) {
      return null;
    }

    const files = fs.readdirSync(this.csvDir);
    
    // Try exact match first
    if (files.includes(pattern)) {
      return path.join(this.csvDir, pattern);
    }

    // Try pattern matching (e.g., "Firebase_overview*.csv")
    const basePattern = pattern.replace('.csv', '');
    const matchingFile = files.find(file => {
      const fileName = file.toLowerCase();
      const patternLower = basePattern.toLowerCase();
      // Match files like "Firebase_overview.csv", "Firebase_overview1.csv", etc.
      return fileName.startsWith(patternLower) && fileName.endsWith('.csv');
    });

    if (matchingFile) {
      return path.join(this.csvDir, matchingFile);
    }

    return null;
  }

  /**
   * Parse CSV file and skip comment lines
   * Handles multiple sections with different column counts
   */
  private parseCSV(filePath: string, sectionHeader?: string): any[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    let headerIndex = -1;
    let dataStartIndex = -1;
    let dataEndIndex = lines.length;

    // Find the header line (first non-comment line that contains comma)
    // If sectionHeader is provided, find that specific section
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) {
        continue;
      }

      // If looking for specific section header
      if (sectionHeader && line.includes(sectionHeader)) {
        headerIndex = i;
        dataStartIndex = i + 1;
        // Find next section or end of file
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim().startsWith('#') && lines[j].includes('Start date:')) {
            dataEndIndex = j;
            break;
          }
        }
        break;
      } else if (!sectionHeader && line.includes(',')) {
        // First non-comment line with comma
        headerIndex = i;
        dataStartIndex = i + 1;
        // Find next section
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim().startsWith('#') && lines[j].includes('Start date:')) {
            dataEndIndex = j;
            break;
          }
        }
        break;
      }
    }

    if (headerIndex === -1) {
      return [];
    }

    // Extract header and data lines for this section only
    const header = lines[headerIndex];
    const dataLines = lines
      .slice(dataStartIndex, dataEndIndex)
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('#');
      });

    if (dataLines.length === 0) {
      return [];
    }

    // Parse CSV with relaxed column handling
    try {
      const records = parse(
        [header, ...dataLines].join('\n'),
        {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true, // Allow different column counts
          relax_quotes: true,
        }
      );
      return records;
    } catch (error) {
      // If parsing fails, try to parse line by line
      console.warn(`CSV parsing warning for ${filePath}:`, error);
      const records: any[] = [];
      const headerCols = header.split(',').map(c => c.trim());
      
      for (const dataLine of dataLines) {
        const cols = dataLine.split(',').map(c => c.trim());
        const record: any = {};
        headerCols.forEach((col, idx) => {
          record[col] = cols[idx] || '';
        });
        records.push(record);
      }
      return records;
    }
  }

  /**
   * Load Firebase overview data (daily active users)
   * Parses the first section with "Nth day,30 days,7 days,1 day" header
   */
  loadOverviewData(): DailyActiveUsers[] {
    const filePath = this.findCSVFile('Firebase_overview.csv');
    
    if (!filePath) {
      throw new Error(`File not found: Firebase_overview*.csv in ${this.csvDir}`);
    }

    // Parse the specific section for daily active users
    const records = this.parseCSV(filePath, '30 days');
    
    // Extract date range from comments
    const content = fs.readFileSync(filePath, 'utf-8');
    const startDateMatch = content.match(/Start date: (\d{8})/);
    const endDateMatch = content.match(/End date: (\d{8})/);
    
    const startDateStr = startDateMatch ? startDateMatch[1] : null;
    const endDateStr = endDateMatch ? endDateMatch[1] : null;

    if (!startDateStr || !endDateStr) {
      throw new Error('Could not extract date range from CSV');
    }

    // Parse dates
    const startDate = parseISO(
      `${startDateStr.substring(0, 4)}-${startDateStr.substring(4, 6)}-${startDateStr.substring(6, 8)}`
    );
    const endDate = parseISO(
      `${endDateStr.substring(0, 4)}-${endDateStr.substring(4, 6)}-${endDateStr.substring(6, 8)}`
    );

    const allDates = eachDayOfInterval({ start: startDate, end: endDate });

    return records
      .filter((record: any) => record['Nth day'] && record['30 days'])
      .map((record: any, index: number) => {
        const date = allDates[index] || startDate;
        return {
          date: format(date, 'yyyy-MM-dd'),
          activeUsers30Days: parseInt(record['30 days'] || '0', 10),
          activeUsers7Days: parseInt(record['7 days'] || '0', 10),
          activeUsers1Day: parseInt(record['1 day'] || '0', 10),
        };
      });
  }

  /**
   * Load screen views data
   */
  loadScreenViewsData(): ScreenView[] {
    // Try with and without "1" in filename
    const filePath = this.findCSVFile('Pages_and_screens_Page_title_and_screen_class1.csv') 
      || this.findCSVFile('Pages_and_screens_Page_title_and_screen_class.csv');
    
    if (!filePath) {
      throw new Error(`File not found: Pages_and_screens_Page_title_and_screen_class*.csv in ${this.csvDir}`);
    }

    const records = this.parseCSV(filePath, 'Page title and screen class');

    return records
      .filter((record: any) => record['Page title and screen class'] && record['Views'])
      .map((record: any) => ({
        screenClass: record['Page title and screen class'] || '',
        views: parseInt(record['Views'] || '0', 10),
        activeUsers: parseInt(record['Active users'] || '0', 10),
        viewsPerActiveUser: parseFloat(record['Views per active user'] || '0'),
        avgEngagementTime: parseFloat(record['Average engagement time per active user'] || '0'),
        eventCount: parseInt(record['Event count'] || '0', 10),
        keyEvents: parseInt(record['Key events'] || '0', 10),
        totalRevenue: parseFloat(record['Total revenue'] || '0'),
      }));
  }

  /**
   * Load events data
   */
  loadEventsData(): AnalyticsEvent[] {
    // Try with and without "1" in filename
    const filePath = this.findCSVFile('Events_Event_name1.csv')
      || this.findCSVFile('Events_Event_name.csv');
    
    if (!filePath) {
      throw new Error(`File not found: Events_Event_name*.csv in ${this.csvDir}`);
    }

    const records = this.parseCSV(filePath, 'Event name');

    return records
      .filter((record: any) => record['Event name'] && record['Event count'])
      .map((record: any) => ({
        eventName: record['Event name'] || '',
        eventCount: parseInt(record['Event count'] || '0', 10),
        totalUsers: parseInt(record['Total users'] || '0', 10),
        eventCountPerUser: parseFloat(record['Event count per active user'] || '0'),
        totalRevenue: parseFloat(record['Total revenue'] || '0'),
      }));
  }

  /**
   * Get default date range from overview CSV
   */
  getDefaultDateRange(): DateRange {
    const filePath = this.findCSVFile('Firebase_overview.csv');
    if (!filePath) {
      // Default to last 30 days if file not found
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      return {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      };
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const startDateMatch = content.match(/Start date: (\d{8})/);
    const endDateMatch = content.match(/End date: (\d{8})/);
    
    if (startDateMatch && endDateMatch) {
      const start = startDateMatch[1];
      const end = endDateMatch[1];
      return {
        startDate: `${start.substring(0, 4)}-${start.substring(4, 6)}-${start.substring(6, 8)}`,
        endDate: `${end.substring(0, 4)}-${end.substring(4, 6)}-${end.substring(6, 8)}`,
      };
    }

    // Default to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    };
  }

  /**
   * Fetch analytics data (compatible with existing interface)
   */
  async fetchAnalyticsData(dateRange: DateRange): Promise<AnalyticsData[]> {
    const overview = this.loadOverviewData();
    const events = this.loadEventsData();
    const screenViews = this.loadScreenViewsData();

    // Map overview data to AnalyticsData format
    return overview.map((day) => {
      // Calculate total screen views for the day (distribute across days)
      const totalScreenViews = screenViews.reduce((sum, sv) => sum + sv.views, 0);
      const dailyScreenViews = Math.round(totalScreenViews / overview.length);

      return {
        date: day.date,
        activeUsers: day.activeUsers1Day,
        newUsers: 0, // Not available in CSV
        sessions: 0, // Calculate from events if needed
        screenViews: dailyScreenViews,
        events: events.map(e => ({
          ...e,
          date: day.date,
        })),
      };
    });
  }

  /**
   * Get detailed screen_view analysis
   * screen_view events are mapped to screen classes
   */
  getScreenViewAnalysis(): {
    totalScreenViews: number;
    screenViewBreakdown: Array<{
      screenClass: string;
      views: number;
      activeUsers: number;
      avgEngagementTime: number;
      viewsPerUser: number;
    }>;
  } {
    const screenViews = this.loadScreenViewsData();
    const events = this.loadEventsData();
    
    // Get total screen_view count from events
    const screenViewEvent = events.find(e => e.eventName === 'screen_view');
    const totalScreenViews = screenViewEvent?.eventCount || 0;

    // Map screen views to detailed breakdown
    const screenViewBreakdown = screenViews
      .filter(sv => sv.screenClass && sv.screenClass !== '(not set)' && sv.screenClass !== '(other)')
      .map(sv => ({
        screenClass: sv.screenClass,
        views: sv.views,
        activeUsers: sv.activeUsers,
        avgEngagementTime: sv.avgEngagementTime,
        viewsPerUser: sv.viewsPerActiveUser,
      }))
      .sort((a, b) => b.views - a.views);

    return {
      totalScreenViews,
      screenViewBreakdown,
    };
  }

  /**
   * Get detailed user_engagement analysis
   * user_engagement events represent user interactions
   */
  getUserEngagementAnalysis(): {
    totalEngagements: number;
    totalUsers: number;
    avgEngagementsPerUser: number;
    engagementByScreen: Array<{
      screenClass: string;
      engagements: number;
      activeUsers: number;
      avgEngagementTime: number;
    }>;
  } {
    const events = this.loadEventsData();
    const screenViews = this.loadScreenViewsData();
    
    // Get user_engagement event data
    const engagementEvent = events.find(e => e.eventName === 'user_engagement');
    const totalEngagements = engagementEvent?.eventCount || 0;
    const totalUsers = engagementEvent?.totalUsers || 0;
    const avgEngagementsPerUser = engagementEvent?.eventCountPerUser || 0;

    // Map engagement to screens (using event count as proxy for engagement)
    const engagementByScreen = screenViews
      .filter(sv => sv.screenClass && sv.screenClass !== '(not set)' && sv.screenClass !== '(other)')
      .map(sv => ({
        screenClass: sv.screenClass,
        engagements: sv.eventCount, // Event count includes engagement events
        activeUsers: sv.activeUsers,
        avgEngagementTime: sv.avgEngagementTime,
      }))
      .filter(sb => sb.engagements > 0)
      .sort((a, b) => b.engagements - a.engagements);

    return {
      totalEngagements,
      totalUsers,
      avgEngagementsPerUser,
      engagementByScreen,
    };
  }

  /**
   * Get comprehensive feature usage analysis
   * Combines screen views, events, and engagement data
   */
  getFeatureUsageAnalysis(): {
    features: Array<{
      featureName: string;
      featureType: 'screen' | 'event' | 'menu' | 'action' | 'system';
      usageCount: number;
      uniqueUsers: number;
      avgUsagePerUser: number;
      engagementTime?: number;
      relatedScreens?: string[];
    }>;
  } {
    const events = this.loadEventsData();
    const screenViews = this.loadScreenViewsData();
    
    const featureMap = new Map<string, {
      featureName: string;
      featureType: 'screen' | 'event' | 'menu' | 'action' | 'system';
      usageCount: number;
      uniqueUsers: number;
      avgUsagePerUser: number;
      engagementTime?: number;
      relatedScreens?: string[];
    }>();

    // Process screen-based features
    screenViews.forEach(screen => {
      if (screen.screenClass && screen.screenClass !== '(not set)' && screen.screenClass !== '(other)') {
        const featureName = screen.screenClass;
        featureMap.set(featureName, {
          featureName,
          featureType: 'screen',
          usageCount: screen.views,
          uniqueUsers: screen.activeUsers,
          avgUsagePerUser: screen.viewsPerActiveUser,
          engagementTime: screen.avgEngagementTime,
        });
      }
    });

    // Process event-based features
    events.forEach(event => {
      const featureName = event.eventName;
      
      // Categorize feature type
      let featureType: 'screen' | 'event' | 'menu' | 'action' | 'system' = 'event';
      if (featureName.startsWith('menu_')) {
        featureType = 'menu';
      } else if (featureName.includes('login') || featureName.includes('logout') || featureName.includes('select_')) {
        featureType = 'action';
      } else if (['screen_view', 'user_engagement', 'session_start', 'app_update', 'os_update', 'first_open'].includes(featureName)) {
        featureType = 'system';
      }

      const existing = featureMap.get(featureName);
      if (existing) {
        // Merge with existing screen data
        existing.usageCount += event.eventCount;
        existing.uniqueUsers = Math.max(existing.uniqueUsers, event.totalUsers);
        existing.avgUsagePerUser = existing.usageCount / (existing.uniqueUsers || 1);
      } else {
        featureMap.set(featureName, {
          featureName,
          featureType,
          usageCount: event.eventCount,
          uniqueUsers: event.totalUsers,
          avgUsagePerUser: event.eventCountPerUser,
        });
      }
    });

    // Find related screens for menu/action features
    featureMap.forEach((feature, featureName) => {
      if (feature.featureType === 'menu' || feature.featureType === 'action') {
        // Try to find related screen by matching feature name patterns
        const relatedScreens: string[] = [];
        screenViews.forEach(screen => {
          const screenName = screen.screenClass.toLowerCase();
          const featureLower = featureName.toLowerCase();
          
          // Match patterns like menu_document -> DocumentViewController
          if (featureLower.includes('document') && screenName.includes('document')) {
            relatedScreens.push(screen.screenClass);
          } else if (featureLower.includes('course') && screenName.includes('course')) {
            relatedScreens.push(screen.screenClass);
          } else if (featureLower.includes('dashboard') && screenName.includes('dashboard')) {
            relatedScreens.push(screen.screenClass);
          } else if (featureLower.includes('audit') && screenName.includes('audit')) {
            relatedScreens.push(screen.screenClass);
          } else if (featureLower.includes('communication') && screenName.includes('communication')) {
            relatedScreens.push(screen.screenClass);
          }
        });
        
        if (relatedScreens.length > 0) {
          feature.relatedScreens = [...new Set(relatedScreens)];
        }
      }
    });

    const features = Array.from(featureMap.values())
      .sort((a, b) => b.usageCount - a.usageCount);

    return { features };
  }
}

