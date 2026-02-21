package com.salahguard

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.*

/**
 * Native module providing Do Not Disturb control capabilities.
 * Validates all inputs and handles all exceptions to prevent native crashes.
 */
class DndModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "DndModule"

    private fun getNotificationManager(): NotificationManager {
        return reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE)
                as NotificationManager
    }

    /**
     * Enables Do Not Disturb mode (INTERRUPTION_FILTER_NONE = total silence).
     */
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

    /**
     * Disables Do Not Disturb mode (restores all notifications).
     */
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

    /**
     * Checks if DND is currently enabled.
     */
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

    /**
     * Checks if the app has Notification Policy Access (DND permission).
     */
    @ReactMethod
    fun hasDndPermission(promise: Promise) {
        try {
            val nm = getNotificationManager()
            promise.resolve(nm.isNotificationPolicyAccessGranted)
        } catch (e: Exception) {
            promise.reject("DND_ERROR", "Failed to check DND permission: ${e.message}", e)
        }
    }

    /**
     * Opens system settings for Notification Policy Access.
     */
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

    /**
     * Requests exclusion from battery optimization to ensure reliable background execution.
     */
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
}
