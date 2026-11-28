package io.github.maheralshokry.brewbench;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebView;
import com.getcapacitor.WebViewListener;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // True while something the app opened itself is on top: the photo picker, the camera, the share sheet, sign-in.
    // Those stop this screen too, but you haven't left the app, so the home-screen icon mustn't change then.
    private boolean opened = false;

    // The system's launch screen stays until the page has loaded (at most 2 s), then fades into the app's own opening
    // scene: it used to go as soon as the window drew, leaving a blank moment before the scene popped in.
    private volatile boolean webReady = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        androidx.core.splashscreen.SplashScreen sp = null;
        try { sp = androidx.core.splashscreen.SplashScreen.installSplashScreen(this); } catch (Exception ignored) { }
        if (sp != null) {
            final long t0 = android.os.SystemClock.uptimeMillis();
            sp.setKeepOnScreenCondition(() -> !webReady && android.os.SystemClock.uptimeMillis() - t0 < 2000);
            sp.setOnExitAnimationListener(v -> {
                try { v.getView().animate().alpha(0f).setDuration(220).withEndAction(v::remove).start(); } catch (Exception e) { v.remove(); }
            });
        }
        registerPlugin(AppIconPlugin.class);
        registerPlugin(WidgetPlugin.class);
        registerPlugin(CuesPlugin.class);
        super.onCreate(savedInstanceState);
        // Opened from the home-screen widget: the app asks what to open once it has started (WidgetPlugin.pending).
        WidgetPlugin.take(getIntent());
        addShortcuts();
        // A brew started or left running while the app was closed: its notification and clock carry on.
        BrewTimer.sync(this, false);
        // When Android reclaims the page's memory (its renderer is stopped), the WebView would take the whole app down
        // with it. Instead the screen starts again with a fresh page: the app reopens where your saved choices put it.
        if (getBridge() != null) getBridge().addWebViewListener(new WebViewListener() {
            @Override
            @android.annotation.TargetApi(26)
            public void onPageLoaded(WebView view) { webReady = true; sendCutout(); }

            @Override
            @android.annotation.TargetApi(26)
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                try {
                    if (view.getParent() instanceof android.view.ViewGroup) ((android.view.ViewGroup) view.getParent()).removeView(view);
                } catch (Exception ignored) { }
                getWindow().getDecorView().post(MainActivity.this::recreate);
                return true;
            }
        });
        // The back gesture (or button) steps back inside the app: it closes the open sheet or returns to the previous
        // screen. Only when there is nowhere left to go does the app go to the background.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            // Android 14 and later report the back swipe as it happens (predictive back): the page shows what back
            // will close following your finger, springs back if you change your mind, and closes from there if not.
            private void js(String code) {
                WebView w = getBridge() == null ? null : getBridge().getWebView();
                if (w != null) w.evaluateJavascript(code, null);
            }

            @Override
            public void handleOnBackStarted(@androidx.annotation.NonNull androidx.activity.BackEventCompat e) {
                js("window.bbBackStart&&window.bbBackStart('" + (e.getSwipeEdge() == androidx.activity.BackEventCompat.EDGE_RIGHT ? "right" : "left") + "')");
            }

            @Override
            public void handleOnBackProgressed(@androidx.annotation.NonNull androidx.activity.BackEventCompat e) {
                js("window.bbBackMove&&window.bbBackMove(" + e.getProgress() + ")");
            }

            @Override
            public void handleOnBackCancelled() {
                js("window.bbBackCancel&&window.bbBackCancel()");
            }

            @Override
            public void handleOnBackPressed() {
                WebView web = getBridge() == null ? null : getBridge().getWebView();
                if (web == null) { moveTaskToBack(true); return; }
                web.evaluateJavascript("(window.bbBack&&window.bbBack())===true", result -> {
                    if ("true".equals(result)) return;
                    if (web.canGoBack() && !"false".equals(result)) web.goBack();
                    else moveTaskToBack(true);
                });
            }
        });
    }

    // Every screen the app opens (startActivity included) comes through here.
    @Override
    public void startActivityForResult(Intent intent, int requestCode, Bundle options) {
        opened = true;
        super.startActivityForResult(intent, requestCode, options);
    }

    /**
     * Long-press the app's icon: Start a brew (your go-to recipe's timer), Scan a bag, Log a brew. They open the app with
     * the same request a widget tap sends. Added from here rather than the manifest, so they follow whichever icon is set.
     */
    private void addShortcuts() {
        if (android.os.Build.VERSION.SDK_INT < 25) return;
        try {
            android.content.pm.ShortcutManager sm = getSystemService(android.content.pm.ShortcutManager.class);
            if (sm == null) return;
            String[][] list = {{"brew", "Start a brew", "Start your usual brew"}, {"scan", "Scan a bag", "Scan a bag of coffee"}, {"log", "Log a brew", "Log a brew"}};
            int[] icons = {R.drawable.sc_brew, R.drawable.sc_scan, R.drawable.sc_log};
            java.util.List<android.content.pm.ShortcutInfo> out = new java.util.ArrayList<>();
            for (int i = 0; i < list.length; i++) {
                Intent in = new Intent(this, MainActivity.class).setAction(Intent.ACTION_VIEW).putExtra(WidgetPlugin.EXTRA, list[i][0]);
                out.add(new android.content.pm.ShortcutInfo.Builder(this, "bb_" + list[i][0]).setShortLabel(list[i][1]).setLongLabel(list[i][2])
                    .setIcon(android.graphics.drawable.Icon.createWithResource(this, icons[i])).setIntent(in).setRank(i).build());
            }
            sm.setDynamicShortcuts(out);
        } catch (Exception ignored) { }
    }

    // A widget tap while the app is already running: tell the page to collect it.
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (WidgetPlugin.take(intent) && getBridge() != null && getBridge().getWebView() != null)
            getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript("window.bbWidget&&window.bbWidget()", null));
    }

    @Override
    public void onResume() {
        super.onResume();
        opened = false;
        hideStatusBar();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideStatusBar();
    }

    /**
     * The phone's clock and notification icons hide while the app is open, so they don't sit over the app's own top bar
     * and photos; a swipe down from the top edge shows them for a moment. The navigation bar stays.
     */
    private void hideStatusBar() {
        try {
            androidx.core.view.WindowInsetsControllerCompat c = androidx.core.view.WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            c.setSystemBarsBehavior(androidx.core.view.WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            c.hide(androidx.core.view.WindowInsetsCompat.Type.statusBars());
        } catch (Exception ignored) { }
        getWindow().getDecorView().postDelayed(this::sendCutout, 300);
    }

    /**
     * With the status bar hidden the camera's cut-out is still at the top of the screen: its height goes to the page as
     * --cut-top (CSS pixels), which the page keeps its top bar below, so nothing sits under the camera.
     */
    private void sendCutout() {
        try {
            android.view.WindowInsets wi = getWindow().getDecorView().getRootWindowInsets();
            if (wi == null || getBridge() == null || getBridge().getWebView() == null) return;
            int px = androidx.core.view.WindowInsetsCompat.toWindowInsetsCompat(wi).getInsets(androidx.core.view.WindowInsetsCompat.Type.displayCutout()).top;
            float css = px / getResources().getDisplayMetrics().density;
            getBridge().getWebView().evaluateJavascript("document.documentElement.style.setProperty('--cut-top','" + Math.round(css) + "px')", null);
        } catch (Exception ignored) { }
    }

    // The home-screen icon changes to the chosen logo once you've left the app (see AppIconPlugin). Changing it while
    // the photo picker or camera was open on top could close the app, so that waits until you really leave.
    @Override
    public void onStop() {
        super.onStop();
        if (!opened && !isChangingConfigurations()) AppIconPlugin.apply(this);
    }
}
