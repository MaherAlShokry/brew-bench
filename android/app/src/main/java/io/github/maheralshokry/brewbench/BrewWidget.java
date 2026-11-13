package io.github.maheralshokry.brewbench;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;
import java.util.Calendar;
import java.util.TimeZone;

/**
 * The home-screen widget: the coffee you're drinking (the cabinet coffee you brewed most recently), how fresh it is
 * today, and a Log brew button. The app sends the coffee with WidgetPlugin.update(); the freshness is worked out here
 * from its roast date and window, so the widget moves on to the next stretch each day without the app being opened.
 * Tapping the widget opens that coffee; Log brew opens the brew form with it.
 */
public class BrewWidget extends AppWidgetProvider {
    static final String PREFS = "brew_widget";

    static SharedPreferences prefs(Context ctx) { return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    /** Redraws every Brew Bench widget on the home screen. */
    static void refresh(Context ctx) {
        AppWidgetManager m = AppWidgetManager.getInstance(ctx);
        int[] ids = m.getAppWidgetIds(new ComponentName(ctx, BrewWidget.class));
        if (ids != null && ids.length > 0) new BrewWidget().onUpdate(ctx, m, ids);
    }

    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        for (int id : ids) m.updateAppWidget(id, views(ctx));
    }

    /** Days from the roast date (yyyy-mm-dd) to today, or -1 when there's no date. */
    static int daysSince(String iso) {
        if (iso == null || iso.length() < 10) return -1;
        try {
            Calendar r = Calendar.getInstance(TimeZone.getDefault());
            r.clear();
            r.set(Integer.parseInt(iso.substring(0, 4)), Integer.parseInt(iso.substring(5, 7)) - 1, Integer.parseInt(iso.substring(8, 10)), 12, 0);
            Calendar now = Calendar.getInstance(TimeZone.getDefault());
            Calendar t = (Calendar) now.clone();
            t.set(Calendar.HOUR_OF_DAY, 12); t.set(Calendar.MINUTE, 0); t.set(Calendar.SECOND, 0); t.set(Calendar.MILLISECOND, 0);
            return (int) Math.round((t.getTimeInMillis() - r.getTimeInMillis()) / 86400000.0);
        } catch (Exception e) { return -1; }
    }

    /** The day's stretch, as the app names it: Resting, At its peak, Still lovely, Fading. */
    static String freshLine(String roastDate, String win) {
        int d = daysSince(roastDate);
        if (d < 0) return "";
        int[] w = {7, 30, 60};
        try { String[] p = win.split(","); if (p.length == 3) for (int i = 0; i < 3; i++) w[i] = Integer.parseInt(p[i].trim()); } catch (Exception ignored) { }
        String k = d < w[0] ? "Resting" : d <= w[1] ? "At its peak" : d <= w[2] ? "Still lovely" : "Fading";
        return k + " · day " + d;
    }

    static PendingIntent open(Context ctx, String what, int code) {
        Intent i = new Intent(ctx, MainActivity.class);
        i.setAction("io.github.maheralshokry.brewbench.WIDGET." + code);
        i.putExtra(WidgetPlugin.EXTRA, what);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(ctx, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static RemoteViews views(Context ctx) {
        SharedPreferences p = prefs(ctx);
        String id = p.getString("id", ""), title = p.getString("title", ""), sub = p.getString("sub", ""), left = p.getString("left", "");
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_bean);
        if (id.isEmpty()) {
            v.setTextViewText(R.id.w_kicker, "Brew Bench");
            v.setTextViewText(R.id.w_title, "Nothing in your cabinet");
            v.setTextViewText(R.id.w_sub, "Add the bag you're drinking");
            v.setViewVisibility(R.id.w_fresh, View.GONE);
            v.setOnClickPendingIntent(R.id.w_root, open(ctx, "beans", 1));
            v.setOnClickPendingIntent(R.id.w_log, open(ctx, "log", 2));
            return v;
        }
        String fresh = freshLine(p.getString("roastDate", ""), p.getString("win", ""));
        String line = fresh.isEmpty() ? left : left.isEmpty() ? fresh : fresh + " · " + left;
        v.setTextViewText(R.id.w_kicker, "Drinking now");
        v.setTextViewText(R.id.w_title, title);
        v.setTextViewText(R.id.w_sub, sub);
        v.setViewVisibility(R.id.w_sub, sub.isEmpty() ? View.GONE : View.VISIBLE);
        v.setTextViewText(R.id.w_fresh, line);
        v.setViewVisibility(R.id.w_fresh, line.isEmpty() ? View.GONE : View.VISIBLE);
        v.setOnClickPendingIntent(R.id.w_root, open(ctx, "bean:" + id, 1));
        v.setOnClickPendingIntent(R.id.w_log, open(ctx, "log:" + id, 2));
        return v;
    }
}
