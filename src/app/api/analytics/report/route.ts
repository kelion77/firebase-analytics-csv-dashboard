import { NextRequest, NextResponse } from 'next/server';
import { CSVAnalyticsRepository } from '@/repositories/csv-analytics-repository';
import { CSVAnalyticsService } from '@/services/csv-analytics-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv'; // csv or html
    const folder = searchParams.get('folder') || 'default'; // folder name

    const repository = new CSVAnalyticsRepository(folder);
    const service = new CSVAnalyticsService(repository);

    const reportData = service.generateReportData(folder);
    const dateRange = repository.getDefaultDateRange();

    // Generate filename prefix based on folder
    const folderPrefix = folder !== 'default' ? `${folder}-` : '';
    const timestamp = Date.now();

    if (format === 'html') {
      const htmlReport = generateHTMLReport(reportData.summary, dateRange, folder);
      return new NextResponse(htmlReport, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="analytics-report-${folderPrefix}${timestamp}.html"`,
        },
      });
    }

    // Default: CSV format
    return new NextResponse(reportData.csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-report-${folderPrefix}${timestamp}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function generateHTMLReport(summary: any, dateRange: any, folder: string = 'default'): string {
  // Prepare chart data (same as dashboard)
  const dailyChartData = summary.dailyData?.map((day: any) => ({
    date: day.date.substring(5).replace('-', '/'), // MM/DD format
    activeUsers: day.activeUsers1Day,
    activeUsers7Days: day.activeUsers7Days,
    activeUsers30Days: day.activeUsers30Days,
  })) || [];

  const topFeaturesData = summary.topFeatures?.slice(0, 10).map((f: any) => ({
    name: f.featureName.length > 20 ? f.featureName.substring(0, 20) + '...' : f.featureName,
    usage: f.usageCount,
    users: f.uniqueUsers,
  })) || [];

  const topScreensData = summary.topScreens?.slice(0, 10).map((s: any) => ({
    name: s.screenClass.length > 25 ? s.screenClass.substring(0, 25) + '...' : s.screenClass,
    views: s.views,
    users: s.activeUsers,
  })) || [];

  const topEventsData = summary.topEvents?.slice(0, 10).map((e: any) => ({
    name: e.eventName,
    count: e.eventCount,
    users: e.totalUsers,
  })) || [];

  const topEventsRows = summary.topEvents
    .map(
      (event: any) => `
    <tr>
      <td>${event.eventName}</td>
      <td>${event.eventCount.toLocaleString()}</td>
      <td>${event.totalUsers.toLocaleString()}</td>
      <td>${event.eventCountPerUser.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const topScreensRows = summary.topScreens
    .slice(0, 30)
    .map(
      (screen: any) => `
    <tr>
      <td>${screen.screenClass}</td>
      <td>${screen.views.toLocaleString()}</td>
      <td>${screen.activeUsers.toLocaleString()}</td>
      <td>${screen.viewsPerActiveUser.toFixed(2)}</td>
      <td>${screen.avgEngagementTime.toFixed(1)}s</td>
    </tr>
  `
    )
    .join('');

  const topFeaturesRows = summary.topFeatures
    .slice(0, 30)
    .map(
      (feature: any) => `
    <tr>
      <td>${feature.featureName}</td>
      <td><span class="badge badge-${feature.category}">${feature.category}</span></td>
      <td>${feature.usageCount.toLocaleString()}</td>
      <td>${feature.uniqueUsers.toLocaleString()}</td>
      <td>${feature.avgUsagePerUser.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  // Screen View Analysis rows
  const screenViewRows = summary.screenViewAnalysis?.screenViewBreakdown
    .slice(0, 30)
    .map(
      (screen: any) => `
    <tr>
      <td>${screen.screenClass}</td>
      <td>${screen.views.toLocaleString()}</td>
      <td>${screen.activeUsers.toLocaleString()}</td>
      <td>${screen.viewsPerUser.toFixed(2)}</td>
      <td>${screen.avgEngagementTime.toFixed(1)}s</td>
    </tr>
  `
    )
    .join('') || '';

  // User Engagement Analysis rows
  const engagementRows = summary.userEngagementAnalysis?.engagementByScreen
    .slice(0, 30)
    .map(
      (screen: any) => `
    <tr>
      <td>${screen.screenClass}</td>
      <td>${screen.engagements.toLocaleString()}</td>
      <td>${screen.activeUsers.toLocaleString()}</td>
      <td>${screen.avgEngagementTime.toFixed(1)}s</td>
    </tr>
  `
    )
    .join('') || '';

  // Feature Usage Details rows
  const featureDetailsRows = summary.featureUsageDetails
    ?.slice(0, 50)
    .map(
      (feature: any) => `
    <tr>
      <td>${feature.featureName}</td>
      <td><span class="badge badge-${feature.featureType}">${feature.featureType}</span></td>
      <td>${feature.usageCount.toLocaleString()}</td>
      <td>${feature.uniqueUsers.toLocaleString()}</td>
      <td>${feature.avgUsagePerUser.toFixed(2)}</td>
      <td>${feature.engagementTime ? feature.engagementTime.toFixed(1) + 's' : '-'}</td>
    </tr>
  `
    )
    .join('') || '';

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analytics Report${folder !== 'default' ? ` - ${folder}` : ''} - ${dateRange.startDate} ~ ${dateRange.endDate}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 10px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .summary-card h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
      margin: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #333;
    }
    tr:hover {
      background-color: #f8f9fa;
    }
    .date-range {
      color: #666;
      margin-bottom: 20px;
    }
    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-screen { background-color: #dbeafe; color: #1e40af; }
    .badge-event { background-color: #d1fae5; color: #065f46; }
    .badge-menu { background-color: #fef3c7; color: #92400e; }
    .badge-action { background-color: #fed7aa; color: #9a3412; }
    .badge-system { background-color: #e5e7eb; color: #374151; }
    .badge-engagement { background-color: #e9d5ff; color: #6b21a8; }
    h2 {
      margin-top: 40px;
      color: #333;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 8px;
    }
    .section-info {
      background-color: #f0f9ff;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
      border-left: 4px solid #3b82f6;
    }
    .chart-container {
      position: relative;
      height: 400px;
      margin: 30px 0;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .chart-wrapper {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 30px;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Firebase Analytics Report${folder !== 'default' ? ` - ${folder}` : ''}</h1>
    <div class="date-range">
      <strong>Period:</strong> ${dateRange.startDate} ~ ${dateRange.endDate}
      ${folder !== 'default' ? `<br><strong>Data Source:</strong> ${folder}` : ''}
    </div>
    
    <div class="summary">
      <div class="summary-card">
        <h3>Active Users</h3>
        <p class="value">${summary.totalActiveUsers.toLocaleString()}</p>
      </div>
      <div class="summary-card">
        <h3>Screen Views</h3>
        <p class="value">${summary.totalScreenViews.toLocaleString()}</p>
      </div>
      <div class="summary-card">
        <h3>Total Events</h3>
        <p class="value">${summary.totalEvents.toLocaleString()}</p>
      </div>
      <div class="summary-card">
        <h3>Avg Engagement</h3>
        <p class="value">${summary.engagementAnalysis.avgEngagementTime.toFixed(1)}s</p>
      </div>
    </div>

    <h2>📈 Daily Active Users Trend</h2>
    <div class="chart-container">
      <canvas id="dailyUsersChart"></canvas>
    </div>

    <div class="chart-wrapper">
      <div class="chart-container">
        <h3 style="margin-top: 0;">Top Features Usage</h3>
        <canvas id="topFeaturesChart"></canvas>
      </div>
      <div class="chart-container">
        <h3 style="margin-top: 0;">Top Screens by Views</h3>
        <canvas id="topScreensChart"></canvas>
      </div>
    </div>

    <div class="chart-container">
      <h3 style="margin-top: 0;">Top Events</h3>
      <canvas id="topEventsChart"></canvas>
    </div>

    <h2>All Events (${summary.topEvents?.length || 0} total)</h2>
    <table>
      <thead>
        <tr>
          <th>Event Name</th>
          <th>Event Count</th>
          <th>Total Users</th>
          <th>Count Per User</th>
          <th>Total Revenue</th>
        </tr>
      </thead>
      <tbody>
        ${topEventsRows}
      </tbody>
    </table>

    <h2>Top Screens</h2>
    <table>
      <thead>
        <tr>
          <th>Screen Class</th>
          <th>Views</th>
          <th>Active Users</th>
          <th>Views/User</th>
          <th>Avg Engagement Time</th>
        </tr>
      </thead>
      <tbody>
        ${topScreensRows}
      </tbody>
    </table>

    <h2>Top Features</h2>
    <table>
      <thead>
        <tr>
          <th>Feature Name</th>
          <th>Category</th>
          <th>Usage Count</th>
          <th>Unique Users</th>
          <th>Avg Usage/User</th>
        </tr>
      </thead>
      <tbody>
        ${topFeaturesRows}
      </tbody>
    </table>

    ${screenViewRows ? `
    <h2>📱 Screen View Analysis</h2>
    <div class="section-info">
      <strong>Total Screen Views:</strong> ${summary.screenViewAnalysis?.totalScreenViews.toLocaleString() || 0} | 
      <strong>Unique Screens:</strong> ${summary.screenViewAnalysis?.screenViewBreakdown?.length || 0}
    </div>
    <table>
      <thead>
        <tr>
          <th>Screen Class</th>
          <th>Views</th>
          <th>Active Users</th>
          <th>Views/User</th>
          <th>Avg Engagement (s)</th>
        </tr>
      </thead>
      <tbody>
        ${screenViewRows}
      </tbody>
    </table>
    ` : ''}

    ${engagementRows ? `
    <h2>💫 User Engagement Analysis</h2>
    <div class="section-info">
      <strong>Total Engagements:</strong> ${summary.userEngagementAnalysis?.totalEngagements.toLocaleString() || 0} | 
      <strong>Engaged Users:</strong> ${summary.userEngagementAnalysis?.totalUsers.toLocaleString() || 0} | 
      <strong>Avg Engagements/User:</strong> ${summary.userEngagementAnalysis?.avgEngagementsPerUser.toFixed(2) || 0}
    </div>
    <table>
      <thead>
        <tr>
          <th>Screen Class</th>
          <th>Engagements</th>
          <th>Active Users</th>
          <th>Avg Engagement (s)</th>
        </tr>
      </thead>
      <tbody>
        ${engagementRows}
      </tbody>
    </table>
    ` : ''}

    ${featureDetailsRows ? `
    <h2>🎯 Comprehensive Feature Usage Analysis</h2>
    <div class="section-info">
      <strong>Total Features:</strong> ${summary.featureUsageDetails?.length || 0} | 
      <strong>Screens:</strong> ${summary.featureUsageDetails?.filter((f: any) => f.featureType === 'screen').length || 0} | 
      <strong>Menus:</strong> ${summary.featureUsageDetails?.filter((f: any) => f.featureType === 'menu').length || 0} | 
      <strong>Actions:</strong> ${summary.featureUsageDetails?.filter((f: any) => f.featureType === 'action').length || 0}
    </div>
    <table>
      <thead>
        <tr>
          <th>Feature Name</th>
          <th>Type</th>
          <th>Usage Count</th>
          <th>Unique Users</th>
          <th>Avg Usage/User</th>
          <th>Engagement Time</th>
        </tr>
      </thead>
      <tbody>
        ${featureDetailsRows}
      </tbody>
    </table>
    ` : ''}
  </div>

  <script>
    // Daily Active Users Chart
    const dailyData = ${JSON.stringify(dailyChartData)};
    new Chart(document.getElementById('dailyUsersChart'), {
      type: 'line',
      data: {
        labels: dailyData.map(d => d.date),
        datasets: [
          {
            label: '1 Day Active',
            data: dailyData.map(d => d.activeUsers),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
          },
          {
            label: '7 Days Active',
            data: dailyData.map(d => d.activeUsers7Days),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4
          },
          {
            label: '30 Days Active',
            data: dailyData.map(d => d.activeUsers30Days),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    // Top Features Chart
    const featuresData = ${JSON.stringify(topFeaturesData)};
    new Chart(document.getElementById('topFeaturesChart'), {
      type: 'bar',
      data: {
        labels: featuresData.map(f => f.name),
        datasets: [
          {
            label: 'Usage Count',
            data: featuresData.map(f => f.usage),
            backgroundColor: '#3b82f6'
          },
          {
            label: 'Unique Users',
            data: featuresData.map(f => f.users),
            backgroundColor: '#10b981'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    // Top Screens Chart
    const screensData = ${JSON.stringify(topScreensData)};
    new Chart(document.getElementById('topScreensChart'), {
      type: 'bar',
      data: {
        labels: screensData.map(s => s.name),
        datasets: [
          {
            label: 'Views',
            data: screensData.map(s => s.views),
            backgroundColor: '#8b5cf6'
          },
          {
            label: 'Active Users',
            data: screensData.map(s => s.users),
            backgroundColor: '#f59e0b'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    // Top Events Chart
    const eventsData = ${JSON.stringify(topEventsData)};
    new Chart(document.getElementById('topEventsChart'), {
      type: 'bar',
      data: {
        labels: eventsData.map(e => e.name),
        datasets: [
          {
            label: 'Event Count',
            data: eventsData.map(e => e.count),
            backgroundColor: '#3b82f6'
          },
          {
            label: 'Total Users',
            data: eventsData.map(e => e.users),
            backgroundColor: '#10b981'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  </script>
</body>
</html>
  `;
}

