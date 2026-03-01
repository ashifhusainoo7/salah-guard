const {
  withDangerousMod,
  withMainApplication,
  withAndroidManifest,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Kotlin source code for the native DND module
// ---------------------------------------------------------------------------

const DND_MODULE_KT = `package com.salahguard

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
            nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("DND_ERROR", "Failed to enable DND: \${e.message}", e)
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
            promise.reject("DND_ERROR", "Failed to disable DND: \${e.message}", e)
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
            promise.reject("DND_ERROR", "Failed to check DND status: \${e.message}", e)
        }
    }

    @ReactMethod
    fun hasDndPermission(promise: Promise) {
        try {
            val nm = getNotificationManager()
            promise.resolve(nm.isNotificationPolicyAccessGranted)
        } catch (e: Exception) {
            promise.reject("DND_ERROR", "Failed to check DND permission: \${e.message}", e)
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
            promise.reject("DND_ERROR", "Failed to open DND settings: \${e.message}", e)
        }
    }

    @ReactMethod
    fun isBatteryOptimizationExcluded(promise: Promise) {
        try {
            val pm = reactApplicationContext.getSystemService(Context.POWER_SERVICE)
                    as PowerManager
            promise.resolve(pm.isIgnoringBatteryOptimizations(reactApplicationContext.packageName))
        } catch (e: Exception) {
            promise.reject("DND_ERROR",
                    "Failed to check battery optimization status: \${e.message}", e)
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
                intent.data = Uri.parse("package:\$packageName")
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(intent)
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("DND_ERROR",
                    "Failed to request battery optimization exclusion: \${e.message}", e)
        }
    }

    @ReactMethod
    fun saveNotificationSettings(silentOnStart: Boolean, showLifted: Boolean, promise: Promise) {
        try {
            reactApplicationContext.getSharedPreferences("salah_guard_prefs", Context.MODE_PRIVATE)
                .edit()
                .putBoolean("notify_on_start", silentOnStart)
                .putBoolean("notify_on_lifted", showLifted)
                .apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("DND_ERROR", "Failed to save notification settings: \${e.message}", e)
        }
    }

    @ReactMethod
    fun schedulePrayers(prayersJson: String, isGloballyActive: Boolean, promise: Promise) {
        try {
            DndAlarmScheduler.savePrayers(reactApplicationContext, prayersJson, isGloballyActive)
            DndAlarmScheduler.scheduleAll(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("DND_ERROR", "Failed to schedule prayers: \${e.message}", e)
        }
    }

    @ReactMethod
    fun cancelAllAlarms(promise: Promise) {
        try {
            DndAlarmScheduler.cancelAll(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("DND_ERROR", "Failed to cancel alarms: \${e.message}", e)
        }
    }

    @ReactMethod
    fun getPendingSessions(promise: Promise) {
        try {
            val sessions = DndAlarmScheduler.getPendingSessions(reactApplicationContext)
            promise.resolve(sessions)
        } catch (e: Exception) {
            promise.reject("DND_ERROR", "Failed to get pending sessions: \${e.message}", e)
        }
    }

    @ReactMethod
    fun clearPendingSessions(promise: Promise) {
        try {
            DndAlarmScheduler.clearPendingSessions(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("DND_ERROR", "Failed to clear pending sessions: \${e.message}", e)
        }
    }
}
`;

const DND_PACKAGE_KT = `package com.salahguard

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class DndPackage : ReactPackage {

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(DndModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
`;

const BOOT_RECEIVER_KT = `package com.salahguard

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
            Log.i(TAG, "Received \$action - rescheduling DND alarms")

            try {
                DndAlarmScheduler.scheduleAll(context)
                Log.i(TAG, "DND alarms rescheduled after \$action")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to reschedule after \$action: \${e.message}", e)
            }
        }
    }
}
`;

const DND_ALARM_SCHEDULER_KT = `package com.salahguard

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

    fun savePrayers(context: Context, prayersJson: String, isGloballyActive: Boolean) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_PRAYERS, prayersJson)
            .putBoolean(KEY_GLOBAL_ACTIVE, isGloballyActive)
            .apply()
    }

    fun scheduleAll(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val prayersJson = prefs.getString(KEY_PRAYERS, null)
        if (prayersJson == null) {
            Log.i(TAG, "No prayers stored, nothing to schedule")
            return
        }
        val isGloballyActive = prefs.getBoolean(KEY_GLOBAL_ACTIVE, true)
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
            if (startMillis <= now && endMillis > now) {
                val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                if (nm.isNotificationPolicyAccessGranted) {
                    // If DND is currently off (INTERRUPTION_FILTER_ALL), the user manually
                    // disabled it — respect that choice and don't re-enable.
                    if (nm.currentInterruptionFilter == NotificationManager.INTERRUPTION_FILTER_ALL) {
                        Log.i(TAG, "In prayer window for \$prayerName but user manually disabled DND, skipping")
                    } else {
                        nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY)
                        Log.i(TAG, "Currently in prayer window for \$prayerName, DND enabled")
                        prefs.edit()
                            .putString("current_dnd_prayer", prayerName)
                            .putLong("current_dnd_start", startMillis)
                            .putInt("current_dnd_duration", duration)
                            .apply()
                    }
                }
            }
            if (startMillis > now) {
                scheduleExact(context, am, startMillis, prayerId * 2,
                    "com.salahguard.ENABLE_DND", prayerName, duration)
                alarmsScheduled++
            }
            if (endMillis > now) {
                scheduleExact(context, am, endMillis, prayerId * 2 + 1,
                    "com.salahguard.DISABLE_DND", prayerName, duration)
                alarmsScheduled++
            }
        }
        scheduleMidnight(context, am)
        Log.i(TAG, "Scheduled \$alarmsScheduled alarms for today (\$today)")
    }

    fun cancelAll(context: Context) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        for (prayerId in 1..10) {
            for (suffix in 0..1) {
                val requestCode = prayerId * 2 + suffix
                val intent = Intent(context, DndAlarmReceiver::class.java)
                val pi = PendingIntent.getBroadcast(context, requestCode, intent,
                    PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE)
                if (pi != null) { am.cancel(pi); pi.cancel() }
            }
        }
        val midnightIntent = Intent(context, DndAlarmReceiver::class.java)
        val midnightPi = PendingIntent.getBroadcast(context, MIDNIGHT_REQUEST_CODE,
            midnightIntent, PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE)
        if (midnightPi != null) { am.cancel(midnightPi); midnightPi.cancel() }
    }

    fun addPendingSession(context: Context, prayerName: String,
                          startTime: String, endTime: String, durationMinutes: Int) {
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
    }

    fun getPendingSessions(context: Context): String {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(KEY_PENDING_SESSIONS, "[]") ?: "[]"
    }

    fun clearPendingSessions(context: Context) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putString(KEY_PENDING_SESSIONS, "[]").apply()
    }

    fun ensureNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (nm.getNotificationChannel(NOTIFICATION_CHANNEL_ID) == null) {
                val channel = NotificationChannel(NOTIFICATION_CHANNEL_ID, "Prayer DND",
                    NotificationManager.IMPORTANCE_LOW).apply {
                    description = "Notifications when DND is enabled/disabled for prayers"
                }
                nm.createNotificationChannel(channel)
            }
        }
    }

    private fun scheduleExact(context: Context, am: AlarmManager, timeMs: Long,
                              requestCode: Int, action: String, prayerName: String, duration: Int) {
        val intent = Intent(context, DndAlarmReceiver::class.java).apply {
            this.action = action
            putExtra("prayer_name", prayerName)
            putExtra("duration", duration)
            putExtra("trigger_time", timeMs)
        }
        val pi = PendingIntent.getBroadcast(context, requestCode, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
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
        val pi = PendingIntent.getBroadcast(context, MIDNIGHT_REQUEST_CODE, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val alarmInfo = AlarmManager.AlarmClockInfo(midnight.timeInMillis, null)
        am.setAlarmClock(alarmInfo, pi)
    }

    private fun getTimeMillisToday(timeStr: String): Long {
        val parts = timeStr.split(":")
        return Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, parts[0].toInt())
            set(Calendar.MINUTE, parts[1].toInt())
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
    }

    private fun getCurrentDay(): String {
        return when (Calendar.getInstance().get(Calendar.DAY_OF_WEEK)) {
            Calendar.SUNDAY -> "Sun"; Calendar.MONDAY -> "Mon"
            Calendar.TUESDAY -> "Tue"; Calendar.WEDNESDAY -> "Wed"
            Calendar.THURSDAY -> "Thu"; Calendar.FRIDAY -> "Fri"
            Calendar.SATURDAY -> "Sat"; else -> "Mon"
        }
    }

    private fun containsString(arr: JSONArray, value: String): Boolean {
        for (i in 0 until arr.length()) { if (arr.getString(i) == value) return true }
        return false
    }
}
`;

const DND_ALARM_RECEIVER_KT = `package com.salahguard

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.app.NotificationCompat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class DndAlarmReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "DndAlarmReceiver"
        private const val PREFS_NAME = "salah_guard_prefs"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        Log.i(TAG, "Received alarm: \$action")
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
        if (!nm.isNotificationPolicyAccessGranted) return
        nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY)
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString("current_dnd_prayer", prayerName)
            .putLong("current_dnd_start", System.currentTimeMillis())
            .putInt("current_dnd_duration", duration)
            .apply()
        val notifyOnStart = prefs.getBoolean("notify_on_start", true)
        if (notifyOnStart) {
            showNotification(context, "DND Active - \$prayerName",
                "Do Not Disturb enabled for \$duration minutes", 1)
        }
    }

    private fun handleDisableDnd(context: Context, prayerName: String, duration: Int) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (!nm.isNotificationPolicyAccessGranted) return
        nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val startTime = prefs.getLong("current_dnd_start", 0)
        val sessionPrayer = prefs.getString("current_dnd_prayer", prayerName) ?: prayerName
        val sessionDuration = prefs.getInt("current_dnd_duration", duration)
        if (startTime > 0) {
            val fmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
            DndAlarmScheduler.addPendingSession(context, sessionPrayer,
                fmt.format(Date(startTime)), fmt.format(Date()), sessionDuration)
            prefs.edit().remove("current_dnd_prayer").remove("current_dnd_start")
                .remove("current_dnd_duration").apply()
        }
        val notifyOnLifted = prefs.getBoolean("notify_on_lifted", true)
        if (notifyOnLifted) {
            showNotification(context, "DND Lifted - \$prayerName",
                "Do Not Disturb has been disabled", 2)
        }
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
            Log.e(TAG, "Failed to show notification: \${e.message}", e)
        }
    }
}
`;

const PROGUARD_RULES = `
# Salah Guard Native Modules
-keep class com.salahguard.DndModule { *; }
-keep class com.salahguard.DndPackage { *; }
-keep class com.salahguard.BootReceiver { *; }
-keep class com.salahguard.DndAlarmScheduler { *; }
-keep class com.salahguard.DndAlarmReceiver { *; }
`;

// ---------------------------------------------------------------------------
// 1. Write native Kotlin files + proguard rules
// ---------------------------------------------------------------------------
function withDndNativeFiles(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const androidRoot = path.join(projectRoot, "android");

      // Write Kotlin source files
      const javaDir = path.join(
        androidRoot,
        "app",
        "src",
        "main",
        "java",
        "com",
        "salahguard"
      );
      fs.mkdirSync(javaDir, { recursive: true });

      fs.writeFileSync(path.join(javaDir, "DndModule.kt"), DND_MODULE_KT);
      fs.writeFileSync(path.join(javaDir, "DndPackage.kt"), DND_PACKAGE_KT);
      fs.writeFileSync(path.join(javaDir, "BootReceiver.kt"), BOOT_RECEIVER_KT);
      fs.writeFileSync(path.join(javaDir, "DndAlarmScheduler.kt"), DND_ALARM_SCHEDULER_KT);
      fs.writeFileSync(path.join(javaDir, "DndAlarmReceiver.kt"), DND_ALARM_RECEIVER_KT);

      // Append proguard keep rules
      const proguardPath = path.join(androidRoot, "app", "proguard-rules.pro");
      const existing = fs.existsSync(proguardPath)
        ? fs.readFileSync(proguardPath, "utf8")
        : "";
      if (!existing.includes("com.salahguard.DndModule")) {
        fs.writeFileSync(proguardPath, existing + PROGUARD_RULES);
      }

      return cfg;
    },
  ]);
}

