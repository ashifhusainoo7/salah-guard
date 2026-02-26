package com.salahguard

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

object DndAlarmScheduler {

    private const val TAG = "DndAlarmScheduler"
    private const val PREFS_NAME = "salah_guard_prefs"
    private const val KEY_PRAYERS = "prayers_json"
    private const val KEY_GLOBAL_ACTIVE = "global_active"
    private const val KEY_PENDING_SESSIONS = "pending_sessions"
    private const val MIDNIGHT_REQUEST_CODE = 9999
    private const val NOTIFICATION_CHANNEL_ID = "salah_guard_dnd"

    /**
     * Persist prayer schedule to SharedPreferences so it survives app kill / reboot.
     */
    fun savePrayers(context: Context, prayersJson: String, isGloballyActive: Boolean) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_PRAYERS, prayersJson)
            .putBoolean(KEY_GLOBAL_ACTIVE, isGloballyActive)
            .apply()
    }

    /**
     * Read stored prayers and schedule all DND alarms for today.
     * Cancels any existing alarms first, then schedules enable/disable pairs
     * for each prayer whose time hasn't passed yet.
     * Also schedules a midnight alarm to reschedule for the next day.
     */
    fun scheduleAll(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val prayersJson = prefs.getString(KEY_PRAYERS, null)
        if (prayersJson == null) {
            Log.i(TAG, "No prayers stored, nothing to schedule")
            return
        }
        val isGloballyActive = prefs.getBoolean(KEY_GLOBAL_ACTIVE, true)

        // Always cancel first to avoid duplicates
        cancelAll(context)

        if (!isGloballyActive) {
            Log.i(TAG, "Globally inactive, not scheduling")
            return
        }

        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val prayers = JSONArray(prayersJson)
        val now = System.currentTimeMillis()
        val today = getCurrentDay()
        var alarmsScheduled = 0

        for (i in 0 until prayers.length()) {
            val prayer = prayers.getJSONObject(i)
            if (!prayer.getBoolean("isEnabled")) continue

            val activeDays = prayer.getJSONArray("activeDays")
            if (!containsString(activeDays, today)) continue

            val time = prayer.getString("scheduledTime")
            val duration = prayer.getInt("durationMinutes")
            val prayerId = prayer.getInt("id")
            val prayerName = prayer.getString("name")

            val startMillis = getTimeMillisToday(time)
            val endMillis = startMillis + duration * 60 * 1000L

            // If we're currently inside a prayer window, enable DND now
            if (startMillis <= now && endMillis > now) {
                val nm = context.getSystemService(Context.NOTIFICATION_SERVICE)
                        as NotificationManager
                if (nm.isNotificationPolicyAccessGranted) {
                    nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_NONE)
                    Log.i(TAG, "Currently in prayer window for $prayerName, DND enabled")

                    // Store session start for logging when DND ends
                    prefs.edit()
                        .putString("current_dnd_prayer", prayerName)
                        .putLong("current_dnd_start", startMillis)
                        .putInt("current_dnd_duration", duration)
                        .apply()
                }
            }

            // Schedule enable alarm if start time is in the future
            if (startMillis > now) {
                scheduleExact(
                    context, am, startMillis, prayerId * 2,
                    "com.salahguard.ENABLE_DND", prayerName, duration
                )
                alarmsScheduled++
            }

            // Schedule disable alarm if end time is in the future
            if (endMillis > now) {
                scheduleExact(
                    context, am, endMillis, prayerId * 2 + 1,
                    "com.salahguard.DISABLE_DND", prayerName, duration
                )
                alarmsScheduled++
            }
        }

        // Schedule midnight reschedule for the next day
        scheduleMidnight(context, am)

        Log.i(TAG, "Scheduled $alarmsScheduled alarms for today ($today)")
    }

    /**
     * Cancel all pending DND alarms (prayer + midnight).
     */
    fun cancelAll(context: Context) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        // Cancel prayer alarms: IDs 1..10, each has enable (id*2) and disable (id*2+1)
        for (prayerId in 1..10) {
            for (suffix in 0..1) {
                val requestCode = prayerId * 2 + suffix
                val intent = Intent(context, DndAlarmReceiver::class.java)
                val pi = PendingIntent.getBroadcast(
                    context, requestCode, intent,
                    PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
                )
                if (pi != null) {
                    am.cancel(pi)
                    pi.cancel()
                }
            }
        }

        // Cancel midnight alarm
        val midnightIntent = Intent(context, DndAlarmReceiver::class.java)
        val midnightPi = PendingIntent.getBroadcast(
            context, MIDNIGHT_REQUEST_CODE, midnightIntent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (midnightPi != null) {
            am.cancel(midnightPi)
            midnightPi.cancel()
        }
    }

    /**
     * Store a completed DND session in SharedPreferences.
     * The JS side reads and clears these when the app opens.
     */
    fun addPendingSession(
        context: Context, prayerName: String,
        startTime: String, endTime: String, durationMinutes: Int
    ) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val existing = prefs.getString(KEY_PENDING_SESSIONS, "[]") ?: "[]"
        val sessions = JSONArray(existing)
        val session = JSONObject().apply {
            put("prayerName", prayerName)
            put("startTime", startTime)
            put("endTime", endTime)
            put("durationMinutes", durationMinutes)
            put("status", "Completed")
            put("id", System.currentTimeMillis())
        }
        sessions.put(session)
        prefs.edit().putString(KEY_PENDING_SESSIONS, sessions.toString()).apply()
        Log.i(TAG, "Session logged: $prayerName ($durationMinutes min)")
    }

    fun getPendingSessions(context: Context): String {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(KEY_PENDING_SESSIONS, "[]") ?: "[]"
    }

    fun clearPendingSessions(context: Context) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_PENDING_SESSIONS, "[]")
            .apply()
    }

    fun ensureNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE)
                    as NotificationManager
            if (nm.getNotificationChannel(NOTIFICATION_CHANNEL_ID) == null) {
                val channel = NotificationChannel(
                    NOTIFICATION_CHANNEL_ID,
                    "Prayer DND",
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "Notifications when DND is enabled/disabled for prayers"
                }
                nm.createNotificationChannel(channel)
            }
        }
    }

    // ---- Private helpers ----

    private fun scheduleExact(
        context: Context, am: AlarmManager, timeMs: Long,
        requestCode: Int, action: String, prayerName: String, duration: Int
    ) {
        val intent = Intent(context, DndAlarmReceiver::class.java).apply {
            this.action = action
            putExtra("prayer_name", prayerName)
            putExtra("duration", duration)
            putExtra("trigger_time", timeMs)
        }
        val pi = PendingIntent.getBroadcast(
            context, requestCode, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // setAlarmClock() is fully Doze-exempt and treated as a user-visible alarm.
        // It fires at the exact time even in deep Doze, unlike setExactAndAllowWhileIdle()
        // which is rate-limited and can be deferred.
        val alarmInfo = AlarmManager.AlarmClockInfo(timeMs, null)
        am.setAlarmClock(alarmInfo, pi)
    }

    private fun scheduleMidnight(context: Context, am: AlarmManager) {
        val midnight = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, 1)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 1)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }

        val intent = Intent(context, DndAlarmReceiver::class.java).apply {
            action = "com.salahguard.RESCHEDULE"
        }
        val pi = PendingIntent.getBroadcast(
            context, MIDNIGHT_REQUEST_CODE, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val alarmInfo = AlarmManager.AlarmClockInfo(midnight.timeInMillis, null)
        am.setAlarmClock(alarmInfo, pi)

        Log.i(TAG, "Midnight reschedule alarm set for ${midnight.time}")
    }

    private fun getTimeMillisToday(timeStr: String): Long {
        val parts = timeStr.split(":")
        val hours = parts[0].toInt()
        val minutes = parts[1].toInt()
        return Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hours)
            set(Calendar.MINUTE, minutes)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
    }

    private fun getCurrentDay(): String {
        return when (Calendar.getInstance().get(Calendar.DAY_OF_WEEK)) {
            Calendar.SUNDAY -> "Sun"
            Calendar.MONDAY -> "Mon"
            Calendar.TUESDAY -> "Tue"
            Calendar.WEDNESDAY -> "Wed"
            Calendar.THURSDAY -> "Thu"
            Calendar.FRIDAY -> "Fri"
            Calendar.SATURDAY -> "Sat"
            else -> "Mon"
        }
    }

    private fun containsString(arr: JSONArray, value: String): Boolean {
        for (i in 0 until arr.length()) {
            if (arr.getString(i) == value) return true
        }
        return false
    }
}
