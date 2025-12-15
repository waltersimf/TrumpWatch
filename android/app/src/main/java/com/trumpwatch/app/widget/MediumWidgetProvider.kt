package com.trumpwatch.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.widget.RemoteViews
import com.trumpwatch.app.MainActivity
import com.trumpwatch.app.R

class MediumWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_UPDATE) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = ComponentName(context, MediumWidgetProvider::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
            onUpdate(context, appWidgetManager, appWidgetIds)
        }
    }

    companion object {
        const val ACTION_UPDATE = "com.trumpwatch.app.UPDATE_MEDIUM_WIDGET"
        private const val COLOR_RED = "#EF4444"
        private const val COLOR_GREEN = "#22C55E"
        private const val COLOR_AMBER = "#F59E0B"

        fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_medium)

            val countdown = WidgetUtils.calculateCountdown()

            val dayText = "Day ${countdown.daysPassed} of ${countdown.totalDays}"
            views.setTextViewText(R.id.widget_day_text, dayText)

            views.setTextViewText(R.id.countdown_days, countdown.days.toString())
            views.setTextViewText(R.id.countdown_hours, countdown.hours.toString().padStart(2, '0'))
            views.setTextViewText(R.id.countdown_mins, countdown.minutes.toString().padStart(2, '0'))

            views.setProgressBar(R.id.progress_bar, 1000, (countdown.percentComplete * 10).toInt(), false)
            val progressText = String.format("%.2f%% of term completed", countdown.percentComplete)
            views.setTextViewText(R.id.progress_text, progressText)

            WidgetUtils.fetchMarketData { data ->
                // Debt - always red
                views.setTextViewText(R.id.stat_debt, WidgetUtils.formatDebt(data.nationalDebt))
                views.setTextViewText(R.id.stat_debt_change, WidgetUtils.formatDebtChangeShort(data.debtChange))
                views.setTextColor(R.id.stat_debt, Color.parseColor(COLOR_RED))

                // S&P 500 - green if positive, red if negative
                views.setTextViewText(R.id.stat_sp500, WidgetUtils.formatSP500(data.sp500Price))
                views.setTextViewText(R.id.stat_sp500_change, WidgetUtils.formatPercentShort(data.sp500ChangePercent))
                val sp500Color = if (WidgetUtils.isNegative(data.sp500ChangePercent)) COLOR_RED else COLOR_GREEN
                views.setTextColor(R.id.stat_sp500, Color.parseColor(sp500Color))

                // Gas - green if below baseline, red if above
                views.setTextViewText(R.id.stat_gas, WidgetUtils.formatGasPrice(data.gasPrice))
                views.setTextViewText(R.id.stat_gas_change, WidgetUtils.formatGasChange(data.gasChange))
                val gasColor = if ((data.gasChange ?: 0.0) <= 0) COLOR_GREEN else COLOR_RED
                views.setTextColor(R.id.stat_gas, Color.parseColor(gasColor))

                // Bitcoin - amber always, it's volatile
                views.setTextViewText(R.id.stat_bitcoin, WidgetUtils.formatBtcPriceShort(data.bitcoinPrice))
                views.setTextViewText(R.id.stat_bitcoin_change, WidgetUtils.formatPercentShort(data.bitcoinChangePercent))
                views.setTextColor(R.id.stat_bitcoin, Color.parseColor(COLOR_AMBER))

                appWidgetManager.updateAppWidget(appWidgetId, views)
            }

            val intent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_medium_container, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}