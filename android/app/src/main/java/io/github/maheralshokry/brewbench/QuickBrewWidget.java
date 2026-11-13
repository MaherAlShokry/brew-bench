package io.github.maheralshokry.brewbench;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;
import org.json.JSONObject;

/**
 * "Quick brew": your go-to recipe (the one you've brewed most lately) with its numbers, and Start timer, which opens
 * the brew timer on it. Tapping the rest opens the recipe.
 */
public class QuickBrewWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        for (int id : ids) m.updateAppWidget(id, views(ctx));
    }

    static RemoteViews views(Context ctx) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_brew);
        JSONObject o;
        try { o = new JSONObject(BrewWidget.prefs(ctx).getString("brew", "{}")); } catch (Exception e) { o = new JSONObject(); }
        String key = o.optString("key", "");
        if (key.isEmpty()) {
            v.setTextViewText(R.id.q_title, "Pick a recipe");
            v.setTextViewText(R.id.q_line, "Your go-to recipe shows here once you've brewed one");
            v.setTextViewText(R.id.q_go, "Recipes");
            v.setOnClickPendingIntent(R.id.q_root, BrewWidget.open(ctx, "recipes", 20));
            v.setOnClickPendingIntent(R.id.q_go, BrewWidget.open(ctx, "recipes", 21));
            return v;
        }
        v.setTextViewText(R.id.q_title, o.optString("name", ""));
        v.setTextViewText(R.id.q_line, o.optString("line", ""));
        v.setTextViewText(R.id.q_go, "Start timer");
        v.setOnClickPendingIntent(R.id.q_root, BrewWidget.open(ctx, "recipe:" + key, 20));
        v.setOnClickPendingIntent(R.id.q_go, BrewWidget.open(ctx, "timer:" + key, 21));
        return v;
    }
}
