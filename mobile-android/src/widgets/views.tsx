import React from 'react';
import {
  FlexWidget,
  TextWidget,
  type FlexWidgetStyle,
  type WidgetInfo,
} from 'react-native-android-widget';
import type { DashboardSnapshot, MetricCard } from '../data/dashboard';

const colors = {
  surface: '#101D33',
  white: '#F8FAFC',
  muted: '#B8C5D9',
  mutedDark: '#7B8BA5',
  red: '#F87171',
  redDeep: '#B91C1C',
  blue: '#60A5FA',
  blueDeep: '#2563EB',
  border: '#2B3D5B',
} as const;

type WidgetProps = {
  snapshot: DashboardSnapshot;
  widgetInfo?: WidgetInfo;
};

function rootStyle(): FlexWidgetStyle {
  return {
    width: 'match_parent',
    height: 'match_parent',
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    flexDirection: 'column',
    justifyContent: 'space-between',
  };
}

function readableUnit(unit: string | null) {
  if (!unit) return '';
  if (unit.toLowerCase() === 'percent') return '%';
  return unit;
}

function MetricLine({ metric, large }: { metric: MetricCard; large: boolean }) {
  return (
    <FlexWidget
      style={{
        flex: 1,
        width: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <TextWidget
        text={metric.label}
        maxLines={1}
        style={{ color: colors.muted, fontSize: large ? 15 : 13, fontWeight: 'bold' }}
      />
      <TextWidget
        text={metric.value ? `${metric.value}${readableUnit(metric.unit) ? ` ${readableUnit(metric.unit)}` : ''}` : '—'}
        style={{ color: colors.blue, fontSize: large ? 23 : 18, fontWeight: 'bold', textAlign: 'right' }}
      />
    </FlexWidget>
  );
}

export function CountdownWidgetView({ snapshot, widgetInfo }: WidgetProps) {
  const isLarge = (widgetInfo?.width ?? 0) >= 280 || (widgetInfo?.height ?? 0) >= 160;
  const { daysRemaining, hoursRemaining, minutesRemaining } = snapshot.countdown;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel="Відкрити TrumpWatch і переглянути відлік"
      style={rootStyle()}
    >
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', width: 'match_parent' }}>
        <TextWidget text="TRUMPWATCH" style={{ color: colors.red, fontSize: 13, fontWeight: 'bold', letterSpacing: 1.2 }} />
        <TextWidget text="ВІДЛІК" style={{ color: colors.mutedDark, fontSize: 11, fontWeight: 'bold', letterSpacing: 0.8 }} />
      </FlexWidget>

      <FlexWidget
        style={{ flex: 1, width: 'match_parent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <FlexWidget style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <TextWidget text={String(daysRemaining ?? '—')} style={{ color: colors.white, fontSize: isLarge ? 52 : 40, fontWeight: 'bold', textAlign: 'center' }} />
          <TextWidget text="ДНІВ" style={{ color: colors.red, fontSize: 11, fontWeight: 'bold', letterSpacing: 0.8, textAlign: 'center', paddingTop: 3 }} />
        </FlexWidget>
        <FlexWidget style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <TextWidget text={String(hoursRemaining ?? '—').padStart(2, '0')} style={{ color: colors.white, fontSize: isLarge ? 34 : 28, fontWeight: 'bold', textAlign: 'center' }} />
          <TextWidget text="ГОД" style={{ color: colors.muted, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.7, textAlign: 'center', paddingTop: 4 }} />
        </FlexWidget>
        <FlexWidget style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <TextWidget text={String(minutesRemaining ?? '—').padStart(2, '0')} style={{ color: colors.blue, fontSize: isLarge ? 34 : 28, fontWeight: 'bold', textAlign: 'center' }} />
          <TextWidget text="ХВ" style={{ color: colors.muted, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.7, textAlign: 'center', paddingTop: 4 }} />
        </FlexWidget>
      </FlexWidget>

      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row' }}>
        <FlexWidget style={{ flex: 1, height: 3, backgroundColor: colors.redDeep }} />
        <FlexWidget style={{ flex: 1, height: 3, backgroundColor: colors.white }} />
        <FlexWidget style={{ flex: 1, height: 3, backgroundColor: colors.blueDeep }} />
      </FlexWidget>
      <TextWidget text="ДО 20.01.2029" style={{ color: colors.mutedDark, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.7, paddingTop: 8 }} />
    </FlexWidget>
  );
}

export function EconomyWidgetView({ snapshot, widgetInfo }: WidgetProps) {
  const isLarge = (widgetInfo?.width ?? 0) >= 280 || (widgetInfo?.height ?? 0) >= 180;
  const metrics = snapshot.metrics.slice(0, 3);

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel="Відкрити TrumpWatch і переглянути економічні показники"
      style={rootStyle()}
    >
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', width: 'match_parent' }}>
        <TextWidget text="ЕКОНОМІКА" style={{ color: colors.red, fontSize: 13, fontWeight: 'bold', letterSpacing: 1.1 }} />
        <TextWidget text={snapshot.source === 'cache' ? 'КЕШ' : 'LIVE'} style={{ color: snapshot.source === 'cache' ? colors.mutedDark : colors.blue, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8 }} />
      </FlexWidget>
      <FlexWidget style={{ flex: 1, width: 'match_parent', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 6 }}>
        {metrics.length ? metrics.map((metric) => <MetricLine key={metric.key} metric={metric} large={isLarge} />) : (
          <TextWidget text="Очікуємо на оновлення показників" style={{ color: colors.muted, fontSize: 13 }} />
        )}
      </FlexWidget>
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row' }}>
        <FlexWidget style={{ flex: 1, height: 3, backgroundColor: colors.redDeep }} />
        <FlexWidget style={{ flex: 1, height: 3, backgroundColor: colors.white }} />
        <FlexWidget style={{ flex: 1, height: 3, backgroundColor: colors.blueDeep }} />
      </FlexWidget>
    </FlexWidget>
  );
}