// ---------------------------------------------------------------------------
// 2. Register DndPackage in MainApplication
// ---------------------------------------------------------------------------
function withDndMainApplication(config) {
  return withMainApplication(config, (cfg) => {
    let contents = cfg.modResults.contents;

    // Add import if missing
    const importLine = "import com.salahguard.DndPackage";
    if (!contents.includes(importLine)) {
      // Insert after the last import line
      const lastImportIdx = contents.lastIndexOf("import ");
      const endOfLine = contents.indexOf("\n", lastImportIdx);
      contents =
        contents.slice(0, endOfLine + 1) +
        importLine +
        "\n" +
        contents.slice(endOfLine + 1);
    }

    // Add DndPackage() to the packages list if missing
    if (!contents.includes("DndPackage()")) {
      // Look for the packages list override and add after the default packages
      const packagesRegex =
        /override\s+fun\s+getPackages\s*\(\s*\)\s*:\s*List<ReactPackage>\s*\{[^}]*return\s+PackageList\(this\)\.packages\.apply\s*\{/;
      if (packagesRegex.test(contents)) {
        contents = contents.replace(packagesRegex, (match) => {
          return match + "\n            add(DndPackage())";
        });
      } else {
        // Fallback: look for PackageList(this).packages and append
        const simpleRegex = /PackageList\(this\)\.packages/;
        if (simpleRegex.test(contents)) {
          contents = contents.replace(
            simpleRegex,
            "PackageList(this).packages.apply { add(DndPackage()) }"
          );
        }
      }
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
}

// ---------------------------------------------------------------------------
// 3. Add permissions + BootReceiver to AndroidManifest.xml
// ---------------------------------------------------------------------------
function withDndAndroidManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const mainApp = manifest.manifest;

    // -- Permissions --
    if (!mainApp["uses-permission"]) {
      mainApp["uses-permission"] = [];
    }
    const perms = mainApp["uses-permission"];
    const requiredPermissions = [
      "android.permission.SCHEDULE_EXACT_ALARM",
      "android.permission.USE_EXACT_ALARM",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_SPECIAL_USE",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.VIBRATE",
      "android.permission.WAKE_LOCK",
      "android.permission.POST_NOTIFICATIONS",
    ];

    for (const perm of requiredPermissions) {
      const exists = perms.some(
        (p) => p.$?.["android:name"] === perm
      );
      if (!exists) {
        perms.push({ $: { "android:name": perm } });
      }
    }

    // -- BootReceiver --
    const application = mainApp.application?.[0];
    if (application) {
      if (!application.receiver) {
        application.receiver = [];
      }

      const hasBootReceiver = application.receiver.some(
        (r) => r.$?.["android:name"] === ".BootReceiver"
      );

      if (!hasBootReceiver) {
        application.receiver.push({
          $: {
            "android:name": ".BootReceiver",
            "android:enabled": "true",
            "android:exported": "true",
          },
          "intent-filter": [
            {
              action: [
                { $: { "android:name": "android.intent.action.BOOT_COMPLETED" } },
                { $: { "android:name": "android.intent.action.QUICKBOOT_POWERON" } },
                { $: { "android:name": "android.intent.action.TIME_SET" } },
                { $: { "android:name": "android.intent.action.TIMEZONE_CHANGED" } },
              ],
            },
          ],
        });
      }

      // -- DndAlarmReceiver --
      const hasAlarmReceiver = application.receiver.some(
        (r) => r.$?.["android:name"] === ".DndAlarmReceiver"
      );

      if (!hasAlarmReceiver) {
        application.receiver.push({
          $: {
            "android:name": ".DndAlarmReceiver",
            "android:enabled": "true",
            "android:exported": "false",
          },
          "intent-filter": [
            {
              action: [
                { $: { "android:name": "com.salahguard.ENABLE_DND" } },
                { $: { "android:name": "com.salahguard.DISABLE_DND" } },
                { $: { "android:name": "com.salahguard.RESCHEDULE" } },
              ],
            },
          ],
        });
      }

      // -- Foreground service with special-use type --
      if (!application.service) {
        application.service = [];
      }

      // Declare the react-native-background-actions service with foregroundServiceType
      // so Android 14+ allows starting it as a foreground service.
      const bgActionsServiceName = "com.asterinet.react.bgactions.RNBackgroundActionsTask";
      const hasFgService = application.service.some(
        (s) =>
          s.$?.["android:name"] === bgActionsServiceName
      );

      if (!hasFgService) {
        application.service.push({
          $: {
            "android:name": bgActionsServiceName,
            "android:foregroundServiceType": "specialUse",
            "android:exported": "false",
          },
          property: [
            {
              $: {
                "android:name": "android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE",
                "android:value": "Control Do Not Disturb mode during prayer times",
              },
            },
          ],
        });
      }
    }

    cfg.modResults = manifest;
    return cfg;
  });
}

// ---------------------------------------------------------------------------
// Compose all mods into a single config plugin
// ---------------------------------------------------------------------------
function withDndModule(config) {
  config = withDndNativeFiles(config);
  config = withDndMainApplication(config);
  config = withDndAndroidManifest(config);
  return config;
}

module.exports = withDndModule;
