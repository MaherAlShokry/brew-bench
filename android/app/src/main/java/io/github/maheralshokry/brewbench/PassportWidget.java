package io.github.maheralshokry.brewbench;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.os.Bundle;
import android.widget.RemoteViews;
import org.json.JSONObject;

/**
 * "Coffee passport": the passport's cover on the home screen. The number of origins you've had out of all of them, a gold
 * ring for the share collected, the regions as small bars when there's height for them, and the next origin to try. The
 * app sends {n, total, pct, stamps, regs: [[name, have, all, colour]], next: [flag, name]}. Tapping opens the passport.
 */
public class PassportWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        for (int id : ids) BrewWidget.pushSized(ctx, m, id, PassportWidget::views);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager m, int id, Bundle o) { onUpdate(ctx, m, new int[] {id}); }

    /** For a size given only by its height (a widget picture in a test): a typical width for it. */
    static RemoteViews views(Context ctx, int h) { return views(ctx, 250, h); }

    /** The passport, drawn whole in the shelf card's look (the house colours) by WidgetArt.passport. */
    static RemoteViews views(Context ctx, int w, int h) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_passport);
        JSONObject d = null;
        try { d = new JSONObject(BrewWidget.prefs(ctx).getString("passport", "{}")); } catch (Exception ignored) { }
        ShelfArt.Theme t = ShelfArt.Theme.of(BrewWidget.prefs(ctx).getString("homeTheme", ""));
        try { v.setImageViewBitmap(R.id.pp_art, WidgetArt.passport(ctx, t, d, Math.max(110, w), Math.max(48, h))); } catch (Exception ignored) { }
        int n = d == null ? 0 : d.optInt("n"), total = d == null ? 0 : d.optInt("total");
        v.setContentDescription(R.id.pp_art, total > 0 ? "Coffee passport: " + n + " of " + total + " origins" : "Coffee passport");
        v.setOnClickPendingIntent(R.id.pp_root, BrewWidget.open(ctx, "passport", 31));
        return v;
    }
}
