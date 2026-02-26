package com.salahguard

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.*

class DndModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "DndModule"

    private fun getNotificationManager(): NotificationManager {
        return reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE)
                as NotificationManager
    }

    @ReactMethod
    fun enableDnd(promise: Promise) {
        try {
            val nm = getNotificationManager()
            if (!nm.isNotificationPolicyAccessGranted) {
                promise.resolve(false)
                return
            }
            nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_NONE)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("DND_ERROR", "Failed to enable DND: ${e.message}", e)
        }
    }

    @ReactMethod
    fun disableDnd(promise: Promise) {
        try {
            val nm = getNotificationManager()
            if (!nm.isNotificationPolicyAccessGranted) {
                promise.resolve(false)
                return
            }
            nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("DND_ERROR", "Failed to disable DND: ${e.message}", e)
        }
    }

    @ReactMethod
    fun isDndEnabled(promise: Promise) {
        try {
            val nm = getNotificationManager()
            val filter = nm.currentInterruptionFilter
            promise.resolve(filter == NotificationManager.INTERRUPTION_FILTER_NONE ||
                    filter == NotificationManager.INTERRUPTION_FILTER_ALARMS ||
                    filter == NotificationManager.INTERRUPTION_FILTER_PRIORITY)
        } catch (e: Exception) {
            promise.reject("DND_ERROR", "Failed to check DND status: ${e.message}", e)
        }
    }

    @ReactMethod
    fun hasDndPermission(promise: Promise) {
        try {
            val nm = getNotificationManager()
            promise.resolve(nm.isNotificationPolicyAccessGranted)
        } catch (e: Exception) {
            promise.reject("DND_ERROR", "Failed to check DND permission: ${e.message}", e)
        }
    }

    @ReactMethod
    fun requestDndPermission(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("DND_ERROR", "Failed to open DND settings: ${e.message}", e)
        }
    }

    @ReactMethod
    fun requestBatteryOptimizationExclusion(promise: Promise) {
        try {
            val pm = reactApplicationContext.getSystemService(Context.POWER_SERVICE)
                    as PowerManager
            val packageName = reactApplicationContext.packageName

            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
                intent.data = Uri.parse("package:$packageName")
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(intent)
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("DND_ERROR",
                    "Failed to request battery optimization exclusion: ${e.message}", e)
        }
    }

    /**
     * Store prayers in SharedPreferences and schedule native AlarmManager alarms.
     * These fire even when the app is killed.
     */
    @ReactMethod
    fun schedulePrayers(prayersJson: String, isGloballyActive: Boolean, promise: Promise) {
        try {
            DndAlarmScheduler.savePrayers(reactApplicationContext, prayersJson, isGloballyActive)
            DndAlarmScheduler.scheduleAll(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("DND_ERROR", "Failed to schedule prayers: ${e.message}", e)
        }
    }

    /**
     * Cancel all pending DND alarms.
     */
    @ReactMethod
    fun cancelAllAlarms(promise: Promise) {
        try {
            DndAlarmScheduler.cancelAll(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("DND_ERROR", "Failed to cancel alarms: ${e.message}", e)
        }
    }

    /**
     * Get DND sessions that completed while the app was closed (stored in SharedPreferences).
     * Returns a JSON array string.
     */
    @ReactMethod
    fun getPendingSessions(promise: Promise) {
        try {
            val sessions = DndAlarmScheduler.getPendingSessions(reactApplicationContext)
            promise.resolve(sessions)
        } catch (e: Exception) {
            promise.reject("DND_ERROR", "Failed to get pending sessions: ${e.message}", e)
        }
    }

    /**
     * Clear pending sessions after the JS side has synced them into AsyncStorage.
     */
    @ReactMethod
    fun clearPendingSessions(promise: Promise) {
        try {
            DndAlarmScheduler.clearPendingSessions(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("DND_ERROR", "Failed to clear pending sessions: ${e.message}", e)
        }
    }
}
