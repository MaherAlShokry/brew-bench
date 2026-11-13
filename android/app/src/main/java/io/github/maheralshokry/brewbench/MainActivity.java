package io.github.maheralshokry.brewbench;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // True while something the app opened itself is on top: the photo picker, the camera, the share sheet, sign-in.
    // Those stop this screen too, but you haven't left the app, so the home-screen icon mustn't change then.
    private boolean opened = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppIconPlugin.class);
        registerPlugin(WidgetPlugin.class);
        registerPlugin(CuesPlugin.class);
        super.onCreate(savedInstanceState);
        // Opened from the home-screen widget: the app asks what to open once it has started (WidgetPlugin.pending).
        WidgetPlugin.take(getIntent());
        addShortcuts();
        // The back gesture (or button) steps back inside the app: it closes the open sheet or returns to the previous
        // screen. Only when there is nowhere left to go does the app go to the background.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
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
    }

    // The home-screen icon changes to the chosen logo once you've left the app (see AppIconPlugin). Changing it while
    // the photo picker or camera was open on top could close the app, so that waits until you really leave.
    @Override
    public void onStop() {
        super.onStop();
        if (!opened && !isChangingConfigurations()) AppIconPlugin.apply(this);
    }
}
