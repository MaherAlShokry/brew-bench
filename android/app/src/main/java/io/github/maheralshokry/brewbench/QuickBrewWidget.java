package io.github.maheralshokry.brewbench;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONObject;

/**
 * "Quick brew": your go-to recipe (the one you've brewed most lately), its dose, water and temperature in large type,
 * and Start timer, which opens the brew timer on it. While a brew runs it follows the brew instead (see brewing).
 */
public class QuickBrewWidget extends AppWidgetProvider {
    static final int[] VALS = {R.id.q_v0, R.id.q_v1, R.id.q_v2};
    static final int[] LABS = {R.id.q_l0, R.id.q_l1, R.id.q_l2};

    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        for (int id : ids) BrewWidget.push(ctx, m, id, QuickBrewWidget::views);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager m, int id, Bundle o) { onUpdate(ctx, m, new int[] {id}); }

    /**
     * While a brew runs (or is paused, or just finished): the recipe, a clock the launcher keeps itself (a Chronometer,
     * so it ticks without the app), the step now and the next one. A brew left running is forgotten once it is well
     * past its time.
     */
    static boolean brewing(Context ctx, RemoteViews v, int h) {
        SharedPreferences p = BrewWidget.prefs(ctx);
        String st = p.getString("t_state", "stop");
        long now = System.currentTimeMillis(), at = p.getLong("t_at", 0L), total = p.getLong("t_total", 0L);
        if ("stop".equals(st)) return false;
        if ("done".equals(st) && now - at > 15 * 60000L) return false;
        if (("run".equals(st) || "pause".equals(st)) && now - at > total + 20 * 60000L) return false;
        boolean run = "run".equals(st), done = "done".equals(st);
        v.setViewVisibility(R.id.q_stats, View.GONE);
        v.setViewVisibility(R.id.q_run, View.VISIBLE);
        v.setTextViewText(R.id.q_kicker, run ? "Brewing now" : done ? "Brew complete" : "Paused");
        v.setTextViewText(R.id.q_brewer, "");
        v.setTextViewText(R.id.q_title, p.getString("t_name", ""));
        v.setViewVisibility(R.id.q_chrono, done ? View.GONE : View.VISIBLE);
        long el = run ? now - p.getLong("t_start", now) : p.getLong("t_el", 0L);
        v.setChronometer(R.id.q_chrono, SystemClock.elapsedRealtime() - el, null, run);
        v.setTextViewText(R.id.q_line, done ? "Enjoy it. How was it?" : p.getString("t_step", ""));
        String next = done ? "" : p.getString("t_next", "");
        v.setTextViewText(R.id.q_next, next);
        v.setViewVisibility(R.id.q_next, next.isEmpty() || h < 160 ? View.GONE : View.VISIBLE);
        v.setViewVisibility(R.id.q_go, h < 130 ? View.GONE : View.VISIBLE);
        v.setTextViewText(R.id.q_go, done ? "Log brew" : "Open the timer");
        v.setOnClickPendingIntent(R.id.q_root, BrewWidget.open(ctx, "resume", 22));
        v.setOnClickPendingIntent(R.id.q_go, BrewWidget.open(ctx, done ? "log" : "resume", 23));
        return true;
    }

    static RemoteViews views(Context ctx, int h) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_brew);
        boolean small = h < 130;
        v.setViewVisibility(R.id.q_kicker, View.VISIBLE);
        if (brewing(ctx, v, h)) return v;
        v.setViewVisibility(R.id.q_run, View.GONE);
        v.setTextViewText(R.id.q_kicker, ctx.getString(R.string.widget_brew_name));
        JSONObject o;
        try { o = new JSONObject(BrewWidget.prefs(ctx).getString("brew", "{}")); } catch (Exception e) { o = new JSONObject(); }
        String key = o.optString("key", "");
        if (key.isEmpty()) {
            v.setViewVisibility(R.id.q_stats, View.GONE);
            v.setViewVisibility(R.id.q_run, View.VISIBLE);
            v.setViewVisibility(R.id.q_chrono, View.GONE);
            v.setViewVisibility(R.id.q_next, View.GONE);
            v.setTextViewText(R.id.q_brewer, "");
            v.setTextViewText(R.id.q_title, "Pick a recipe");
            v.setTextViewText(R.id.q_line, "Your go-to recipe shows here once you've brewed one.");
            v.setTextViewText(R.id.q_go, "Recipes");
            v.setViewVisibility(R.id.q_go, small ? View.GONE : View.VISIBLE);
            v.setOnClickPendingIntent(R.id.q_root, BrewWidget.open(ctx, "recipes", 20));
            v.setOnClickPendingIntent(R.id.q_go, BrewWidget.open(ctx, "recipes", 21));
            return v;
        }
        v.setTextViewText(R.id.q_title, o.optString("name", ""));
        v.setTextViewText(R.id.q_brewer, o.optString("brewer", ""));
        String[] vals = {o.optString("dose", ""), o.optString("water", ""), o.optString("temp", "")};
        String[] labs = {"Coffee", "Water", "Water temp"};
        for (int i = 0; i < 3; i++) { v.setTextViewText(VALS[i], vals[i].isEmpty() ? "–" : vals[i]); v.setTextViewText(LABS[i], labs[i]); }
        if (small) {
            // Short: the numbers go on one line under the name, and the whole widget starts the timer.
            v.setViewVisibility(R.id.q_stats, View.GONE);
            v.setViewVisibility(R.id.q_run, View.VISIBLE);
            v.setViewVisibility(R.id.q_chrono, View.GONE);
            v.setViewVisibility(R.id.q_next, View.GONE);
            v.setTextViewText(R.id.q_line, o.optString("line", ""));
            v.setViewVisibility(R.id.q_go, View.GONE);
            v.setOnClickPendingIntent(R.id.q_root, BrewWidget.open(ctx, "timer:" + key, 20));
            return v;
        }
        // With room, the coffee you're drinking now sits under the recipe.
        JSONObject bean = o.optJSONObject("bean");
        if (bean != null && h >= 170 && !bean.optString("title", "").isEmpty()) {
            v.setViewVisibility(R.id.q_bean, View.VISIBLE);
            v.setTextViewText(R.id.q_btx, "With " + bean.optString("title", ""));
            android.graphics.Bitmap ph = BrewWidget.thumb(ctx, bean.optString("id", ""), bean.optString("ph", ""), 26, 7);
            if (ph != null) { v.setImageViewBitmap(R.id.q_bph, ph); v.setViewVisibility(R.id.q_bph, View.VISIBLE); v.setTextViewText(R.id.q_bflag, ""); }
            else { v.setViewVisibility(R.id.q_bph, View.GONE); String f = bean.optString("flag", ""); v.setTextViewText(R.id.q_bflag, f.isEmpty() ? "☕" : f); }
        } else v.setViewVisibility(R.id.q_bean, View.GONE);
        v.setViewVisibility(R.id.q_stats, View.VISIBLE);
        v.setViewVisibility(R.id.q_go, View.VISIBLE);
        v.setTextViewText(R.id.q_go, "Start timer");
        v.setOnClickPendingIntent(R.id.q_root, BrewWidget.open(ctx, "recipe:" + key, 20));
        v.setOnClickPendingIntent(R.id.q_go, BrewWidget.open(ctx, "timer:" + key, 21));
        return v;
    }
}
