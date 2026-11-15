package io.github.maheralshokry.brewbench;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * "Coffee passport": the passport's cover on the home screen. The number of origins you've had out of all of them, a gold
 * ring for the share collected, the regions as small bars when there's height for them, and the next origin to try. The
 * app sends {n, total, pct, stamps, regs: [[name, have, all, colour]], next: [flag, name]}. Tapping opens the passport.
 */
public class PassportWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        for (int id : ids) BrewWidget.push(ctx, m, id, PassportWidget::views);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager m, int id, Bundle o) { onUpdate(ctx, m, new int[] {id}); }

    static final int GOLD = 0xFFE2B866, TRACK = 0x1FFFF8EE;
    private static String KEY = null;
    private static Bitmap RING = null, BARS = null;

    /** The ring: a faint full circle with the share collected in gold over it, drawn once at the widget's density. */
    static Bitmap ring(Context ctx, int pct) {
        int s = BrewWidget.dp(ctx, 64);
        Bitmap b = Bitmap.createBitmap(s, s, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        float w = BrewWidget.dp(ctx, 6);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(w); p.setStrokeCap(Paint.Cap.ROUND);
        RectF r = new RectF(w / 2 + 1, w / 2 + 1, s - w / 2 - 1, s - w / 2 - 1);
        p.setColor(TRACK); c.drawOval(r, p);
        if (pct > 0) { p.setColor(GOLD); c.drawArc(r, -90, Math.max(4, pct * 3.6f), false, p); }
        return b;
    }

    /** The regions as two columns of thin bars in their own colours, as wide as the widget is likely to be. */
    static Bitmap bars(Context ctx, JSONArray regs) {
        int w = BrewWidget.dp(ctx, 300), rowH = BrewWidget.dp(ctx, 24), rows = (regs.length() + 1) / 2;
        Bitmap b = Bitmap.createBitmap(w, Math.max(1, rows * rowH), Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        Paint t = new Paint(Paint.ANTI_ALIAS_FLAG); t.setColor(0xB8FFF8EE); t.setTextSize(BrewWidget.dp(ctx, 11));
        Paint n = new Paint(t); n.setColor(0xFFFFF8EE); n.setFakeBoldText(true); n.setTextAlign(Paint.Align.RIGHT);
        Paint bar = new Paint(Paint.ANTI_ALIAS_FLAG);
        int gap = BrewWidget.dp(ctx, 14), colW = (w - gap) / 2, bh = BrewWidget.dp(ctx, 4);
        for (int i = 0; i < regs.length(); i++) {
            JSONArray r = regs.optJSONArray(i); if (r == null) continue;
            int x = (i % 2) * (colW + gap), y = (i / 2) * rowH;
            String name = r.optString(0, ""); int have = r.optInt(1), all = Math.max(1, r.optInt(2, 1));
            c.drawText(name, x, y + BrewWidget.dp(ctx, 11), t);
            c.drawText(have + "/" + all, x + colW, y + BrewWidget.dp(ctx, 11), n);
            float by = y + BrewWidget.dp(ctx, 16);
            bar.setColor(TRACK); c.drawRoundRect(new RectF(x, by, x + colW, by + bh), bh / 2f, bh / 2f, bar);
            int col = GOLD; try { col = Color.parseColor(r.optString(3, "#E2B866")); } catch (Exception ignored) { }
            bar.setColor(col);
            if (have > 0) c.drawRoundRect(new RectF(x, by, x + Math.max(bh, colW * Math.min(1f, have / (float) all)), by + bh), bh / 2f, bh / 2f, bar);
        }
        return b;
    }

    static RemoteViews views(Context ctx, int h) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_passport);
        JSONObject d = null;
        try { d = new JSONObject(BrewWidget.prefs(ctx).getString("passport", "{}")); } catch (Exception ignored) { }
        int n = d == null ? 0 : d.optInt("n"), total = d == null ? 0 : d.optInt("total"), pct = d == null ? 0 : d.optInt("pct");
        v.setTextViewText(R.id.pp_n, String.valueOf(n));
        v.setTextViewText(R.id.pp_of, total > 0 ? "of " + total + " origins" : "origins");
        v.setTextViewText(R.id.pp_pct, pct + "%");
        // The same two pictures for every size the launcher is given (16 layouts): one copy each, shared, not one per size.
        String key = d == null ? "" : d.toString();
        if (!key.equals(KEY)) { KEY = key; RING = ring(ctx, pct); JSONArray rg = d == null ? null : d.optJSONArray("regs"); BARS = rg != null && rg.length() > 0 ? bars(ctx, rg) : null; }
        v.setImageViewBitmap(R.id.pp_ring, RING);
        JSONArray regs = d == null ? null : d.optJSONArray("regs");
        boolean showBars = h >= 170 && regs != null && regs.length() > 0;
        v.setViewVisibility(R.id.pp_bars, showBars ? View.VISIBLE : View.GONE);
        if (showBars && BARS != null) v.setImageViewBitmap(R.id.pp_bars, BARS);
        JSONArray next = d == null ? null : d.optJSONArray("next");
        boolean showNext = h >= 115 && next != null && next.length() > 1;
        v.setViewVisibility(R.id.pp_next, showNext ? View.VISIBLE : View.GONE);
        if (showNext) v.setTextViewText(R.id.pp_next, "Next to discover: " + next.optString(0, "") + " " + next.optString(1, ""));
        v.setViewVisibility(R.id.pp_kicker, h < 80 ? View.GONE : View.VISIBLE);
        if (d == null || total == 0) {
            v.setTextViewText(R.id.pp_of, "Open Brew Bench to start your passport");
            v.setViewVisibility(R.id.pp_next, View.GONE);
        }
        v.setOnClickPendingIntent(R.id.pp_root, BrewWidget.open(ctx, "passport", 31));
        return v;
    }
}
