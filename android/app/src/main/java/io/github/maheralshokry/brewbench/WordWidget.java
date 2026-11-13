package io.github.maheralshokry.brewbench;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;

/**
 * "Coffee word of the day": the same word as Today in coffee on Explore, its meaning filling the space it has, and the
 * part of coffee it belongs to. The app sends the coming weeks' words ([day number, word, meaning, category]); the
 * widget shows the one for today, so it changes each day on its own. Tapping opens the word in full.
 */
public class WordWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        for (int id : ids) BrewWidget.push(ctx, m, id, WordWidget::views);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager m, int id, Bundle o) { onUpdate(ctx, m, new int[] {id}); }

    static RemoteViews views(Context ctx, int h) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_word);
        String word = "", text = "", cat = "";
        try {
            JSONArray list = new JSONArray(BrewWidget.prefs(ctx).getString("words", "[]"));
            // The day number as the app counts it: whole days since 1 January 1970 (UTC).
            long today = System.currentTimeMillis() / 86400000L;
            JSONArray pick = null;
            for (int i = 0; i < list.length(); i++) { JSONArray w = list.optJSONArray(i); if (w != null && w.optLong(0) <= today) pick = w; }
            if (pick == null && list.length() > 0) pick = list.optJSONArray(0);
            if (pick != null) { word = pick.optString(1, ""); text = pick.optString(2, ""); cat = pick.optString(3, ""); }
        } catch (Exception ignored) { }
        boolean small = h < 130;
        v.setViewVisibility(R.id.wd_kicker, h < 100 ? View.GONE : View.VISIBLE);
        v.setViewVisibility(R.id.wd_foot, small || cat.isEmpty() && word.isEmpty() ? View.GONE : View.VISIBLE);
        // As many lines of the meaning as the height holds, the rest ending in an ellipsis.
        int lines = Math.max(1, (h - (small ? 64 : 112)) / 20);
        v.setInt(R.id.wd_text, "setMaxLines", lines);
        if (word.isEmpty()) {
            v.setTextViewText(R.id.wd_word, "Open Brew Bench");
            v.setTextViewText(R.id.wd_text, "Today's coffee word appears here.");
            v.setViewVisibility(R.id.wd_foot, View.GONE);
            v.setOnClickPendingIntent(R.id.wd_root, BrewWidget.open(ctx, "explore", 30));
            return v;
        }
        v.setTextViewText(R.id.wd_word, word);
        v.setTextViewText(R.id.wd_text, text);
        v.setTextViewText(R.id.wd_cat, cat.isEmpty() ? "Coffee words" : cat);
        v.setOnClickPendingIntent(R.id.wd_root, BrewWidget.open(ctx, "word:" + word, 30));
        return v;
    }
}
