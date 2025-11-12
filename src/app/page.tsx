'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CSVDashboard from '@/components/CSVDashboard';
import { DashboardSummary } from '@/services/csv-analytics-service';

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('default');

  useEffect(() => {
    // Get folder from URL parameter
    const folder = searchParams.get('folder') || 'default';
    setSelectedFolder(folder);
    
    // Fetch available folders
    fetchFolders();
    
    // Fetch dashboard data
    fetchDashboardData(folder);
  }, [searchParams]);

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/analytics/folders');
      if (response.ok) {
        const result = await response.json();
        setFolders(result.folders || []);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
    }
  };

  const fetchDashboardData = async (folder: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?folder=${encodeURIComponent(folder)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderChange = (folder: string) => {
    setSelectedFolder(folder);
    // Update URL and reload page
    router.push(`/?folder=${encodeURIComponent(folder)}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading analytics data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">No data available</div>
      </div>
    );
  }

  return (
    <CSVDashboard 
      data={data} 
      onRefresh={() => fetchDashboardData(selectedFolder)}
      folders={folders}
      selectedFolder={selectedFolder}
      onFolderChange={handleFolderChange}
    />
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading analytics data...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

