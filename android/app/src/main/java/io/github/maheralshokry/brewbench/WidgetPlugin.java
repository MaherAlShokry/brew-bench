package io.github.maheralshokry.brewbench;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;

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
        for (String k : new String[] {"id", "title", "sub", "roastDate", "win", "left", "flag"}) {
            String v = call.getString(k, "");
            e.putString(k, v == null ? "" : v.length() > 120 ? v.substring(0, 120) : v);
        }
        // The coffee's photo, a small JPEG as a data URL (left out if it's unexpectedly large).
        String ph = call.getString("photo", "");
        e.putString("photo", ph != null && ph.length() < 250000 ? ph : "");
        // The other widgets' data, as JSON text: the cabinet's coffees, the go-to recipe and the coming words.
        for (String k : new String[] {"cabinet", "brew", "words"}) {
            String v = call.getString(k, null);
            // The cabinet carries a small photo per coffee, so it may be longer.
            if (v != null && v.length() < (k.equals("cabinet") ? 400000 : 60000)) e.putString(k, v);
        }
        e.apply();
        BrewWidget.refresh(ctx);
        call.resolve();
    }

    /** The plugin while the app runs, so the timer's buttons can tell the app what changed. */
    private static WidgetPlugin live = null;

    @Override
    public void load() { live = this; }

    @Override
    protected void handleOnDestroy() { if (live == this) live = null; }

    /**
     * The brew timer, as the app has it: state (run, pause, done or stop), the recipe's name and key, the time brewed so
     * far and in all (ms), the steps ([ms, text] pairs) and the plan it was opened with (JSON text, to reopen it the same
     * way). The notification, the status-bar chip and the widget take it from here (BrewTimer).
     */
    @PluginMethod
    public void timer(PluginCall call) {
        Context ctx = getContext();
        long el = call.getLong("elapsed", 0L), now = System.currentTimeMillis();
        SharedPreferences.Editor e = BrewWidget.prefs(ctx).edit();
        e.putString("t_state", call.getString("state", "stop"));
        e.putString("t_name", trim(call.getString("name", "")));
        e.putString("t_key", trim(call.getString("key", "")));
        e.putString("t_step", trim(call.getString("step", "")));
        e.putString("t_next", trim(call.getString("next", "")));
        JSArray st = call.getArray("steps");
        if (st != null) {
            JSONArray out = new JSONArray();
            try {
                for (int i = 0; i < st.length() && i < 40; i++) {
                    JSONArray x = st.getJSONArray(i);
                    out.put(new JSONArray().put(Math.max(0L, x.getLong(0))).put(trim(x.getString(1))));
                }
            } catch (Exception ignored) { }
            e.putString("t_steps", out.toString());
        }
        String plan = call.getString("plan", null);
        if (plan != null) e.putString("t_plan", plan.length() <= 8000 ? plan : "");
        e.putLong("t_start", now - el);
        e.putLong("t_el", el);
        e.putLong("t_total", call.getLong("total", 0L));
        e.putLong("t_at", now);
        e.apply();
        BrewTimer.sync(ctx, true);
        call.resolve();
    }

    /** Where the brew timer is now, as the buttons may have left it while the app was closed. */
    @PluginMethod
    public void timerState(PluginCall call) {
        long now = System.currentTimeMillis();
        BrewTimer.St s = BrewTimer.read(getContext());
        call.resolve(stateOf(s, now, BrewWidget.prefs(getContext()).getString("t_plan", "")));
    }

    static JSObject stateOf(BrewTimer.St s, long now, String plan) {
        JSObject r = new JSObject();
        String st = s.live(now) || s.showDone(now) ? s.state : "stop";
        r.put("state", st);
        r.put("elapsed", s.elapsed(now));
        r.put("total", s.total);
        r.put("key", s.key);
        r.put("name", s.name);
        if (plan != null) r.put("plan", plan);
        return r;
    }

    /** A button on the notification or widget changed the brew: the open app follows (the "timer" event). */
    static void timerChanged(BrewTimer.St s, long now) {
        WidgetPlugin p = live;
        if (p == null) return;
        try { p.notifyListeners("timer", stateOf(s, now, null)); } catch (Exception ignored) { }
    }

    private static String trim(String v) { return v == null ? "" : v.length() > 120 ? v.substring(0, 120) : v; }

    @PluginMethod
    public void pending(PluginCall call) {
        JSObject r = new JSObject();
        r.put("open", pendingOpen == null ? "" : pendingOpen);
        pendingOpen = null;
        call.resolve(r);
    }
}
