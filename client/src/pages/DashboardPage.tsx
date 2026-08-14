import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Activity,
  AudioLines,
  FolderKanban,
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
import { RecordingHeaderActions } from '../components/recordings/RecordingHeaderActions';
import { EmptyState } from '../components/shared/EmptyState';
import { NewRecordingButton } from '../components/recordings/NewRecordingButton';
import { useAnalyses } from '../hooks/useAnalyses';
import { useContextPanel } from '../context/ContextPanelContext';
import { useProjectContext } from '../context/ProjectContext';
import { formatDateTime } from '../lib/format';
import {
  activeLocationCount,
  recentRecordings,
  recordingHours,
  seasonalActivity,
  shannonBiodiversityIndex,
  speciesDetectedCount,
  speciesDistribution,
  totalRecordings,
  uploadSuccessRate,
  weeklyActivity,
} from '../lib/analytics';

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { selectedProject } = useProjectContext();
  const { data: analyses, isLoading } = useAnalyses(selectedProject?.id);
  const { open, close, panel } = useContextPanel();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // The panel can close without the dashboard knowing why (its own "X" button, or
  // AppShell closing it on navigation) -- derive the highlighted row from whether
  // the panel is actually open, rather than tracking it separately. Mirrors
  // RecordingsPage's/MapPage's row/pin highlighting.
  const highlightedId = panel ? selectedId : null;

  // Chart config carries series labels that must re-translate on language
  // change -- can't be a module-level const like the values it decorates.
  const activityConfig = useMemo(
    () =>
      ({
        recordings: { label: t('common.recordings'), color: 'var(--chart-1)' },
        detections: { label: t('common.detections'), color: 'var(--chart-3)' },
      }) satisfies ChartConfig,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- i18n.language must stay a dep: t()'s output changes on language change even though `t` itself may not
    [i18n.language, t]
  );

  const speciesConfig = useMemo(
    () => ({ count: { label: t('common.detections'), color: 'var(--chart-2)' } }) satisfies ChartConfig,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see activityConfig above
    [i18n.language, t]
  );

  const seasonalConfig = useMemo(
    () => ({ recordings: { label: t('common.recordings'), color: 'var(--chart-4)' } }) satisfies ChartConfig,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see activityConfig above
    [i18n.language, t]
  );

  const list = useMemo(() => analyses ?? [], [analyses]);
  const located = useMemo<LocatedAnalysis[]>(
    () => list.filter((a): a is LocatedAnalysis => a.lat !== null && a.lon !== null),
    [list]
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps -- i18n.language must stay a dep: weeklyActivity's weekday labels are locale-aware
  const activity = useMemo(() => weeklyActivity(list), [list, i18n.language]);
  const distribution = useMemo(() => speciesDistribution(list).slice(0, 8), [list]);
  const recent = useMemo(() => recentRecordings(list, 5), [list]);
  const seasonal = useMemo(
    () => seasonalActivity(list).map((s) => ({ ...s, label: t(`statistics.seasons.${s.season}`) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- i18n.language must stay a dep: season labels are locale-aware
    [list, i18n.language, t]
  );
  const biodiversity = shannonBiodiversityIndex(list);
  const recentActivityCount = activity.reduce((sum, day) => sum + day.recordings, 0);
  const hours = recordingHours(list);
  const successRate = uploadSuccessRate(list);

  return (
    <div className="space-y-6">
      <PageHeader title={t('dashboard.title')} actions={<NewRecordingButton className="lg:hidden" />} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={FolderKanban} label={t('dashboard.statSelectedProject')} value={selectedProject?.name ?? '—'} />
        <StatCard icon={AudioLines} label={t('dashboard.statTotalRecordings')} value={totalRecordings(list)} loading={isLoading} />
        <StatCard icon={MapPinIcon} label={t('dashboard.statActiveLocations')} value={activeLocationCount(list)} loading={isLoading} accent="sky" />
        <StatCard icon={Sprout} label={t('dashboard.statSpeciesDetected')} value={speciesDetectedCount(list)} loading={isLoading} accent="success" />
        <StatCard
          icon={Leaf}
          label={t('dashboard.statBiodiversityIndex')}
          value={biodiversity ?? '—'}
          loading={isLoading}
          accent="success"
        />
        <StatCard icon={Activity} label={t('dashboard.statRecordingHours')} value={hours} loading={isLoading} accent="sky" />
        <StatCard
          icon={UploadCloud}
          label={t('common.uploadSuccessRate')}
          value={successRate !== null ? `${successRate}%` : '—'}
          loading={isLoading}
          accent="success"
        />
        <StatCard
          icon={TrendingUp}
          label={t('dashboard.statRecentActivity')}
          value={recentActivityCount}
          hint={t('dashboard.statRecentActivityHint')}
          loading={isLoading}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{t('dashboard.recentRecordingsTitle')}</CardTitle>
          <Link to="/recordings" className="text-xs font-medium text-primary hover:underline">
            {t('common.viewAll')}
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <EmptyState
              icon={AudioLines}
              title={t('common.noRecordingsAvailable')}
              description={t('dashboard.uploadFirstRecordingHint')}
              className="py-10"
            />
          ) : (
            <RecordingsTable
              analyses={recent}
              selectedId={highlightedId}
              onSelect={(analysis) => {
                setSelectedId(analysis.id);
                open({
                  title: t('recordings.label', { id: analysis.id }),
                  description: formatDateTime(analysis.createdAt),
                  content: <RecordingDetailPanel analysis={analysis} />,
                  headerAction: <RecordingHeaderActions analysis={analysis} onDeleted={close} />,
                });
              }}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>{t('dashboard.recordingLocationsTitle')}</CardTitle>
            <Link to="/map" className="text-xs font-medium text-primary hover:underline">
              {t('common.viewAll')}
            </Link>
          </CardHeader>
          <CardContent className="h-72 p-0">
            {located.length === 0 ? (
              <EmptyState
                icon={MapPinIcon}
                title={t('common.mapEmptyTitle')}
                description={t('dashboard.noLocatedRecordingsYet')}
                className="h-full"
              />
            ) : (
              <MapView analyses={located} compact showLocationsToggle />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.speciesDistributionTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {distribution.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('common.noSpeciesDetectedYet')}</p>
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
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.weeklyActivityTitle')}</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.seasonalActivityTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={seasonalConfig} className="h-64 w-full">
              <BarChart data={seasonal} margin={{ left: -20 }}>
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
    </div>
  );
}

export default DashboardPage;
