-keep class com.nousresearch.hermes.** { *; }
-dontwarn android.webkit.WebView
-keepclassmembers class * extends android.webkit.WebViewClient {
    public *;
}
