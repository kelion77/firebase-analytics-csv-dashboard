import { CSVAnalyticsRepository, AnalyticsEvent, ScreenView, DailyActiveUsers, DateRange } from '@/repositories/csv-analytics-repository';

export interface FeatureUsageStats {
  featureName: string;
  usageCount: number;
  uniqueUsers: number;
  avgUsagePerUser: number;
  category: 'screen' | 'event' | 'engagement';
}

export interface EngagementAnalysis {
  totalEngagements: number;
  avgEngagementTime: number;
  topScreens: ScreenView[];
  engagementByScreen: Map<string, number>;
}

export interface ScreenViewAnalysis {
  totalScreenViews: number;
  screenViewBreakdown: Array<{
    screenClass: string;
    views: number;
    activeUsers: number;
    avgEngagementTime: number;
    viewsPerUser: number;
  }>;
}

export interface UserEngagementAnalysis {
  totalEngagements: number;
  totalUsers: number;
  avgEngagementsPerUser: number;
  engagementByScreen: Array<{
    screenClass: string;
    engagements: number;
    activeUsers: number;
    avgEngagementTime: number;
  }>;
}

export interface FeatureUsageDetail {
  featureName: string;
  featureType: 'screen' | 'event' | 'menu' | 'action' | 'system';
  usageCount: number;
  uniqueUsers: number;
  avgUsagePerUser: number;
  engagementTime?: number;
  relatedScreens?: string[];
}

export interface DashboardSummary {
  totalActiveUsers: number;
  totalScreenViews: number;
  totalEvents: number;
  topFeatures: FeatureUsageStats[];
  topScreens: ScreenView[];
  topEvents: AnalyticsEvent[];
  engagementAnalysis: EngagementAnalysis;
  dailyData: DailyActiveUsers[];
  dateRange: DateRange;
  screenViewAnalysis: ScreenViewAnalysis;
  userEngagementAnalysis: UserEngagementAnalysis;
  featureUsageDetails: FeatureUsageDetail[];
}

export class CSVAnalyticsService {
  private repository: CSVAnalyticsRepository;

  constructor(repository: CSVAnalyticsRepository) {
    this.repository = repository;
  }

  /**
   * Get comprehensive dashboard summary
   */
  getDashboardSummary(): DashboardSummary {
    const overview = this.repository.loadOverviewData();
    const events = this.repository.loadEventsData();
    const screenViews = this.repository.loadScreenViewsData();
    const dateRange = this.repository.getDefaultDateRange();

    // Calculate totals
    // Total Active Users: Use unique users from screen_view event (most accurate)
    // This represents unique users who were active during the period
    const screenViewEvent = events.find(e => e.eventName === 'screen_view');
    const totalActiveUsers = screenViewEvent?.totalUsers || 0;
    
    // Alternative: Use max 30-day active users from overview (if screen_view not available)
    // const totalActiveUsers = overview.length > 0 
    //   ? Math.max(...overview.map(d => d.activeUsers30Days))
    //   : 0;
    
    const totalScreenViews = screenViews.reduce((sum, sv) => sum + sv.views, 0);
    const totalEvents = events.reduce((sum, e) => sum + e.eventCount, 0);

    // Analyze feature usage
    const topFeatures = this.analyzeFeatureUsage(events, screenViews);
    
    // Top screens (by views)
    const topScreens = [...screenViews]
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);

    // All events sorted by count (show all events, not just top)
    const topEvents = [...events]
      .sort((a, b) => b.eventCount - a.eventCount);

    // Engagement analysis
    const engagementAnalysis = this.analyzeEngagement(screenViews, events);

    // Detailed screen_view analysis
    const screenViewAnalysis = this.repository.getScreenViewAnalysis();

    // Detailed user_engagement analysis
    const userEngagementAnalysis = this.repository.getUserEngagementAnalysis();

    // Comprehensive feature usage analysis
    const featureUsageDetails = this.repository.getFeatureUsageAnalysis().features;

