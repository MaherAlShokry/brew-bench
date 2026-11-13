package io.github.maheralshokry.brewbench;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * "Your cabinet": the coffees on your shelf (up to four, most recently brewed first), each with how fresh it is today
 * and how much is left. Each row opens its coffee; the heading opens the Beans page. The freshness is worked out here
 * each day from the roast date and window the app sent (see BrewWidget.freshLine).
 */
public class CabinetWidget extends AppWidgetProvider {
    static final int[] ROWS = {R.id.c_row0, R.id.c_row1, R.id.c_row2, R.id.c_row3};
    static final int[] TITLES = {R.id.c_t0, R.id.c_t1, R.id.c_t2, R.id.c_t3};
    static final int[] LINES = {R.id.c_f0, R.id.c_f1, R.id.c_f2, R.id.c_f3};

    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        for (int id : ids) m.updateAppWidget(id, views(ctx));
    }

    static RemoteViews views(Context ctx) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_cabinet);
        JSONArray list;
        try { list = new JSONArray(BrewWidget.prefs(ctx).getString("cabinet", "[]")); } catch (Exception e) { list = new JSONArray(); }
        int n = list.length();
        v.setTextViewText(R.id.c_count, n == 0 ? "" : n + (n == 1 ? " coffee" : " coffees"));
        v.setOnClickPendingIntent(R.id.c_head, BrewWidget.open(ctx, "beans", 10));
        v.setViewVisibility(R.id.c_empty, n == 0 ? View.VISIBLE : View.GONE);
        v.setOnClickPendingIntent(R.id.c_empty, BrewWidget.open(ctx, "beans", 10));
        for (int i = 0; i < ROWS.length; i++) {
            JSONObject o = i < n ? list.optJSONObject(i) : null;
            if (o == null) { v.setViewVisibility(ROWS[i], View.GONE); continue; }
            String fresh = BrewWidget.freshLine(o.optString("roastDate", ""), o.optString("win", "")), left = o.optString("left", "");
            String line = fresh.isEmpty() ? left : left.isEmpty() ? fresh : fresh + " · " + left;
            v.setViewVisibility(ROWS[i], View.VISIBLE);
            v.setTextViewText(TITLES[i], o.optString("title", ""));
            v.setTextViewText(LINES[i], line.isEmpty() ? "Add its roast date for freshness" : line);
            v.setOnClickPendingIntent(ROWS[i], BrewWidget.open(ctx, "bean:" + o.optString("id", ""), 11 + i));
        }
        return v;
    }
}
