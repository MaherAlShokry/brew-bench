package io.github.maheralshokry.brewbench;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
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

    /**
     * In the shelf card's look (the house colours, in the style chosen for cards): its background and heading, "Word of
     * the day" with today's date, drawn behind; the word, its meaning and its topic in the card's colours.
     */
    static RemoteViews views(Context ctx, int w, int h) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_word);
        ShelfArt.Theme t = ShelfArt.Theme.of(BrewWidget.prefs(ctx).getString("homeTheme", ""));
        boolean withHead = h >= 100;
        try { v.setImageViewBitmap(R.id.wd_art, ShelfArt.skin(ctx, t, Math.max(80, w), Math.max(48, h), withHead ? "Word of the day" : null,
            new SimpleDateFormat("EEE d MMM", Locale.getDefault()).format(new Date()))); } catch (Exception ignored) { }
        ShelfArt.underHead(ctx, v, R.id.wd_in, withHead, 16, 14);
        v.setTextColor(R.id.wd_word, t.ink);
        v.setTextColor(R.id.wd_text, t.muted());
        v.setTextColor(R.id.wd_cat, t.ink);
        v.setTextColor(R.id.wd_more, ShelfArt.onAcc(t));
        v.setTextColor(R.id.wd_mark, ShelfArt.a(t.ink, .07f));
        ShelfArt.tint(v, R.id.wd_chip, t.chip());
        ShelfArt.tint(v, R.id.wd_more, t.acc);
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
        boolean small = h < 130;
        v.setViewVisibility(R.id.wd_rule, small ? View.GONE : View.VISIBLE);
        v.setViewVisibility(R.id.wd_foot, small || cat.isEmpty() && word.isEmpty() ? View.GONE : View.VISIBLE);
        int col = catColor(cat);
        v.setInt(R.id.wd_dot, "setColorFilter", col);
        v.setInt(R.id.wd_rule, "setColorFilter", col);
        v.setTextViewText(R.id.wd_mark, word.isEmpty() ? "" : word.substring(0, 1).toUpperCase(Locale.ROOT));
        v.setViewVisibility(R.id.wd_mark, h < 120 ? View.GONE : View.VISIBLE);
        // As many lines of the meaning as the height holds, the rest ending in an ellipsis.
        int lines = Math.max(1, (h - (small ? 64 : 150)) / 20);
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
