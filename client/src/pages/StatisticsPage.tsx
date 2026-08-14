import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/ui/chart';
import type { ChartConfig } from '../components/ui/chart';
import { PlaceholderBadge } from '../components/shared/PlaceholderBadge';
import { Separator } from '../components/ui/separator';
import { useAnalyses } from '../hooks/useAnalyses';
import { useProjectContext } from '../context/ProjectContext';
import { recordingFrequencyByWeekday, recordingsByLocation, uploadSuccessRate } from '../lib/analytics';
import { computeDateRangeCutoff } from '../lib/dateRange';
import type { DateRangeFilter } from '../lib/dateRange';
import { MOCK_BIODIVERSITY_HEATMAP, MOCK_SEASONAL_COMPARISON, MOCK_SPECIES_TRENDS } from '../lib/mockData';

export function StatisticsPage() {
  const { t, i18n } = useTranslation();
  const { selectedProject } = useProjectContext();
  const { data: analyses } = useAnalyses(selectedProject?.id);
  const [dateRange, setDateRangeState] = useState<DateRangeFilter>('all');
  // Computed only from the onValueChange handler below (an event, not
  // render) -- `Date.now()` may not be called during render.
  const [cutoff, setCutoff] = useState<number | null>(null);

  // Chart config/data carry series labels and category names that must
  // re-translate on language change -- none of this can be a module-level
  // const like it was before i18n.
  const frequencyConfig = useMemo(
    () => ({ recordings: { label: t('common.recordings'), color: 'var(--chart-1)' } }) satisfies ChartConfig,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- i18n.language must stay a dep: t()'s output changes on language change even though `t` itself may not
    [i18n.language, t]
  );
  const locationConfig = useMemo(
    () => ({ recordings: { label: t('common.recordings'), color: 'var(--chart-3)' } }) satisfies ChartConfig,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see frequencyConfig above
    [i18n.language, t]
  );
  const trendConfig = useMemo(
    () => ({ species: { label: t('common.species'), color: 'var(--chart-2)' } }) satisfies ChartConfig,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see frequencyConfig above
    [i18n.language, t]
  );
  const seasonalConfig = useMemo(
    () =>
      ({
        thisYear: { label: t('statistics.thisYear'), color: 'var(--chart-1)' },
        lastYear: { label: t('statistics.lastYear'), color: 'var(--chart-4)' },
      }) satisfies ChartConfig,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see frequencyConfig above
    [i18n.language, t]
  );

  const speciesTrends = useMemo(
    () =>
      MOCK_SPECIES_TRENDS.map((point) => ({
        ...point,
        month: new Intl.DateTimeFormat(i18n.language, { month: 'short' }).format(new Date(2000, point.monthIndex)),
      })),
    [i18n.language]
  );
  const seasonalComparison = useMemo(
    () => MOCK_SEASONAL_COMPARISON.map((point) => ({ ...point, seasonLabel: t(`statistics.seasons.${point.season}`) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see frequencyConfig above
    [i18n.language, t]
  );
  const biodiversityHeatmap = useMemo(
    () => MOCK_BIODIVERSITY_HEATMAP.map((cell) => ({ ...cell, locationLabel: t(`statistics.heatmapLocations.${cell.location}`) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see frequencyConfig above
    [i18n.language, t]
  );

  const handleDateRangeChange = (value: DateRangeFilter) => {
    setDateRangeState(value);
    setCutoff(computeDateRangeCutoff(value));
  };

  const filtered = useMemo(() => {
    const list = analyses ?? [];
    if (cutoff === null) return list;
    return list.filter((a) => new Date(a.createdAt).getTime() >= cutoff);
  }, [analyses, cutoff]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- i18n.language must stay a dep: recordingFrequencyByWeekday's weekday labels are locale-aware
  const frequency = useMemo(() => recordingFrequencyByWeekday(filtered), [filtered, i18n.language]);
  const byLocation = useMemo(() => recordingsByLocation(filtered), [filtered]);
  const maxHeat = Math.max(...MOCK_BIODIVERSITY_HEATMAP.map((c) => c.intensity), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('statistics.title')}
        description={t('statistics.description')}
        actions={
          <Select value={dateRange} onValueChange={(value) => handleDateRangeChange(value as DateRangeFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.dateRangeAll')}</SelectItem>
              <SelectItem value="7d">{t('common.dateRange7d')}</SelectItem>
              <SelectItem value="30d">{t('common.dateRange30d')}</SelectItem>
              <SelectItem value="90d">{t('common.dateRange90d')}</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('statistics.recordingFrequencyTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={frequencyConfig} className="h-64 w-full">
              <BarChart data={frequency} margin={{ left: -20 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} width={28} fontSize={12} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="recordings" fill="var(--color-recordings)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('statistics.recordingsByLocationTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {byLocation.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('statistics.noLocatedRecordingsInRange')}</p>
            ) : (
              <ChartContainer config={locationConfig} className="h-64 w-full">
                <BarChart data={byLocation} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                  <YAxis type="category" dataKey="location" tickLine={false} axisLine={false} width={100} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="recordings" fill="var(--color-recordings)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('statistics.longerRangeSeasonalAnalytics')} <PlaceholderBadge />
        </span>
        <Separator className="flex-1" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>{t('statistics.speciesTrendsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendConfig} className="h-56 w-full">
              <LineChart data={speciesTrends} margin={{ left: -20 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} width={28} fontSize={12} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="species" stroke="var(--color-species)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>{t('statistics.seasonalComparisonTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={seasonalConfig} className="h-56 w-full">
              <BarChart data={seasonalComparison} margin={{ left: -20 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="seasonLabel" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} width={28} fontSize={12} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="thisYear" fill="var(--color-thisYear)" radius={4} />
                <Bar dataKey="lastYear" fill="var(--color-lastYear)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>{t('statistics.biodiversityHeatmapTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {biodiversityHeatmap.map((cell) => (
              <div key={cell.location} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{cell.locationLabel}</span>
                  <span className="text-muted-foreground">{Math.round((cell.intensity / maxHeat) * 100)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-success" style={{ width: `${(cell.intensity / maxHeat) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('statistics.uploadStatisticsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="flex h-full flex-col justify-center gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('common.uploadSuccessRate')}</span>
              <span className="text-lg font-semibold text-foreground">
                {uploadSuccessRate(filtered) !== null ? `${uploadSuccessRate(filtered)}%` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('statistics.failedUploadsInRange')}</span>
              <span className="text-lg font-semibold text-foreground">
                {filtered.filter((a) => a.status === 'failed').length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default StatisticsPage;
