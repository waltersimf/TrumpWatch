import { Platform } from 'react-native';
import {
  registerWidgetTaskHandler,
  requestWidgetUpdate,
} from 'react-native-android-widget';
import {
  getCachedDashboardSnapshot,
  type DashboardSnapshot,
} from '../data/dashboard';
import { CountdownWidgetView, EconomyWidgetView } from './views';
import type { WidgetInfo } from 'react-native-android-widget';

async function renderWidgetByName(
  name: string,
  snapshot: DashboardSnapshot,
  widgetInfo?: WidgetInfo
) {
  if (name === 'EconomyWidget') {
    return <EconomyWidgetView snapshot={snapshot} widgetInfo={widgetInfo} />;
  }
  return <CountdownWidgetView snapshot={snapshot} widgetInfo={widgetInfo} />;
}

registerWidgetTaskHandler(async ({ widgetInfo, renderWidget }) => {
  const snapshot = await getCachedDashboardSnapshot();
  renderWidget(await renderWidgetByName(widgetInfo.widgetName, snapshot, widgetInfo));
});

export async function refreshHomeWidgets(snapshot: DashboardSnapshot) {
  if (Platform.OS !== 'android') return;

  await Promise.all([
    requestWidgetUpdate({
      widgetName: 'CountdownWidget',
      renderWidget: async (widgetInfo) => (
        <CountdownWidgetView snapshot={snapshot} widgetInfo={widgetInfo} />
      ),
    }),
    requestWidgetUpdate({
      widgetName: 'EconomyWidget',
      renderWidget: async (widgetInfo) => (
        <EconomyWidgetView snapshot={snapshot} widgetInfo={widgetInfo} />
      ),
    }),
  ]);
}
