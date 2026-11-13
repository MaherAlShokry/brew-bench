package io.github.maheralshokry.brewbench;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.SystemClock;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONObject;

/**
 * "Quick brew": your go-to recipe (the one you've brewed most lately) with its numbers, and Start timer, which opens
 * the brew timer on it. Tapping the rest opens the recipe.
 */
public class QuickBrewWidget extends AppWidgetProvider {
    /**
     * While a brew runs (or is paused, or just finished) the widget follows it: the recipe, a clock the launcher keeps
     * itself (a Chronometer, so it ticks without the app), the step now and the next one. A brew left running is
     * forgotten once it is well past its time.
     */
    static boolean brewing(Context ctx, RemoteViews v) {
        SharedPreferences p = BrewWidget.prefs(ctx);
        String st = p.getString("t_state", "stop");
        long now = System.currentTimeMillis(), at = p.getLong("t_at", 0L), total = p.getLong("t_total", 0L);
        if ("stop".equals(st)) return false;
        if ("done".equals(st) && now - at > 15 * 60000L) return false;
        if (("run".equals(st) || "pause".equals(st)) && now - at > total + 20 * 60000L) return false;
        boolean run = "run".equals(st);
        v.setTextViewText(R.id.q_kicker, run ? "Brewing now" : "done".equals(st) ? "Brew complete" : "Paused");
        v.setTextViewText(R.id.q_title, p.getString("t_name", ""));
        v.setViewVisibility(R.id.q_chrono, "done".equals(st) ? View.GONE : View.VISIBLE);
        long el = run ? now - p.getLong("t_start", now) : p.getLong("t_el", 0L);
        v.setChronometer(R.id.q_chrono, SystemClock.elapsedRealtime() - el, null, run);
        v.setTextViewText(R.id.q_line, "done".equals(st) ? "Enjoy it. Log it in the app." : p.getString("t_step", ""));
        String next = "done".equals(st) ? "" : p.getString("t_next", "");
        v.setTextViewText(R.id.q_next, next);
        v.setViewVisibility(R.id.q_next, next.isEmpty() ? View.GONE : View.VISIBLE);
        v.setTextViewText(R.id.q_go, "done".equals(st) ? "Log brew" : "Open");
        v.setOnClickPendingIntent(R.id.q_root, BrewWidget.open(ctx, "resume", 22));
        v.setOnClickPendingIntent(R.id.q_go, BrewWidget.open(ctx, "done".equals(st) ? "log" : "resume", 23));
        return true;
    }

    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        for (int id : ids) m.updateAppWidget(id, views(ctx));
    }

    static RemoteViews views(Context ctx) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_brew);
        if (brewing(ctx, v)) return v;
        v.setViewVisibility(R.id.q_chrono, View.GONE);
        v.setViewVisibility(R.id.q_next, View.GONE);
        v.setTextViewText(R.id.q_kicker, ctx.getString(R.string.widget_brew_name));
        JSONObject o;
        try { o = new JSONObject(BrewWidget.prefs(ctx).getString("brew", "{}")); } catch (Exception e) { o = new JSONObject(); }
        String key = o.optString("key", "");
        if (key.isEmpty()) {
            v.setTextViewText(R.id.q_title, "Pick a recipe");
            v.setTextViewText(R.id.q_line, "Your go-to recipe shows here once you've brewed one");
            v.setTextViewText(R.id.q_go, "Recipes");
            v.setOnClickPendingIntent(R.id.q_root, BrewWidget.open(ctx, "recipes", 20));
            v.setOnClickPendingIntent(R.id.q_go, BrewWidget.open(ctx, "recipes", 21));
            return v;
        }
        v.setTextViewText(R.id.q_title, o.optString("name", ""));
        v.setTextViewText(R.id.q_line, o.optString("line", ""));
        v.setTextViewText(R.id.q_go, "Start timer");
        v.setOnClickPendingIntent(R.id.q_root, BrewWidget.open(ctx, "recipe:" + key, 20));
        v.setOnClickPendingIntent(R.id.q_go, BrewWidget.open(ctx, "timer:" + key, 21));
        return v;
    }
}
