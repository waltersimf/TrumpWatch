package com.trumpwatch.app.widget

import android.os.Handler
import android.os.Looper
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.NumberFormat
import java.util.*
import java.util.concurrent.Executors

object WidgetUtils {

    private val executor = Executors.newSingleThreadExecutor()
    private val handler = Handler(Looper.getMainLooper())

    // Term dates
    private val TERM_START = Calendar.getInstance().apply {
        set(2025, Calendar.JANUARY, 20, 12, 0, 0)
        set(Calendar.MILLISECOND, 0)
    }.timeInMillis

    private val TERM_END = Calendar.getInstance().apply {
        set(2029, Calendar.JANUARY, 20, 12, 0, 0)
        set(Calendar.MILLISECOND, 0)
    }.timeInMillis

    private const val TOTAL_DAYS = 1461L
    private const val GAS_BASELINE = 3.08

    data class CountdownData(
        val days: Long,
        val hours: Long,
        val minutes: Long,
        val seconds: Long,
        val daysPassed: Int,
        val totalDays: Int,
        val percentComplete: Double
    )

    data class MarketData(
        val nationalDebt: Double?,
        val debtChange: Double?,
        val sp500Price: Double?,
        val sp500ChangePercent: Double?,
        val bitcoinPrice: Double?,
        val bitcoinChangePercent: Double?,
        val gasPrice: Double?,
        val gasChange: Double?
    )

