package io.github.maheralshokry.brewbench;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * "Quick brew": your go-to recipe (the one you've brewed most lately), its dose, water and temperature in large type,
 * and Start brew, which starts the brew right on the home screen (with its notification). While a brew runs it follows the brew instead (see brewing).
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
     * so it ticks without the app), the step now and the next one, how far through it is, and buttons to pause or resume
     * and to skip to the next step (BrewTimer runs them, app open or not). A brew left running is forgotten once it is
     * well past its time.
     */
    static boolean brewing(Context ctx, RemoteViews v, int h) {
        long now = System.currentTimeMillis();
        BrewTimer.St s = BrewTimer.read(ctx);
        boolean done = s.showDone(now);
        if (!s.live(now) && !done) return false;
        boolean run = "run".equals(s.state);
        long el = s.elapsed(now);
        v.setViewVisibility(R.id.q_stats, View.GONE);
        v.setViewVisibility(R.id.q_bean, View.GONE);
        v.setViewVisibility(R.id.q_run, View.VISIBLE);
        v.setTextViewText(R.id.q_kicker, run ? "Brewing now" : done ? "Brew complete" : "Paused");
        v.setTextViewText(R.id.q_brewer, "");
        v.setTextViewText(R.id.q_title, s.name);
        v.setViewVisibility(R.id.q_chrono, done ? View.GONE : View.VISIBLE);
        v.setChronometer(R.id.q_chrono, SystemClock.elapsedRealtime() - el, null, run);
        v.setTextViewText(R.id.q_line, done ? "Enjoy it. How was it?" : s.step);
        String next = done ? "" : s.next;
        v.setTextViewText(R.id.q_next, next);
        v.setViewVisibility(R.id.q_next, next.isEmpty() || h < 170 ? View.GONE : View.VISIBLE);
        boolean room = h >= 130;
        if (room && !done && s.total > 0) {
            v.setViewVisibility(R.id.q_prog, View.VISIBLE);
            v.setProgressBar(R.id.q_prog, 1000, (int) Math.min(1000, el * 1000 / s.total), false);
        } else v.setViewVisibility(R.id.q_prog, View.GONE);
        if (room && !done) {
            v.setViewVisibility(R.id.q_go, View.GONE);
            v.setViewVisibility(R.id.q_ctl, View.VISIBLE);
            v.setTextViewText(R.id.q_pp, run ? "Pause" : "Resume");
            v.setTextViewCompoundDrawablesRelative(R.id.q_pp, run ? R.drawable.wic_pause : R.drawable.wic_play, 0, 0, 0);
            v.setOnClickPendingIntent(R.id.q_pp, BrewTimer.action(ctx, BrewTimer.TOGGLE, 50));
            v.setViewVisibility(R.id.q_nx, s.t.length > 0 ? View.VISIBLE : View.GONE);
            v.setTextViewCompoundDrawablesRelative(R.id.q_nx, R.drawable.wic_next, 0, 0, 0);
            v.setOnClickPendingIntent(R.id.q_nx, BrewTimer.action(ctx, BrewTimer.NEXT, 51));
        } else {
            v.setViewVisibility(R.id.q_ctl, View.GONE);
            v.setViewVisibility(R.id.q_go, room ? View.VISIBLE : View.GONE);
            v.setTextViewText(R.id.q_go, "Log this brew");
            v.setTextViewCompoundDrawablesRelative(R.id.q_go, 0, 0, 0, 0);
            v.setOnClickPendingIntent(R.id.q_go, BrewWidget.open(ctx, "log", 23));
        }
        v.setOnClickPendingIntent(R.id.q_root, BrewWidget.open(ctx, "resume", 22));
        return true;
    }

    static RemoteViews views(Context ctx, int h) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_brew);
        boolean small = h < 130;
        v.setViewVisibility(R.id.q_kicker, View.VISIBLE);
        v.setViewVisibility(R.id.q_ctl, View.GONE);
        v.setViewVisibility(R.id.q_prog, View.GONE);
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
        v.setTextViewText(R.id.q_go, "Start brew");
        v.setTextViewCompoundDrawablesRelative(R.id.q_go, R.drawable.wic_play, 0, 0, 0);
        v.setOnClickPendingIntent(R.id.q_root, BrewWidget.open(ctx, "recipe:" + key, 20));
        // Starts the brew from here: the clock, the notification and the buttons run without opening the app (which
        // opens on the timer instead if it hasn't sent this recipe's steps yet).
        JSONArray steps = o.optJSONArray("steps");
        v.setOnClickPendingIntent(R.id.q_go, steps != null && steps.length() > 0 && o.optLong("total", 0L) > 0 ? BrewTimer.action(ctx, BrewTimer.START, 21) : BrewWidget.open(ctx, "timer:" + key, 21));
        return v;
    }
}
