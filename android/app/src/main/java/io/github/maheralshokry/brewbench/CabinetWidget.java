package io.github.maheralshokry.brewbench;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * "Your cabinet": the coffees on your shelf, most recently brewed first, as many as the widget's height holds (and how
 * many more). Each row has a dot in its freshness colour, the coffee's name and today's day off roast and cups left,
 * and opens that coffee; the heading opens the Beans page.
 */
public class CabinetWidget extends AppWidgetProvider {
    static final int[] ROWS = {R.id.c_row0, R.id.c_row1, R.id.c_row2, R.id.c_row3, R.id.c_row4};
    static final int[] DOTS = {R.id.c_d0, R.id.c_d1, R.id.c_d2, R.id.c_d3, R.id.c_d4};
    static final int[] TITLES = {R.id.c_t0, R.id.c_t1, R.id.c_t2, R.id.c_t3, R.id.c_t4};
    static final int[] LINES = {R.id.c_f0, R.id.c_f1, R.id.c_f2, R.id.c_f3, R.id.c_f4};

    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        for (int id : ids) BrewWidget.push(ctx, m, id, CabinetWidget::views);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager m, int id, Bundle o) { onUpdate(ctx, m, new int[] {id}); }

    static RemoteViews views(Context ctx, int h) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_cabinet);
        JSONArray list;
        try { list = new JSONArray(BrewWidget.prefs(ctx).getString("cabinet", "[]")); } catch (Exception e) { list = new JSONArray(); }
        int n = list.length();
        // Rows of 36dp with 5dp between, under a heading of about 18dp, inside 28dp of padding. What doesn't fit is counted
        // in the heading ("+2 more").
        int fit = Math.max(1, Math.min(ROWS.length, (h - 28 - 18) / 41));
        int shown = Math.min(n, fit);
        v.setTextViewText(R.id.c_count, n == 0 ? "" : n > shown ? "+" + (n - shown) + " more" : n + (n == 1 ? " coffee" : " coffees"));
        v.setOnClickPendingIntent(R.id.c_root, BrewWidget.open(ctx, "beans", 10));
        v.setViewVisibility(R.id.c_empty, n == 0 ? View.VISIBLE : View.GONE);
        v.setViewVisibility(R.id.c_rows, n == 0 ? View.GONE : View.VISIBLE);
        for (int i = 0; i < ROWS.length; i++) {
            JSONObject o = i < shown ? list.optJSONObject(i) : null;
            if (o == null) { v.setViewVisibility(ROWS[i], View.GONE); continue; }
            int[] w = BrewWidget.window(o.optString("win", ""));
            int d = BrewWidget.daysSince(o.optString("roastDate", "")), s = BrewWidget.stage(d, w);
            String left = o.optString("cups", "");
            String meta = s < 0 ? left : BrewWidget.countdown(d, w) + (left.isEmpty() ? "" : " · " + left);
            v.setViewVisibility(ROWS[i], View.VISIBLE);
            v.setTextViewText(TITLES[i], o.optString("title", ""));
            v.setTextViewText(LINES[i], meta);
            v.setImageViewResource(DOTS[i], s < 0 ? R.drawable.wdot_rest : BrewWidget.STAGE_DOT[s]);
            v.setContentDescription(DOTS[i], s < 0 ? "No roast date" : BrewWidget.STAGES[s]);
            v.setOnClickPendingIntent(ROWS[i], BrewWidget.open(ctx, "bean:" + o.optString("id", ""), 11 + i));
        }
        v.setViewVisibility(R.id.c_more, View.GONE);
        return v;
    }
}
