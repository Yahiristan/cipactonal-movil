# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# Shopify React Native Skia
-keep class com.shopify.reactnative.skia.** { *; }

# React Native Vision Camera
-keep class com.mrousavy.camera.** { *; }
-keep class com.mrousavy.camera.frameprocessor.** { *; }
-keepclassmembers class com.mrousavy.camera.frameprocessor.** { *; }

# React Native Vision Camera Face Detector
-keep class com.visioncamerafacedetector.** { *; }

# React Native Worklets Core
-keep class com.worklets.** { *; }
-dontwarn com.worklets.**

# React Native WebView
-keep class com.reactnativecommunity.webview.** { *; }
