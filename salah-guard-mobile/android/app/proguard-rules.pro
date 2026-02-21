# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.react.**

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }
-dontwarn com.swmansion.reanimated.**

# React Native Screens
-keep class com.swmansion.rnscreens.** { *; }

# React Native Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# React Native MMKV
-keep class com.tencent.mmkv.** { *; }
-keep class com.reactnativemmkv.** { *; }

# React Native Push Notification
-keep class com.dieam.reactnativepushnotification.** { *; }
-dontwarn com.dieam.reactnativepushnotification.**

# React Native Background Actions
-keep class com.asterinet.react.bgactions.** { *; }

# React Native Keychain
-keep class com.oblador.keychain.** { *; }

# React Native Config
-keep class com.lugg.ReactNativeConfig.** { *; }

# React Native Biometrics
-keep class com.rnbiometrics.** { *; }

# React Native NetInfo
-keep class com.reactnativecommunity.netinfo.** { *; }

# React Native DateTimePicker
-keep class com.reactcommunity.rndatetimepicker.** { *; }

# Sentry React Native
-keep class io.sentry.** { *; }
-dontwarn io.sentry.**

# React Native SSL Pinning
-keep class com.toyberman.** { *; }

# React Native Jail Monkey
-keep class com.gantix.** { *; }

# React Native SVG
-keep class com.horcrux.svg.** { *; }

# Salah Guard Native Modules
-keep class com.salahguard.DndModule { *; }
-keep class com.salahguard.DndPackage { *; }
-keep class com.salahguard.BootReceiver { *; }

# Kotlin
-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-keepclassmembers class **$WhenMappings {
    <fields>;
}
-keepclassmembers class kotlin.Metadata {
    public <methods>;
}

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# Gson (used by some RN libraries)
-keep class com.google.gson.** { *; }
-keepattributes Signature
-keepattributes *Annotation*

# General
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
-keepattributes Exceptions,InnerClasses

# Prevent stripping of native method signatures
-keepclasseswithmembernames class * {
    native <methods>;
}

# Enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Parcelable
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}

# R8 compatibility
-keepattributes RuntimeVisibleAnnotations
-keepattributes RuntimeInvisibleAnnotations
