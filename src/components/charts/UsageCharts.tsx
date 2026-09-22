import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CategoryBreakdown, DailyUsage, UnderstandingArea, WeeklyReport } from '@/types';
import { CHART_COLORS, TONE_COLOR } from '@/data/taxonomy';
import { ChartFrame, ChartTooltip, axisProps, gridProps } from './ChartKit';

/** AI requests versus independently attempted problems, per day. */
export function UsageTrendChart({ data }: { data: DailyUsage[] }) {
  const summary = data
    .map((d) => `${d.label}: ${d.aiRequests} AI requests, ${d.independentAttempts} attempted first`)
    .join('. ');

  return (
    <ChartFrame height={260} summary={`Seven day AI usage. ${summary}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 6, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="aiFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.ai} stopOpacity={0.34} />
              <stop offset="100%" stopColor={CHART_COLORS.ai} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} width={44} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: 'rgba(255,255,255,0.12)' }}
            content={<ChartTooltip />}
          />
          <Area
            type="monotone"
            dataKey="aiRequests"
            name="AI requests"
            stroke={CHART_COLORS.ai}
            strokeWidth={2}
            fill="url(#aiFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="independentAttempts"
            name="Attempted first"
            stroke={CHART_COLORS.human}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/** Request types stacked per day: the shape of how help was asked for. */
export function RequestMixChart({ data }: { data: DailyUsage[] }) {
  const summary = data
    .map(
      (d) =>
        `${d.label}: ${d.completeSolutionRequests} complete-solution, ${d.debuggingRequests} debugging, ${d.explanationRequests} explanation`,
    )
    .join('. ');

  return (
    <ChartFrame height={240} summary={`Request mix per day. ${summary}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 6, bottom: 0, left: -18 }} barGap={2}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} width={44} allowDecimals={false} />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<ChartTooltip />} />
          <Bar
            dataKey="completeSolutionRequests"
            name="Complete solution"
            stackId="mix"
            fill={CHART_COLORS.warn}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="debuggingRequests"
            name="Debugging"
            stackId="mix"
            fill={CHART_COLORS.ai}
          />
          <Bar
            dataKey="explanationRequests"
            name="Explanation"
            stackId="mix"
            fill={CHART_COLORS.human}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/** Generated versus hand-written lines per day. */
export function AuthorshipChart({ data }: { data: DailyUsage[] }) {
  const summary = data
    .map((d) => `${d.label}: ${d.generatedLines} generated, ${d.manualLines} hand written`)
    .join('. ');

  return (
    <ChartFrame height={240} summary={`Code authorship per day. ${summary}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 6, bottom: 0, left: -10 }} barGap={4}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} width={52} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            content={<ChartTooltip suffix=" lines" />}
          />
          <Bar
            dataKey="generatedLines"
            name="AI generated"
            fill={CHART_COLORS.ai}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="manualLines"
            name="Written by hand"
            fill={CHART_COLORS.human}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/** Horizontal breakdown of prompt categories, coloured by tone. */
export function CategoryChart({ data }: { data: CategoryBreakdown[] }) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const summary = sorted.map((c) => `${c.label}: ${c.count} requests (${c.share}%)`).join('. ');

  return (
    <ChartFrame height={Math.max(180, sorted.length * 38)} summary={`Prompt categories. ${summary}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
        >
          <CartesianGrid {...gridProps} horizontal={false} vertical />
          <XAxis type="number" {...axisProps} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            {...axisProps}
            width={118}
            tick={{ fill: '#9aa2b1', fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            content={<ChartTooltip suffix=" requests" />}
          />
          <Bar dataKey="count" name="Requests" radius={[0, 4, 4, 0]} barSize={16}>
            {sorted.map((entry) => (
              <Cell key={entry.category} fill={TONE_COLOR[entry.tone]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/** This week's dependency versus last week's, day by day. */
export function DependencyTrendChart({ data }: { data: WeeklyReport['dependencyTrend'] }) {
  const summary = data
    .map((d) => `${d.day}: ${d.current}% this week versus ${d.previous}% last week`)
    .join('. ');

  return (
    <ChartFrame height={240} summary={`Dependency trend. ${summary}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 6, bottom: 0, left: -18 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="day" {...axisProps} />
          <YAxis {...axisProps} width={44} domain={[0, 100]} />
          <Tooltip
            cursor={{ stroke: 'rgba(255,255,255,0.12)' }}
            content={<ChartTooltip suffix="%" />}
          />
          <Line
            type="monotone"
            dataKey="previous"
            name="Last week"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="current"
            name="This week"
            stroke={CHART_COLORS.ai}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 0, fill: CHART_COLORS.ai }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/** Understanding across the parts of a project. */
export function UnderstandingRadar({ areas }: { areas: UnderstandingArea[] }) {
  const data = areas.map((a) => ({ area: a.label, score: a.score }));
  const summary = areas.map((a) => `${a.label}: ${a.score}%`).join('. ');

  return (
    <ChartFrame height={280} summary={`Project understanding by area. ${summary}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis dataKey="area" tick={{ fill: '#9aa2b1', fontSize: 11 }} />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={{ fill: '#6a7182', fontSize: 10 }}
            axisLine={false}
            tickCount={5}
          />
          <Radar
            name="Understanding"
            dataKey="score"
            stroke={CHART_COLORS.ai}
            strokeWidth={2}
            fill={CHART_COLORS.ai}
            fillOpacity={0.18}
          />
          <Tooltip content={<ChartTooltip suffix="%" />} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
