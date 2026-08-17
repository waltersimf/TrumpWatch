import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { getDashboardSnapshot } from '../data/dashboard';
import { refreshHomeWidgets } from '../widgets/register';

const DASHBOARD_REFRESH_TASK = 'trumpwatch-dashboard-refresh';
const MINIMUM_REFRESH_INTERVAL_MINUTES = 15;

TaskManager.defineTask(DASHBOARD_REFRESH_TASK, async () => {
  try {
    const snapshot = await getDashboardSnapshot();
    await refreshHomeWidgets(snapshot);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerDashboardBackgroundRefresh() {
  if (Platform.OS !== 'android') return;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    DASHBOARD_REFRESH_TASK
  );

  if (isRegistered) return;

  await BackgroundTask.registerTaskAsync(DASHBOARD_REFRESH_TASK, {
    minimumInterval: MINIMUM_REFRESH_INTERVAL_MINUTES,
  });
}
