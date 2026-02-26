package com.salahguard

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "SalahGuardBoot"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == Intent.ACTION_TIME_CHANGED ||
            action == Intent.ACTION_TIMEZONE_CHANGED) {
            Log.i(TAG, "Received $action - rescheduling DND alarms")

            try {
                DndAlarmScheduler.scheduleAll(context)
                Log.i(TAG, "DND alarms rescheduled after $action")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to reschedule after $action: ${e.message}", e)
            }
        }
    }
}
