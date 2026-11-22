package io.github.maheralshokry.brewbench;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * "Quick brew": your go-to recipe (the one you've brewed most lately), its dose, water and temperature, and Start brew,
 * which starts the brew right on the home screen (with its notification). While a brew runs it follows the brew: the
 * step now and next, how far through it is, and pause or resume and next. Drawn whole in the shelf card's look
 * (WidgetArt.quick), in the colours of the coffee you're drinking; the running clock is a live view over the picture.
 */
public class QuickBrewWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        for (int id : ids) BrewWidget.pushSized(ctx, m, id, QuickBrewWidget::views);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager m, int id, Bundle o) { onUpdate(ctx, m, new int[] {id}); }

    /** For a size given only by its height (a widget picture in a test): a typical width for it. */
    static RemoteViews views(Context ctx, int h) { return views(ctx, 250, h); }

    static RemoteViews views(Context ctx, int w, int h) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_brew);
        WidgetArt.Quick q = new WidgetArt.Quick();
        long now = System.currentTimeMillis();
        BrewTimer.St s = BrewTimer.read(ctx);
        boolean done = s.showDone(now);
        long el = 0;
        String goTo = "recipes", key = "";
        boolean startHere = false;
        if (s.live(now) || done) {
            // A brew under way (or just finished): its recipe's name in the heading, the step now and next.
            q.brewing = true;
            q.done = done;
            q.run = "run".equals(s.state);
            el = s.elapsed(now);
            q.label = q.run ? "Brewing now" : done ? "Brew complete" : "Paused";
            q.right = s.name;
            q.name = s.name;
            q.step = s.step;
            q.next = done ? "" : s.next;
            q.hasNext = s.t.length > 0;
            q.frac = s.total > 0 ? Math.min(1f, el / (float) s.total) : 0;
        } else {
            JSONObject o;
            try { o = new JSONObject(BrewWidget.prefs(ctx).getString("brew", "{}")); } catch (Exception e) { o = new JSONObject(); }
            key = o.optString("key", "");
            if (key.isEmpty()) {
                q.empty = true;
                q.name = "Pick a recipe";
                q.line = "Your go-to recipe shows here once you've brewed one.";
            } else {
                q.name = o.optString("name", "");
                q.right = o.optString("brewer", "");
                q.line = o.optString("line", "");
                q.vals = new String[] {o.optString("dose", ""), o.optString("water", ""), o.optString("temp", "")};
                JSONObject bean = o.optJSONObject("bean");
                if (bean != null) { q.beanTitle = bean.optString("title", ""); q.beanPhoto = bean.optString("ph", ""); }
                JSONArray steps = o.optJSONArray("steps");
                startHere = steps != null && steps.length() > 0 && o.optLong("total", 0L) > 0;
            }
        }
        ShelfArt.Theme t = ShelfArt.Theme.of(BrewWidget.prefs(ctx).getString("theme", ""));
        WidgetArt.Places at = new WidgetArt.Places();
        float fw = Math.max(110, w), fh = Math.max(48, h);
        try { v.setImageViewBitmap(R.id.q_art, WidgetArt.quick(ctx, t, q, fw, fh, at)); } catch (Exception ignored) { }
        v.setContentDescription(R.id.q_art, q.brewing ? q.label + ": " + q.name + ". " + q.step : "Quick brew: " + q.name);
        // The clock, where the picture left room for it.
        v.setViewVisibility(R.id.q_chrono, at.clock ? View.VISIBLE : View.GONE);
        if (at.clock) {
            v.setViewPadding(R.id.q_clkbox, BrewWidget.dp(ctx, Math.round(at.clockLeft)), BrewWidget.dp(ctx, Math.round(at.clockTop)), 0, 0);
            v.setTextViewTextSize(R.id.q_chrono, TypedValue.COMPLEX_UNIT_DIP, at.clockSize);
            v.setTextColor(R.id.q_chrono, t.ink);
            v.setChronometer(R.id.q_chrono, SystemClock.elapsedRealtime() - el, null, q.run);
        }
        // The tap areas on the drawn buttons.
        v.setViewVisibility(R.id.q_ctl, at.twoButtons ? View.VISIBLE : View.GONE);
        v.setViewVisibility(R.id.q_go, at.button ? View.VISIBLE : View.GONE);
        if (q.brewing) {
            v.setOnClickPendingIntent(R.id.q_root, BrewWidget.open(ctx, "resume", 22));
            v.setOnClickPendingIntent(R.id.q_pp, BrewTimer.action(ctx, BrewTimer.TOGGLE, 50));
            v.setOnClickPendingIntent(R.id.q_nx, q.hasNext ? BrewTimer.action(ctx, BrewTimer.NEXT, 51) : BrewWidget.open(ctx, "resume", 22));
            v.setOnClickPendingIntent(R.id.q_go, BrewWidget.open(ctx, "log", 23));
        } else if (q.empty) {
            v.setOnClickPendingIntent(R.id.q_root, BrewWidget.open(ctx, goTo, 20));
            v.setOnClickPendingIntent(R.id.q_go, BrewWidget.open(ctx, goTo, 21));
        } else {
            v.setOnClickPendingIntent(R.id.q_root, BrewWidget.open(ctx, at.button ? "recipe:" + key : "timer:" + key, 20));
            // Starts the brew from here: the clock, the notification and the buttons run without opening the app (which
            // opens on the timer instead if it hasn't sent this recipe's steps yet).
            v.setOnClickPendingIntent(R.id.q_go, startHere ? BrewTimer.action(ctx, BrewTimer.START, 21) : BrewWidget.open(ctx, "timer:" + key, 21));
        }
        return v;
    }
}