    fun calculateCountdown(): CountdownData {
        val now = System.currentTimeMillis()
        val timeRemaining = TERM_END - now
        val timePassed = now - TERM_START

        if (timeRemaining <= 0) {
            return CountdownData(0, 0, 0, 0, TOTAL_DAYS.toInt(), TOTAL_DAYS.toInt(), 100.0)
        }

        val days = timeRemaining / (1000 * 60 * 60 * 24)
        val hours = (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        val minutes = (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
        val seconds = (timeRemaining % (1000 * 60)) / 1000

        val daysPassedRaw = (timePassed / (1000 * 60 * 60 * 24)).coerceIn(0, TOTAL_DAYS)
        val percentComplete = ((timePassed.toDouble() / (TERM_END - TERM_START)) * 100).coerceIn(0.0, 100.0)

        return CountdownData(
            days = days,
            hours = hours,
            minutes = minutes,
            seconds = seconds,
            daysPassed = (daysPassedRaw + 1).toInt(),
            totalDays = TOTAL_DAYS.toInt(),
            percentComplete = percentComplete
        )
    }

    fun fetchMarketData(callback: (MarketData) -> Unit) {
        executor.execute {
            var debt: Double? = null
            var debtBaseline: Double? = null
            var sp500: Double? = null
            var sp500Change: Double? = null
            var btc: Double? = null
            var btcChange: Double? = null
            var gasPrice: Double? = null

            // Fetch National Debt
            try {
                val debtUrl = URL("https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&limit=1")
                val debtConn = debtUrl.openConnection() as HttpURLConnection
                debtConn.connectTimeout = 5000
                debtConn.readTimeout = 5000
                val debtResponse = debtConn.inputStream.bufferedReader().readText()
                val debtJson = JSONObject(debtResponse)
                debt = debtJson.getJSONArray("data").getJSONObject(0).getString("tot_pub_debt_out_amt").toDoubleOrNull()

                // Get baseline
                val baselineUrl = URL("https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?filter=record_date:gte:2025-01-20&sort=record_date&limit=1")
                val baselineConn = baselineUrl.openConnection() as HttpURLConnection
                baselineConn.connectTimeout = 5000
                baselineConn.readTimeout = 5000
                val baselineResponse = baselineConn.inputStream.bufferedReader().readText()
                val baselineJson = JSONObject(baselineResponse)
                debtBaseline = baselineJson.getJSONArray("data").getJSONObject(0).getString("tot_pub_debt_out_amt").toDoubleOrNull()
            } catch (e: Exception) {
                e.printStackTrace()
            }

            // Fetch S&P 500 via FRED API
            try {
                val sp500Url = URL("https://api.stlouisfed.org/fred/series/observations?series_id=SP500&api_key=82376aa22a515252bb9e18ddd772b3e0&file_type=json&limit=2&sort_order=desc")
                val sp500Conn = sp500Url.openConnection() as HttpURLConnection
                sp500Conn.connectTimeout = 5000
                sp500Conn.readTimeout = 5000
                val sp500Response = sp500Conn.inputStream.bufferedReader().readText()
                val sp500Json = JSONObject(sp500Response)
                val observations = sp500Json.getJSONArray("observations")
                if (observations.length() >= 1) {
                    sp500 = observations.getJSONObject(0).getString("value").toDoubleOrNull()
                    if (observations.length() >= 2 && sp500 != null) {
                        val prevValue = observations.getJSONObject(1).getString("value").toDoubleOrNull()
                        if (prevValue != null && prevValue > 0) {
                            sp500Change = ((sp500!! - prevValue) / prevValue) * 100
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            // Fetch Gas Price via EIA API
            try {
                val gasUrl = URL("https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=DEMO_KEY&frequency=weekly&data[0]=value&facets[product][]=EPM0&facets[duoarea][]=NUS&sort[0][column]=period&sort[0][direction]=desc&length=1")
                val gasConn = gasUrl.openConnection() as HttpURLConnection
                gasConn.connectTimeout = 5000
                gasConn.readTimeout = 5000
                val gasResponse = gasConn.inputStream.bufferedReader().readText()
                val gasJson = JSONObject(gasResponse)
                val gasData = gasJson.getJSONObject("response").getJSONArray("data")
                if (gasData.length() > 0) {
                    gasPrice = gasData.getJSONObject(0).getString("value").toDoubleOrNull()
                }
            } catch (e: Exception) {
                e.printStackTrace()
                // Fallback
                gasPrice = 2.95
            }

            // Fetch Bitcoin
            try {
                val btcUrl = URL("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true")
                val btcConn = btcUrl.openConnection() as HttpURLConnection
                btcConn.connectTimeout = 5000
                btcConn.readTimeout = 5000
                val btcResponse = btcConn.inputStream.bufferedReader().readText()
                val btcJson = JSONObject(btcResponse).getJSONObject("bitcoin")
                btc = btcJson.getDouble("usd")
                btcChange = btcJson.getDouble("usd_24h_change")
            } catch (e: Exception) {
                e.printStackTrace()
            }

            val debtChange = if (debt != null && debtBaseline != null) debt - debtBaseline else null
            val gasChange = if (gasPrice != null) gasPrice - GAS_BASELINE else null

            handler.post {
                callback(MarketData(debt, debtChange, sp500, sp500Change, btc, btcChange, gasPrice, gasChange))
            }
        }
    }

    fun formatDebt(debt: Double?): String {
        if (debt == null) return "---"
        val trillions = debt / 1_000_000_000_000.0
        return "$${String.format("%.1f", trillions)}T"
    }

    fun formatDebtChange(change: Double?): String {
        if (change == null) return ""
        val trillions = change / 1_000_000_000_000.0
        val prefix = if (trillions >= 0) "+" else ""
        return "$prefix$${String.format("%.1f", trillions)}T since Jan 20"
    }

    fun formatDebtChangeShort(change: Double?): String {
        if (change == null) return ""
        val trillions = change / 1_000_000_000_000.0
        val prefix = if (trillions >= 0) "+" else ""
        return "$prefix$${String.format("%.1f", trillions)}T"
    }

    fun formatSP500(price: Double?): String {
        if (price == null) return "---"
        val formatter = NumberFormat.getNumberInstance(Locale.US)
        formatter.maximumFractionDigits = 0
        return formatter.format(price.toLong())
    }

    fun formatPrice(price: Double?): String {
        if (price == null) return "---"
        return "$${String.format("%.2f", price)}"
    }

    fun formatGasPrice(price: Double?): String {
        if (price == null) return "---"
        return "$${String.format("%.2f", price)}"
    }

    fun formatGasChange(change: Double?): String {
        if (change == null) return ""
        val prefix = if (change >= 0) "+" else ""
        return "$prefix$${String.format("%.2f", change)}"
    }

    fun formatBtcPrice(price: Double?): String {
        if (price == null) return "---"
        val formatter = NumberFormat.getNumberInstance(Locale.US)
        return "$${formatter.format(price.toLong())}"
    }

    fun formatBtcPriceShort(price: Double?): String {
        if (price == null) return "---"
        val thousands = price / 1000.0
        return "$${String.format("%.0f", thousands)}K"
    }

    fun formatPercent(percent: Double?, suffix: String = "today"): String {
        if (percent == null) return ""
        val prefix = if (percent >= 0) "+" else ""
        return "$prefix${String.format("%.2f", percent)}% $suffix"
    }

    fun formatPercentShort(percent: Double?): String {
        if (percent == null) return ""
        val prefix = if (percent >= 0) "+" else ""
        return "$prefix${String.format("%.1f", percent)}%"
    }

    fun formatBtcPercent(percent: Double?): String {
        if (percent == null) return ""
        val prefix = if (percent >= 0) "+" else ""
        return "$prefix${String.format("%.1f", percent)}% 24h"
    }

    fun isPositive(value: Double?): Boolean = (value ?: 0.0) >= 0
}
