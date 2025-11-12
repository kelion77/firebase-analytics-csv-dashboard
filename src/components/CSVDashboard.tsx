'use client';

import { DashboardSummary } from '@/services/csv-analytics-service';
import { format, parseISO } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface CSVDashboardProps {
  data: DashboardSummary;
  onRefresh: () => void;
  folders?: string[];
  selectedFolder?: string;
  onFolderChange?: (folder: string) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export default function CSVDashboard({ data, onRefresh, folders = [], selectedFolder = 'default', onFolderChange }: CSVDashboardProps) {
  const {
    totalActiveUsers,
    totalScreenViews,
    totalEvents,
    topFeatures,
    topScreens,
    topEvents,
    engagementAnalysis,
    dailyData,
    dateRange,
    screenViewAnalysis,
    userEngagementAnalysis,
    featureUsageDetails,
  } = data;

  // Prepare chart data
  const dailyChartData = dailyData.map((day) => ({
    date: format(parseISO(day.date), 'MM/dd'),
    activeUsers: day.activeUsers1Day,
    activeUsers7Days: day.activeUsers7Days,
    activeUsers30Days: day.activeUsers30Days,
  }));

  // Top features chart data
  const topFeaturesData = topFeatures.slice(0, 10).map((f) => ({
    name: f.featureName.length > 20 ? f.featureName.substring(0, 20) + '...' : f.featureName,
    usage: f.usageCount,
    users: f.uniqueUsers,
    category: f.category,
  }));

  // Top screens chart data
  const topScreensData = topScreens.slice(0, 10).map((s) => ({
    name: s.screenClass.length > 25 ? s.screenClass.substring(0, 25) + '...' : s.screenClass,
    views: s.views,
    users: s.activeUsers,
    engagement: s.avgEngagementTime,
  }));

  // Top events chart data
  const topEventsData = topEvents.slice(0, 10).map((e) => ({
    name: e.eventName,
    count: e.eventCount,
    users: e.totalUsers,
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Firebase Analytics Dashboard (CSV Data)
          </h1>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {folders.length > 0 && onFolderChange && (
                <div className="flex items-center gap-2">
                  <label htmlFor="folder-select" className="text-sm font-medium text-gray-700">
                    Data Source:
                  </label>
                  <select
                    id="folder-select"
                    value={selectedFolder}
                    onChange={(e) => onFolderChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {folders.map((folder) => (
                      <option key={folder} value={folder}>
                        {folder}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <p className="text-gray-600">
                {format(parseISO(dateRange.startDate), 'yyyy-MM-dd')} ~{' '}
                {format(parseISO(dateRange.endDate), 'yyyy-MM-dd')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => downloadReport('csv')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                📥 Download CSV
              </button>
              <button
                onClick={() => downloadReport('html')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                📄 Download HTML Report
              </button>
              <button
                onClick={onRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SummaryCard
            title="Total Active Users"
            value={totalActiveUsers.toLocaleString()}
            color="blue"
            subtitle="Unique users in period"
          />
          <SummaryCard
            title="Total Screen Views"
            value={totalScreenViews.toLocaleString()}
            color="green"
            subtitle="All screens"
          />
          <SummaryCard
            title="Total Events"
            value={totalEvents.toLocaleString()}
            color="purple"
            subtitle="All events"
          />
          <SummaryCard
            title="Avg Engagement Time"
            value={`${engagementAnalysis.avgEngagementTime.toFixed(1)}s`}
            color="orange"
            subtitle="Per active user"
          />
        </div>

        {/* Daily Active Users Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Daily Active Users Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="activeUsers"
                stroke="#3b82f6"
                strokeWidth={2}
                name="1 Day Active"
              />
              <Line
                type="monotone"
                dataKey="activeUsers7Days"
                stroke="#10b981"
                strokeWidth={2}
                name="7 Days Active"
              />
              <Line
                type="monotone"
                dataKey="activeUsers30Days"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="30 Days Active"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Top Features Usage</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topFeaturesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="usage" fill="#3b82f6" name="Usage Count" />
                <Bar dataKey="users" fill="#10b981" name="Unique Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Top Screens by Views</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topScreensData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="views" fill="#8b5cf6" name="Views" />
                <Bar dataKey="users" fill="#f59e0b" name="Active Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* All Events Table */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">All Events ({topEvents.length} total)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count Per User
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topEvents.map((event, index) => (
                  <tr key={event.eventName} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {event.eventName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.eventCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.totalUsers.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.eventCountPerUser.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Screens Table */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Top Screens</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Screen Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views/User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Engagement (s)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topScreens.map((screen, index) => (
                  <tr key={screen.screenClass} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {screen.screenClass}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {screen.views.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {screen.activeUsers.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {screen.viewsPerActiveUser.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {screen.avgEngagementTime.toFixed(1)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Screen View Analysis */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">
            📱 Screen View Analysis (screen_view events breakdown)
          </h2>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Screen Views</p>
                <p className="text-2xl font-bold text-blue-600">
                  {screenViewAnalysis.totalScreenViews.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Unique Screens</p>
                <p className="text-2xl font-bold text-blue-600">
                  {screenViewAnalysis.screenViewBreakdown.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Views per Screen</p>
                <p className="text-2xl font-bold text-blue-600">
                  {screenViewAnalysis.screenViewBreakdown.length > 0
                    ? Math.round(
                        screenViewAnalysis.totalScreenViews / screenViewAnalysis.screenViewBreakdown.length
                      ).toLocaleString()
                    : '0'}
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Screen Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views/User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Engagement (s)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {screenViewAnalysis.screenViewBreakdown.slice(0, 20).map((screen, index) => (
                  <tr key={screen.screenClass} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {screen.screenClass}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {screen.views.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {screen.activeUsers.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {screen.viewsPerUser.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {screen.avgEngagementTime.toFixed(1)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Engagement Analysis */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">
            💫 User Engagement Analysis (user_engagement events breakdown)
          </h2>
          <div className="mb-4 p-4 bg-green-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Engagements</p>
                <p className="text-2xl font-bold text-green-600">
                  {userEngagementAnalysis.totalEngagements.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Engaged Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {userEngagementAnalysis.totalUsers.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Engagements/User</p>
                <p className="text-2xl font-bold text-green-600">
                  {userEngagementAnalysis.avgEngagementsPerUser.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Screen Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engagements
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Engagement (s)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userEngagementAnalysis.engagementByScreen.slice(0, 20).map((screen, index) => (
                  <tr key={screen.screenClass} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {screen.screenClass}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {screen.engagements.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {screen.activeUsers.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {screen.avgEngagementTime.toFixed(1)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comprehensive Feature Usage Analysis */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">
            🎯 Comprehensive Feature Usage Analysis (All Data Combined)
          </h2>
          <div className="mb-4 p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              This analysis combines screen views, events, and engagement data to provide a complete picture of feature usage.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">Total Features</p>
                <p className="text-xl font-bold text-purple-600">{featureUsageDetails.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Screens</p>
                <p className="text-xl font-bold text-blue-600">
                  {featureUsageDetails.filter(f => f.featureType === 'screen').length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Menus</p>
                <p className="text-xl font-bold text-green-600">
                  {featureUsageDetails.filter(f => f.featureType === 'menu').length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Actions</p>
                <p className="text-xl font-bold text-orange-600">
                  {featureUsageDetails.filter(f => f.featureType === 'action').length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Events</p>
                <p className="text-xl font-bold text-indigo-600">
                  {featureUsageDetails.filter(f => f.featureType === 'event').length}
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feature Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unique Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Usage/User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engagement Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Related Screens
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {featureUsageDetails.slice(0, 50).map((feature, index) => (
                  <tr key={feature.featureName} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {feature.featureName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded text-xs ${
                        feature.featureType === 'screen' ? 'bg-blue-100 text-blue-800' :
                        feature.featureType === 'menu' ? 'bg-green-100 text-green-800' :
                        feature.featureType === 'action' ? 'bg-orange-100 text-orange-800' :
                        feature.featureType === 'system' ? 'bg-gray-100 text-gray-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {feature.featureType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {feature.usageCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {feature.uniqueUsers.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {feature.avgUsagePerUser.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {feature.engagementTime ? `${feature.engagementTime.toFixed(1)}s` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {feature.relatedScreens && feature.relatedScreens.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {feature.relatedScreens.slice(0, 2).map((screen, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {screen.length > 25 ? screen.substring(0, 25) + '...' : screen}
                            </span>
                          ))}
                          {feature.relatedScreens.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              +{feature.relatedScreens.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Usage Analysis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Feature Usage Summary</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feature Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unique Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Usage/User
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topFeatures.map((feature, index) => (
                  <tr key={feature.featureName} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {feature.featureName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded text-xs ${
                        feature.category === 'screen' ? 'bg-blue-100 text-blue-800' :
                        feature.category === 'event' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {feature.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {feature.usageCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {feature.uniqueUsers.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {feature.avgUsagePerUser.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  function downloadReport(format: 'csv' | 'html') {
    const url = `/api/analytics/report?format=${format}&folder=${encodeURIComponent(selectedFolder)}`;
    window.open(url, '_blank');
  }
}

interface SummaryCardProps {
  title: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  subtitle?: string;
}

function SummaryCard({ title, value, color, subtitle }: SummaryCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center">
        <div className={`${colorClasses[color]} w-12 h-12 rounded-lg flex items-center justify-center mr-4`}>
          <span className="text-white text-2xl">📊</span>
        </div>
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

