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
            nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_NONE)
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
                Log.e(TAG, "Failed to handle boot: \${e.message}", e)
            }
        }
    }
}
`;

const PROGUARD_RULES = `
# Salah Guard Native Modules
-keep class com.salahguard.DndModule { *; }
-keep class com.salahguard.DndPackage { *; }
-keep class com.salahguard.BootReceiver { *; }
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
