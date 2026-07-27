import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/ui/chart';
import type { ChartConfig } from '../components/ui/chart';
import { PlaceholderBadge } from '../components/shared/PlaceholderBadge';
import { Separator } from '../components/ui/separator';
import { useAnalyses } from '../hooks/useAnalyses';
import { recordingFrequencyByWeekday, recordingsByLocation } from '../lib/analytics';
import { computeDateRangeCutoff } from '../lib/dateRange';
import type { DateRangeFilter } from '../lib/dateRange';
import { MOCK_BIODIVERSITY_HEATMAP, MOCK_SEASONAL_COMPARISON, MOCK_SPECIES_TRENDS, PLACEHOLDER_STATS } from '../lib/mockData';

const frequencyConfig = { recordings: { label: 'Recordings', color: 'var(--chart-1)' } } satisfies ChartConfig;
const locationConfig = { recordings: { label: 'Recordings', color: 'var(--chart-3)' } } satisfies ChartConfig;
const trendConfig = { species: { label: 'Species', color: 'var(--chart-2)' } } satisfies ChartConfig;
const seasonalConfig = {
  thisYear: { label: 'This year', color: 'var(--chart-1)' },
  lastYear: { label: 'Last year', color: 'var(--chart-4)' },
} satisfies ChartConfig;

export function StatisticsPage() {
  const { data: analyses } = useAnalyses();
  const [dateRange, setDateRangeState] = useState<DateRangeFilter>('all');
  // Computed only from the onValueChange handler below (an event, not
  // render) -- `Date.now()` may not be called during render.
  const [cutoff, setCutoff] = useState<number | null>(null);

  const handleDateRangeChange = (value: DateRangeFilter) => {
    setDateRangeState(value);
    setCutoff(computeDateRangeCutoff(value));
  };

  const filtered = useMemo(() => {
    const list = analyses ?? [];
    if (cutoff === null) return list;
    return list.filter((a) => new Date(a.createdAt).getTime() >= cutoff);
  }, [analyses, cutoff]);

  const frequency = useMemo(() => recordingFrequencyByWeekday(filtered), [filtered]);
  const byLocation = useMemo(() => recordingsByLocation(filtered), [filtered]);
  const maxHeat = Math.max(...MOCK_BIODIVERSITY_HEATMAP.map((c) => c.intensity), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistics"
        description="Analytics derived from your recordings and detections."
        actions={
          <Select value={dateRange} onValueChange={(value) => handleDateRangeChange(value as DateRangeFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recording frequency</CardTitle>
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
            <CardTitle>Recordings by location</CardTitle>
          </CardHeader>
          <CardContent>
            {byLocation.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No located recordings in this range.</p>
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
          Longer-range &amp; seasonal analytics <PlaceholderBadge label="Sample data" />
        </span>
        <Separator className="flex-1" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Species trends over time</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendConfig} className="h-56 w-full">
              <LineChart data={MOCK_SPECIES_TRENDS} margin={{ left: -20 }}>
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
            <CardTitle>Seasonal comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={seasonalConfig} className="h-56 w-full">
              <BarChart data={MOCK_SEASONAL_COMPARISON} margin={{ left: -20 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="season" tickLine={false} axisLine={false} fontSize={12} />
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
            <CardTitle>Biodiversity heatmap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {MOCK_BIODIVERSITY_HEATMAP.map((cell) => (
              <div key={cell.location} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{cell.location}</span>
                  <span className="text-muted-foreground">{Math.round((cell.intensity / maxHeat) * 100)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-success" style={{ width: `${(cell.intensity / maxHeat) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Upload statistics</CardTitle>
          </CardHeader>
          <CardContent className="flex h-full flex-col justify-center gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Upload success rate</span>
              <span className="text-lg font-semibold text-foreground">{PLACEHOLDER_STATS.uploadSuccessRatePercent ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Failed uploads (30d)</span>
              <span className="text-lg font-semibold text-foreground">—</span>
            </div>
            <p className="text-xs text-muted-foreground">Failed uploads aren&apos;t recorded server-side yet, only successful analyses are persisted.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default StatisticsPage;
