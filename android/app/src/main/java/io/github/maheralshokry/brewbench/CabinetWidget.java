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
 * "Your shelf": the bags on your shelf drawn like the shelf share card (ShelfArt.shelf), in its order, at the widget's
 * size: as many rows as its height holds, the rest counted in the heading. Each row opens its coffee; its round log
 * button logs a brew with it. The heading opens Beans.
 */
public class CabinetWidget extends AppWidgetProvider {
    static final int[] ROWS = {R.id.c_row0, R.id.c_row1, R.id.c_row2, R.id.c_row3, R.id.c_row4, R.id.c_row5};
    static final int[] HITS = {R.id.c_h0, R.id.c_h1, R.id.c_h2, R.id.c_h3, R.id.c_h4, R.id.c_h5};
    static final int[] LOGS = {R.id.c_l0, R.id.c_l1, R.id.c_l2, R.id.c_l3, R.id.c_l4, R.id.c_l5};
    static final int[] SPACERS = {R.id.c_sp0, R.id.c_sp1, R.id.c_sp2};

    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        for (int id : ids) BrewWidget.pushSized(ctx, m, id, CabinetWidget::views);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager m, int id, Bundle o) { onUpdate(ctx, m, new int[] {id}); }

    /** For a size given only by its height (a widget picture in a test): a typical width for it. */
    static RemoteViews views(Context ctx, int h) { return views(ctx, 250, h); }

    static RemoteViews views(Context ctx, int w, int h) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_cabinet);
        android.content.SharedPreferences p = BrewWidget.prefs(ctx);
        JSONArray list;
        try { list = new JSONArray(p.getString("cabinet", "[]")); } catch (Exception e) { list = new JSONArray(); }
        int n = list.length();
        ShelfArt.Bag[] bags = new ShelfArt.Bag[n];
        for (int i = 0; i < n; i++) { JSONObject o = list.optJSONObject(i); bags[i] = ShelfArt.Bag.of(o == null ? new JSONObject() : o); }
        int[] stats = null;
        try {
            JSONObject st = new JSONObject(p.getString("shelfStats", "{}"));
            if (st.has("bags")) stats = new int[] {st.optInt("bags", n), st.optInt("ros", 0), st.optInt("ors", 0)};
        } catch (Exception ignored) { }
        if (stats == null) stats = new int[] {n, 0, 0};
        float fw = Math.max(110, w), fh = Math.max(60, h);
        ShelfArt.Theme t = ShelfArt.Theme.of(p.getString("shelfTheme", ""));
        try { v.setImageViewBitmap(R.id.c_art, ShelfArt.shelf(ctx, t, bags, stats, fw, fh)); } catch (Exception ignored) { }
        v.setContentDescription(R.id.c_art, n == 0 ? "Your shelf: nothing yet" : "Your shelf: " + n + (n == 1 ? " bag" : " bags"));
        // The tap areas, laid where the picture's rows are: the heading's spacer for this height, then the rows.
        int tier = ShelfArt.tier(fh);
        for (int i = 0; i < SPACERS.length; i++) v.setViewVisibility(SPACERS[i], i == tier ? View.VISIBLE : View.GONE);
        int shown = Math.min(n, ShelfArt.fits(fh - ShelfArt.PAD - ShelfArt.rowsTop(tier)));
        v.setOnClickPendingIntent(R.id.c_root, BrewWidget.open(ctx, "beans", 10));
        for (int i = 0; i < ROWS.length; i++) {
            if (i >= shown) { v.setViewVisibility(ROWS[i], View.GONE); continue; }
            String id = bags[i].id;
            v.setViewVisibility(ROWS[i], View.VISIBLE);
            v.setContentDescription(HITS[i], bags[i].title);
            v.setOnClickPendingIntent(HITS[i], BrewWidget.open(ctx, "bean:" + id, 11 + i));
            v.setOnClickPendingIntent(LOGS[i], BrewWidget.open(ctx, "log:" + id, 60 + i));
        }
        return v;
    }
}
