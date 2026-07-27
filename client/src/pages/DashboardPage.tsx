import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Activity,
  AudioLines,
  Leaf,
  MapPin as MapPinIcon,
  Sprout,
  TrendingUp,
  UploadCloud,
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { StatCard } from '../components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/ui/chart';
import type { ChartConfig } from '../components/ui/chart';
import { MapView } from '../components/map/MapView';
import type { LocatedAnalysis } from '../components/map/MapView';
import { RecordingsTable } from '../components/recordings/RecordingsTable';
import { RecordingDetailPanel } from '../components/recordings/RecordingDetailPanel';
import { EmptyState } from '../components/shared/EmptyState';
import { NewRecordingButton } from '../components/recordings/NewRecordingButton';
import { PlaceholderBadge } from '../components/shared/PlaceholderBadge';
import { useAnalyses } from '../hooks/useAnalyses';
import { useContextPanel } from '../context/ContextPanelContext';
import { useProjectContext } from '../context/ProjectContext';
import {
  activeLocationCount,
  recentRecordings,
  shannonBiodiversityIndex,
  speciesDetectedCount,
  speciesDistribution,
  totalRecordings,
  weeklyActivity,
} from '../lib/analytics';
import { PLACEHOLDER_STATS } from '../lib/mockData';

const activityConfig = {
  recordings: { label: 'Recordings', color: 'var(--chart-1)' },
  detections: { label: 'Detections', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const speciesConfig = {
  count: { label: 'Detections', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export function DashboardPage() {
  const { data: analyses, isLoading } = useAnalyses();
  const { selectedProject } = useProjectContext();
  const { open } = useContextPanel();

  const list = useMemo(() => analyses ?? [], [analyses]);
  const located = useMemo<LocatedAnalysis[]>(
    () => list.filter((a): a is LocatedAnalysis => a.lat !== null && a.lon !== null),
    [list]
  );
  const activity = useMemo(() => weeklyActivity(list), [list]);
  const distribution = useMemo(() => speciesDistribution(list).slice(0, 8), [list]);
  const recent = useMemo(() => recentRecordings(list, 5), [list]);
  const biodiversity = shannonBiodiversityIndex(list);
  const recentActivityCount = activity.reduce((sum, day) => sum + day.recordings, 0);

  const isSampleProject = selectedProject.isSample;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Overview for ${selectedProject.name}`}
        actions={<NewRecordingButton />}
      />

      {isSampleProject && (
        <Card className="border-dashed border-warning/40 bg-warning/5">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-warning">
            <PlaceholderBadge label="Sample project" />
            <span>
              This project has no recordings linked to it yet -- every metric below reflects{' '}
              <strong className="font-semibold">all</strong> recordings, since projects aren&apos;t enforced server-side.
            </span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={AudioLines} label="Total recordings" value={totalRecordings(list)} loading={isLoading} />
        <StatCard icon={MapPinIcon} label="Active locations" value={activeLocationCount(list)} loading={isLoading} accent="sky" />
        <StatCard icon={Sprout} label="Species detected" value={speciesDetectedCount(list)} loading={isLoading} accent="success" />
        <StatCard
          icon={Leaf}
          label="Biodiversity index"
          value={biodiversity ?? '—'}
          hint="Shannon index (H′) over detected species"
          loading={isLoading}
          accent="success"
        />
        <StatCard icon={Activity} label="Recording hours" value={PLACEHOLDER_STATS.recordingHoursLabel} isPlaceholder accent="warning" />
        <StatCard
          icon={UploadCloud}
          label="Upload success rate"
          value={PLACEHOLDER_STATS.uploadSuccessRatePercent ?? '—'}
          isPlaceholder
          accent="warning"
        />
        <StatCard icon={TrendingUp} label="Recent activity" value={recentActivityCount} hint="Recordings in the last 7 days" loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader>
            <CardTitle>Recording locations</CardTitle>
          </CardHeader>
          <CardContent className="h-72 p-0">
            {located.length === 0 ? (
              <EmptyState icon={MapPinIcon} title="Select a map location to begin." description="No located recordings yet." className="h-full" />
            ) : (
              <MapView analyses={located} compact />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly recording activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={activityConfig} className="h-56 w-full">
              <BarChart data={activity} margin={{ left: -20 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} width={28} fontSize={12} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="recordings" fill="var(--color-recordings)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Species distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {distribution.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No species detected yet.</p>
            ) : (
              <ChartContainer config={speciesConfig} className="h-64 w-full">
                <BarChart data={distribution} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="commonName"
                    tickLine={false}
                    axisLine={false}
                    width={110}
                    fontSize={12}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent recordings</CardTitle>
            <Link to="/recordings" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <EmptyState icon={AudioLines} title="No recordings available." description="Upload your first audio recording." className="py-10" />
            ) : (
              <RecordingsTable
                analyses={recent}
                onSelect={(analysis) =>
                  open({
                    title: analysis.filename,
                    description: new Date(analysis.createdAt).toLocaleString(),
                    content: <RecordingDetailPanel analysis={analysis} />,
                  })
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
