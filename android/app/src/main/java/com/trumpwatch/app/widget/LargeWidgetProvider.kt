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

class LargeWidgetProvider : AppWidgetProvider() {

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
            val componentName = ComponentName(context, LargeWidgetProvider::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
            onUpdate(context, appWidgetManager, appWidgetIds)
        }
    }

    companion object {
        const val ACTION_UPDATE = "com.trumpwatch.app.UPDATE_LARGE_WIDGET"
        private const val COLOR_RED = "#EF4444"
        private const val COLOR_GREEN = "#22C55E"
        private const val COLOR_AMBER = "#F59E0B"
        private const val COLOR_WHITE = "#FFFFFF"

        fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_large)

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
                // Row 1: Debt - always red
                views.setTextViewText(R.id.stat_debt, WidgetUtils.formatDebt(data.nationalDebt))
                views.setTextViewText(R.id.stat_debt_change, WidgetUtils.formatDebtChangeShort(data.debtChange))
                views.setTextColor(R.id.stat_debt, Color.parseColor(COLOR_RED))

                // Row 1: S&P 500
                views.setTextViewText(R.id.stat_sp500, WidgetUtils.formatSP500(data.sp500Price))
                views.setTextViewText(R.id.stat_sp500_change, WidgetUtils.formatPercentShort(data.sp500ChangePercent))
                val sp500Color = if (WidgetUtils.isNegative(data.sp500ChangePercent)) COLOR_RED else COLOR_GREEN
                views.setTextColor(R.id.stat_sp500, Color.parseColor(sp500Color))

                // Row 1: Gas
                views.setTextViewText(R.id.stat_gas, WidgetUtils.formatGasPrice(data.gasPrice))
                views.setTextViewText(R.id.stat_gas_change, WidgetUtils.formatGasChange(data.gasChange))
                val gasColor = if ((data.gasChange ?: 0.0) <= 0) COLOR_GREEN else COLOR_RED
                views.setTextColor(R.id.stat_gas, Color.parseColor(gasColor))

                // Row 1: Bitcoin - amber
                views.setTextViewText(R.id.stat_bitcoin, WidgetUtils.formatBtcPriceShort(data.bitcoinPrice))
                views.setTextViewText(R.id.stat_bitcoin_change, WidgetUtils.formatPercentShort(data.bitcoinChangePercent))
                views.setTextColor(R.id.stat_bitcoin, Color.parseColor(COLOR_AMBER))

                // Row 2: Gold - amber
                views.setTextViewText(R.id.stat_gold, WidgetUtils.formatGoldPrice(data.goldPrice))
                views.setTextViewText(R.id.stat_gold_change, WidgetUtils.formatPercentShort(data.goldChangePercent))
                views.setTextColor(R.id.stat_gold, Color.parseColor(COLOR_AMBER))

                // Row 2: Oil
                views.setTextViewText(R.id.stat_oil, WidgetUtils.formatOilPrice(data.oilPrice))
                views.setTextViewText(R.id.stat_oil_change, WidgetUtils.formatPercentShort(data.oilChangePercent))
                val oilColor = if (WidgetUtils.isNegative(data.oilChangePercent)) COLOR_RED else COLOR_GREEN
                views.setTextColor(R.id.stat_oil, Color.parseColor(oilColor))

                // Row 2: Unemployment - white
                views.setTextViewText(R.id.stat_unemployment, WidgetUtils.formatPercent2(data.unemploymentRate))
                views.setTextViewText(R.id.stat_unemployment_change, WidgetUtils.formatPercentChangeShort(data.unemploymentChange))
                views.setTextColor(R.id.stat_unemployment, Color.parseColor(COLOR_WHITE))

                // Row 2: Inflation - red if > 3%, green if <= 3%
                views.setTextViewText(R.id.stat_inflation, WidgetUtils.formatPercent2(data.inflationRate))
                views.setTextViewText(R.id.stat_inflation_change, WidgetUtils.formatPercentChangeShort(data.inflationChange))
                val inflColor = if ((data.inflationRate ?: 0.0) > 3.0) COLOR_RED else COLOR_GREEN
                views.setTextColor(R.id.stat_inflation, Color.parseColor(inflColor))

                appWidgetManager.updateAppWidget(appWidgetId, views)
            }

            val intent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_large_container, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}