    return {
      totalActiveUsers,
      totalScreenViews,
      totalEvents,
      topFeatures,
      topScreens,
      topEvents,
      engagementAnalysis,
      dailyData: overview,
      dateRange,
      screenViewAnalysis,
      userEngagementAnalysis,
      featureUsageDetails,
    };
  }

  /**
   * Analyze feature usage from events and screens
   * Enhanced to include screen_view and user_engagement insights
   */
  private analyzeFeatureUsage(events: AnalyticsEvent[], screenViews: ScreenView[]): FeatureUsageStats[] {
    const features: Map<string, FeatureUsageStats> = new Map();

    // Add screen-based features (screen_view events mapped to screens)
    screenViews.forEach(screen => {
      if (screen.screenClass && screen.screenClass !== '(not set)' && screen.screenClass !== '(other)') {
        const featureName = screen.screenClass;
        features.set(featureName, {
          featureName,
          usageCount: screen.views,
          uniqueUsers: screen.activeUsers,
          avgUsagePerUser: screen.viewsPerActiveUser,
          category: 'screen',
        });
      }
    });

    // Add event-based features
    // Include screen_view and user_engagement for detailed analysis
    const systemEvents = ['session_start', 'app_update', 'os_update', 'first_open'];
    events.forEach(event => {
      if (!systemEvents.includes(event.eventName)) {
        const existing = features.get(event.eventName);
        if (existing) {
          // Merge with existing screen data
          existing.usageCount += event.eventCount;
          existing.uniqueUsers = Math.max(existing.uniqueUsers, event.totalUsers);
          existing.avgUsagePerUser = existing.usageCount / (existing.uniqueUsers || 1);
        } else {
          // Determine category
          let category: 'screen' | 'event' | 'engagement' = 'event';
          if (event.eventName === 'screen_view') {
            category = 'screen';
          } else if (event.eventName === 'user_engagement') {
            category = 'engagement';
          } else if (event.eventName.startsWith('menu_')) {
            category = 'event';
          }

          features.set(event.eventName, {
            featureName: event.eventName,
            usageCount: event.eventCount,
            uniqueUsers: event.totalUsers,
            avgUsagePerUser: event.eventCountPerUser,
            category,
          });
        }
      }
    });

    return Array.from(features.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 50); // Increased limit to show more features
  }

  /**
   * Analyze user engagement patterns
   */
  private analyzeEngagement(screenViews: ScreenView[], events: AnalyticsEvent[]): EngagementAnalysis {
    const totalEngagements = screenViews.reduce((sum, sv) => sum + sv.eventCount, 0);
    
    const totalEngagementTime = screenViews.reduce(
      (sum, sv) => sum + (sv.avgEngagementTime * sv.activeUsers),
      0
    );
    const totalUsers = screenViews.reduce((sum, sv) => sum + sv.activeUsers, 0);
    const avgEngagementTime = totalUsers > 0 ? totalEngagementTime / totalUsers : 0;

    const topScreens = [...screenViews]
      .sort((a, b) => b.avgEngagementTime - a.avgEngagementTime)
      .slice(0, 10);

    const engagementByScreen = new Map<string, number>();
    screenViews.forEach(sv => {
      engagementByScreen.set(sv.screenClass, sv.avgEngagementTime);
    });

    return {
      totalEngagements,
      avgEngagementTime,
      topScreens,
      engagementByScreen,
    };
  }

  /**
   * Get detailed screen view analysis
   */
  getScreenViewAnalysis(): {
    topScreens: ScreenView[];
    screensByEngagement: ScreenView[];
    screensByUsers: ScreenView[];
  } {
    const screenViews = this.repository.loadScreenViewsData();

    return {
      topScreens: [...screenViews].sort((a, b) => b.views - a.views).slice(0, 20),
      screensByEngagement: [...screenViews].sort((a, b) => b.avgEngagementTime - a.avgEngagementTime).slice(0, 20),
      screensByUsers: [...screenViews].sort((a, b) => b.activeUsers - a.activeUsers).slice(0, 20),
    };
  }

  /**
   * Get detailed event analysis
   */
  getEventAnalysis(): {
    customEvents: AnalyticsEvent[];
    systemEvents: AnalyticsEvent[];
    eventsByUsers: AnalyticsEvent[];
  } {
    const events = this.repository.loadEventsData();
    const systemEvents = ['screen_view', 'user_engagement', 'session_start', 'app_update', 'os_update', 'first_open'];

    return {
      customEvents: events.filter(e => !systemEvents.includes(e.eventName)),
      systemEvents: events.filter(e => systemEvents.includes(e.eventName)),
      eventsByUsers: [...events].sort((a, b) => b.totalUsers - a.totalUsers),
    };
  }

  /**
   * Generate report data
   */
  generateReportData(folder?: string): {
    summary: DashboardSummary;
    csvData: string;
  } {
    const summary = this.getDashboardSummary();
    const csvData = this.convertToCSV(summary, folder);

    return {
      summary,
      csvData,
    };
  }

  /**
   * Convert summary to CSV format
   * Comprehensive report with all analysis data
   */
  private convertToCSV(summary: DashboardSummary, folder?: string): string {
    const lines: string[] = [];
    
    // Header section
    const reportTitle = folder && folder !== 'default' 
      ? `Firebase Analytics Report - ${folder}`
      : 'Firebase Analytics Report';
    lines.push(reportTitle);
    lines.push(`Period,${summary.dateRange.startDate} ~ ${summary.dateRange.endDate}`);
    if (folder && folder !== 'default') {
      lines.push(`Data Source,${folder}`);
    }
    lines.push('');
    
    // Summary stats
    lines.push('SUMMARY');
    lines.push('Metric,Value');
    lines.push(`Total Active Users,${summary.totalActiveUsers}`);
    lines.push(`Total Screen Views,${summary.totalScreenViews}`);
    lines.push(`Total Events,${summary.totalEvents}`);
    lines.push(`Average Engagement Time (seconds),${summary.engagementAnalysis.avgEngagementTime.toFixed(2)}`);
    lines.push('');
    
    // Screen View Analysis
    lines.push('SCREEN VIEW ANALYSIS');
    lines.push('Screen Class,Views,Active Users,Views Per User,Avg Engagement Time (s)');
    summary.screenViewAnalysis.screenViewBreakdown.slice(0, 30).forEach(screen => {
      lines.push(`${screen.screenClass},${screen.views},${screen.activeUsers},${screen.viewsPerUser.toFixed(2)},${screen.avgEngagementTime.toFixed(1)}`);
    });
    lines.push('');
    
    // User Engagement Analysis
    lines.push('USER ENGAGEMENT ANALYSIS');
    lines.push('Screen Class,Engagements,Active Users,Avg Engagement Time (s)');
    summary.userEngagementAnalysis.engagementByScreen.slice(0, 30).forEach(screen => {
      lines.push(`${screen.screenClass},${screen.engagements},${screen.activeUsers},${screen.avgEngagementTime.toFixed(1)}`);
    });
    lines.push('');
    
    // All Events
    lines.push('ALL EVENTS');
    lines.push('Event Name,Event Count,Total Users,Event Count Per User');
    summary.topEvents.forEach(event => {
      lines.push(`${event.eventName},${event.eventCount},${event.totalUsers},${event.eventCountPerUser.toFixed(2)}`);
    });
    lines.push('');
    
    // Top Screens
    lines.push('TOP SCREENS');
    lines.push('Screen Class,Views,Active Users,Views Per User,Avg Engagement Time (s)');
    summary.topScreens.forEach(screen => {
      lines.push(`${screen.screenClass},${screen.views},${screen.activeUsers},${screen.viewsPerActiveUser.toFixed(2)},${screen.avgEngagementTime.toFixed(1)}`);
    });
    lines.push('');
    
    // Feature Usage Details
    lines.push('COMPREHENSIVE FEATURE USAGE');
    lines.push('Feature Name,Type,Usage Count,Unique Users,Avg Usage Per User,Engagement Time (s)');
    summary.featureUsageDetails.slice(0, 50).forEach(feature => {
      const engagementTime = feature.engagementTime ? feature.engagementTime.toFixed(1) : '';
      lines.push(`${feature.featureName},${feature.featureType},${feature.usageCount},${feature.uniqueUsers},${feature.avgUsagePerUser.toFixed(2)},${engagementTime}`);
    });
    lines.push('');
    
    // Top Features Summary
    lines.push('TOP FEATURES SUMMARY');
    lines.push('Feature Name,Category,Usage Count,Unique Users,Avg Usage Per User');
    summary.topFeatures.slice(0, 30).forEach(feature => {
      lines.push(`${feature.featureName},${feature.category},${feature.usageCount},${feature.uniqueUsers},${feature.avgUsagePerUser.toFixed(2)}`);
    });

    return lines.join('\n');
  }
}

