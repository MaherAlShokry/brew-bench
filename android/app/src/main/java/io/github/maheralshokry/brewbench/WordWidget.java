package io.github.maheralshokry.brewbench;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.os.Bundle;
import android.widget.RemoteViews;
import org.json.JSONArray;

/**
 * "Coffee word of the day": the same word as Today in coffee on Explore, its meaning filling the space it has, and the
 * part of coffee it belongs to. The app sends the coming weeks' words ([day number, word, meaning, category]); the
 * widget shows the one for today, so it changes each day on its own. Tapping opens the word in full.
 * Laid out like a dictionary entry: today's date, the word in a serif face over a short rule in the colour of its part
 * of coffee (the same colours as Coffee words in the app), and its first letter large and faint in the corner.
 */
public class WordWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        for (int id : ids) BrewWidget.pushSized(ctx, m, id, WordWidget::views);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager m, int id, Bundle o) { onUpdate(ctx, m, new int[] {id}); }

    /** For a size given only by its height (a widget picture in a test): a typical width for it. */
    static RemoteViews views(Context ctx, int h) { return views(ctx, 250, h); }

    /** Today's word, drawn whole in the shelf card's look (the house colours) by WidgetArt.word. */
    static RemoteViews views(Context ctx, int w, int h) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_word);
        String word = "", text = "", cat = "";
        try {
            JSONArray list = new JSONArray(BrewWidget.prefs(ctx).getString("words", "[]"));
            // The day number as the app counts it: whole days since 1 January 1970 (UTC).
            long today = System.currentTimeMillis() / 86400000L;
            JSONArray pick = null;
            for (int i = 0; i < list.length(); i++) { JSONArray e = list.optJSONArray(i); if (e != null && e.optLong(0) <= today) pick = e; }
            if (pick == null && list.length() > 0) pick = list.optJSONArray(0);
            if (pick != null) { word = pick.optString(1, ""); text = pick.optString(2, ""); cat = pick.optString(3, ""); }
        } catch (Exception ignored) { }
        ShelfArt.Theme t = ShelfArt.Theme.of(BrewWidget.prefs(ctx).getString("homeTheme", ""));
        try { v.setImageViewBitmap(R.id.wd_art, WidgetArt.word(ctx, t, word, text, cat, catColor(cat), Math.max(110, w), Math.max(48, h))); } catch (Exception ignored) { }
        v.setContentDescription(R.id.wd_art, word.isEmpty() ? "Coffee word of the day" : "Word of the day: " + word + ". " + text);
        v.setOnClickPendingIntent(R.id.wd_root, BrewWidget.open(ctx, word.isEmpty() ? "explore" : "word:" + word, 30));
        return v;
    }

    /** The colour of a word's part of coffee, from the app's modern palette (as its fact cards); caramel for anything else. */
    static int catColor(String cat) {
        switch (cat) {
            case "The plant and farm": return 0xFF22C55E;
            case "Harvest and processing": return 0xFFF59E0B;
            case "Green coffee and trade": return 0xFF14B8A6;
            case "Roasting": return 0xFFF43F5E;
            case "Tasting and quality": return 0xFF8B5CF6;
            default: return 0xFFD2793A;
        }
    }
}
