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
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON") {
            Log.i(TAG, "Device rebooted - scheduling alarm reschedule")

            try {
                val launchIntent = context.packageManager
                    .getLaunchIntentForPackage(context.packageName)

                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    launchIntent.putExtra("BOOT_RESCHEDULE", true)
                    context.startActivity(launchIntent)
                    Log.i(TAG, "App launch intent sent for alarm rescheduling")
                } else {
                    Log.w(TAG, "Could not find launch intent for package")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to handle boot: ${e.message}", e)
            }
        }
    }
}
