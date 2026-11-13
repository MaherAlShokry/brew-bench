package io.github.maheralshokry.brewbench;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;
import org.json.JSONArray;

/**
 * "Coffee word of the day": the same word as Today in coffee on Explore. The app sends the coming weeks' words
 * ([day number, word, meaning]); the widget shows the one for today, so it changes each day on its own. Tapping opens
 * the word in full.
 */
public class WordWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        for (int id : ids) m.updateAppWidget(id, views(ctx));
    }

    static RemoteViews views(Context ctx) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_word);
        String word = "", text = "";
        try {
            JSONArray list = new JSONArray(BrewWidget.prefs(ctx).getString("words", "[]"));
            // The day number as the app counts it: whole days since 1 January 1970 (UTC).
            long today = System.currentTimeMillis() / 86400000L;
            JSONArray pick = null;
            for (int i = 0; i < list.length(); i++) {
                JSONArray w = list.optJSONArray(i);
                if (w == null) continue;
                if (w.optLong(0) <= today) pick = w;
            }
            if (pick == null && list.length() > 0) pick = list.optJSONArray(0);
            if (pick != null) { word = pick.optString(1, ""); text = pick.optString(2, ""); }
        } catch (Exception ignored) { }
        if (word.isEmpty()) {
            v.setTextViewText(R.id.wd_word, "Open Brew Bench");
            v.setTextViewText(R.id.wd_text, "Today's coffee word appears here.");
            v.setOnClickPendingIntent(R.id.wd_root, BrewWidget.open(ctx, "explore", 30));
            return v;
        }
        v.setTextViewText(R.id.wd_word, word);
        v.setTextViewText(R.id.wd_text, text);
        v.setOnClickPendingIntent(R.id.wd_root, BrewWidget.open(ctx, "word:" + word, 30));
        return v;
    }
}
