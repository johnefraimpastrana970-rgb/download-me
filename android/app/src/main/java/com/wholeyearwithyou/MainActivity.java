package com.wholeyearwithyou;

import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        int backgroundColor = Color.rgb(16, 9, 28);
        getWindow().setStatusBarColor(backgroundColor);
        getWindow().setNavigationBarColor(backgroundColor);

        webView = new WebView(this);
        webView.setBackgroundColor(backgroundColor);
        webView.setWebViewClient(new WebViewClient());
        if (Build.VERSION.SDK_INT >= 35) {
            webView.setOnApplyWindowInsetsListener((view, insets) -> {
                view.setPadding(
                        insets.getSystemWindowInsetLeft(),
                        insets.getSystemWindowInsetTop(),
                        insets.getSystemWindowInsetRight(),
                        insets.getSystemWindowInsetBottom()
                );
                return insets;
            });
        }

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setSupportZoom(false);
        settings.setTextZoom(100);

        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }
}
