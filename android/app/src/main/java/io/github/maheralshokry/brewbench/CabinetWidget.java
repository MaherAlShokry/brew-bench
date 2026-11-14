package io.github.maheralshokry.brewbench;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * "Your cabinet": the coffees on your shelf, most recently brewed first, as many as the widget's height holds (and how
 * many more). Each row has a dot in its freshness colour, the coffee's name and today's day off roast and cups left,
 * and opens that coffee; its cup button logs a brew with it. The heading opens the Beans page.
 */
public class CabinetWidget extends AppWidgetProvider {
    static final int[] ROWS = {R.id.c_row0, R.id.c_row1, R.id.c_row2, R.id.c_row3, R.id.c_row4, R.id.c_row5};
    static final int[] DOTS = {R.id.c_d0, R.id.c_d1, R.id.c_d2, R.id.c_d3, R.id.c_d4, R.id.c_d5};
    static final int[] TITLES = {R.id.c_t0, R.id.c_t1, R.id.c_t2, R.id.c_t3, R.id.c_t4, R.id.c_t5};
    static final int[] LINES = {R.id.c_f0, R.id.c_f1, R.id.c_f2, R.id.c_f3, R.id.c_f4, R.id.c_f5};
    static final int[] PICS = {R.id.c_p0, R.id.c_p1, R.id.c_p2, R.id.c_p3, R.id.c_p4, R.id.c_p5};
    static final int[] FLAGS = {R.id.c_g0, R.id.c_g1, R.id.c_g2, R.id.c_g3, R.id.c_g4, R.id.c_g5};
    static final int[] FRAMES = {R.id.c_fr0, R.id.c_fr1, R.id.c_fr2, R.id.c_fr3, R.id.c_fr4, R.id.c_fr5};
    static final int[] LOGS = {R.id.c_l0, R.id.c_l1, R.id.c_l2, R.id.c_l3, R.id.c_l4, R.id.c_l5};

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
        // Rows of at least 54dp with 6dp between, under a heading of about 18dp, inside 28dp of padding. What doesn't fit is
        // counted in the heading ("+2 more"). The rows shown share the height, their photos and type growing with them;
        // past 96dp a row stops growing and (Android 12+) a "Scan a new bag" tile takes the rest.
        int avail = h - 28 - 18;
        int fit = Math.max(1, Math.min(ROWS.length, avail / 60));
        int shown = Math.min(n, fit);
        int rowH = shown == 0 ? 54 : Math.max(54, avail / shown - 6);
        boolean dyn = Build.VERSION.SDK_INT >= 31, more = dyn && shown > 0 && avail - shown * 102 >= 50;
        rowH = Math.min(rowH, 96);
        int pic = dyn ? Math.max(38, Math.min(64, rowH - 18)) : 38;
        boolean big = rowH >= 76;
        v.setViewVisibility(R.id.c_more, more ? View.VISIBLE : View.GONE);
        if (more) v.setOnClickPendingIntent(R.id.c_more, BrewWidget.open(ctx, "scan", 17));
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
            if (dyn) {
                if (more) v.setViewLayoutHeight(ROWS[i], rowH, TypedValue.COMPLEX_UNIT_DIP);
                v.setViewLayoutWidth(FRAMES[i], pic, TypedValue.COMPLEX_UNIT_DIP);
                v.setViewLayoutHeight(FRAMES[i], pic, TypedValue.COMPLEX_UNIT_DIP);
            }
            v.setTextViewTextSize(FLAGS[i], TypedValue.COMPLEX_UNIT_SP, Math.round(pic * 0.5f));
            v.setTextViewTextSize(TITLES[i], TypedValue.COMPLEX_UNIT_SP, big ? 16 : 14);
            v.setTextViewTextSize(LINES[i], TypedValue.COMPLEX_UNIT_SP, big ? 13 : 12);
            v.setTextViewText(TITLES[i], o.optString("title", ""));
            // Its photo when it has one (a small copy the app sends), else its origin's flag.
            android.graphics.Bitmap ph = BrewWidget.thumb(ctx, o.optString("id", ""), o.optString("ph", ""), 60, 15);
            if (ph != null) { v.setImageViewBitmap(PICS[i], ph); v.setViewVisibility(PICS[i], View.VISIBLE); v.setTextViewText(FLAGS[i], ""); }
            else { v.setViewVisibility(PICS[i], View.GONE); String f = o.optString("flag", ""); v.setTextViewText(FLAGS[i], f.isEmpty() ? "☕" : f); }
            v.setTextViewText(LINES[i], meta);
            v.setImageViewResource(DOTS[i], s < 0 ? R.drawable.wdot_rest : BrewWidget.STAGE_DOT[s]);
            v.setContentDescription(DOTS[i], s < 0 ? "No roast date" : BrewWidget.STAGES[s]);
            v.setOnClickPendingIntent(ROWS[i], BrewWidget.open(ctx, "bean:" + o.optString("id", ""), 11 + i));
            // The cup button logs a brew with this coffee (the app opens on the log, the coffee picked).
            v.setOnClickPendingIntent(LOGS[i], BrewWidget.open(ctx, "log:" + o.optString("id", ""), 60 + i));
        }
        return v;
    }
}
