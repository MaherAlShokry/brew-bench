package io.github.maheralshokry.brewbench;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * The app's side of the home-screen widgets. update({id, title, sub, roastDate, win, left, cabinet, brew, words}) sends
 * what they show: the coffee you're drinking (an empty id shows the empty cabinet; see BrewWidget), and as JSON text the
 * cabinet's coffees (CabinetWidget), the go-to recipe (QuickBrewWidget) and the coming days' words (WordWidget). A tap on the widget opens the app with what to open, which the
 * app collects with pending() once it has finished starting.
 */
@CapacitorPlugin(name = "Widget")
public class WidgetPlugin extends Plugin {
    static final String EXTRA = "bb_widget_open";
    private static String pendingOpen = null;

    /** Keeps what a widget tap asked to open, from the intent that started or resumed the app. */
    static boolean take(Intent intent) {
        if (intent == null) return false;
        String w = intent.getStringExtra(EXTRA);
        if (w == null || w.isEmpty()) return false;
        pendingOpen = w;
        intent.removeExtra(EXTRA);
        return true;
    }

    @PluginMethod
    public void update(PluginCall call) {
        Context ctx = getContext();
        SharedPreferences.Editor e = BrewWidget.prefs(ctx).edit();
        for (String k : new String[] {"id", "title", "sub", "roastDate", "win", "left"}) {
            String v = call.getString(k, "");
            e.putString(k, v == null ? "" : v.length() > 120 ? v.substring(0, 120) : v);
        }
        // The other widgets' data, as JSON text: the cabinet's coffees, the go-to recipe and the coming words.
        for (String k : new String[] {"cabinet", "brew", "words"}) {
            String v = call.getString(k, null);
            if (v != null && v.length() < 60000) e.putString(k, v);
        }
        e.apply();
        BrewWidget.refresh(ctx);
        call.resolve();
    }

    @PluginMethod
    public void pending(PluginCall call) {
        JSObject r = new JSObject();
        r.put("open", pendingOpen == null ? "" : pendingOpen);
        pendingOpen = null;
        call.resolve(r);
    }
}
