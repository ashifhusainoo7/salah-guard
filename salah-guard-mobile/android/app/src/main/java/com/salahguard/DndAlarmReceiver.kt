package com.salahguard

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.app.NotificationCompat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Receives AlarmManager intents to enable/disable DND at prayer times.
 * Runs even when the app is killed — no need for a foreground service.
 */
class DndAlarmReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "DndAlarmReceiver"
        private const val PREFS_NAME = "salah_guard_prefs"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        Log.i(TAG, "Received alarm: $action")

        when (action) {
            "com.salahguard.ENABLE_DND" -> {
                val prayerName = intent.getStringExtra("prayer_name") ?: "Prayer"
                val duration = intent.getIntExtra("duration", 15)
                handleEnableDnd(context, prayerName, duration)
            }
            "com.salahguard.DISABLE_DND" -> {
                val prayerName = intent.getStringExtra("prayer_name") ?: "Prayer"
                val duration = intent.getIntExtra("duration", 15)
                handleDisableDnd(context, prayerName, duration)
            }
            "com.salahguard.RESCHEDULE" -> {
                Log.i(TAG, "Midnight reschedule triggered")
                DndAlarmScheduler.scheduleAll(context)
            }
        }
    }

    private fun handleEnableDnd(context: Context, prayerName: String, duration: Int) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (!nm.isNotificationPolicyAccessGranted) {
            Log.w(TAG, "DND permission not granted, cannot enable")
            return
        }

        // Enable DND (total silence)
        nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_NONE)
        Log.i(TAG, "DND enabled for $prayerName ($duration min)")

        // Store session start info for logging when DND ends
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString("current_dnd_prayer", prayerName)
            .putLong("current_dnd_start", System.currentTimeMillis())
            .putInt("current_dnd_duration", duration)
            .apply()

        // Show notification
        showNotification(
            context,
            "DND Active - $prayerName",
            "Do Not Disturb enabled for $duration minutes",
            1
        )
    }

    private fun handleDisableDnd(context: Context, prayerName: String, duration: Int) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (!nm.isNotificationPolicyAccessGranted) {
            Log.w(TAG, "DND permission not granted, cannot disable")
            return
        }

        // Disable DND (all interruptions allowed)
        nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
        Log.i(TAG, "DND disabled after $prayerName")

        // Log the completed session
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val startTime = prefs.getLong("current_dnd_start", 0)
        val sessionPrayerName = prefs.getString("current_dnd_prayer", prayerName) ?: prayerName
        val sessionDuration = prefs.getInt("current_dnd_duration", duration)

        if (startTime > 0) {
            val fmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
            DndAlarmScheduler.addPendingSession(
                context,
                sessionPrayerName,
                fmt.format(Date(startTime)),
                fmt.format(Date()),
                sessionDuration
            )

            // Clear current session state
            prefs.edit()
                .remove("current_dnd_prayer")
                .remove("current_dnd_start")
                .remove("current_dnd_duration")
                .apply()
        }

        // Show notification
        showNotification(
            context,
            "DND Lifted - $prayerName",
            "Do Not Disturb has been disabled",
            2
        )

        // Reschedule remaining alarms (handles next prayer today or midnight for tomorrow)
        DndAlarmScheduler.scheduleAll(context)
    }

    private fun showNotification(context: Context, title: String, body: String, id: Int) {
        try {
            DndAlarmScheduler.ensureNotificationChannel(context)

            val notification = NotificationCompat.Builder(context, "salah_guard_dnd")
                .setSmallIcon(android.R.drawable.ic_lock_silent_mode)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setAutoCancel(true)
                .build()

            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.notify(id, notification)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to show notification: ${e.message}", e)
        }
    }
}
