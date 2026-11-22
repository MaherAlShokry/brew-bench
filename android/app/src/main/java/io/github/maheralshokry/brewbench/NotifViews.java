package io.github.maheralshokry.brewbench;

import android.content.Context;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffColorFilter;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.util.LruCache;

/**
 * The pictures inside the notifications, drawn in the app's look: an icon tile (a coffee's colour or a fact's topic with
 * its icon), a tasting note's dot, the brew's step ring ("2/5") and its bar split into the recipe's steps. Each is drawn
 * once and kept, so a brew's notification, redrawn every second, only draws again when something on it changed.
 */
final class NotifViews {
    private NotifViews() { }

    private static final LruCache<String, Bitmap> CACHE = new LruCache<String, Bitmap>(2 * 1024 * 1024) {
        @Override protected int sizeOf(String k, Bitmap b) { return b.getByteCount(); }
    };

    static boolean night(Context ctx) {
        return (ctx.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
    }

    static int px(Context ctx, float dp) { return Math.round(dp * ctx.getResources().getDisplayMetrics().density); }

    /** A rounded tile in a colour with an icon in its middle (the topic of a fact, a coffee without a photo, a done brew). */
    static Bitmap tile(Context ctx, int bg, int iconRes, int iconColor, int sizeDp) {
        String key = "t" + bg + ":" + iconRes + ":" + iconColor + ":" + sizeDp;
        Bitmap hit = CACHE.get(key);
        if (hit != null) return hit;
        int z = px(ctx, sizeDp);
        Bitmap bm = Bitmap.createBitmap(z, z, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bm);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setColor(bg);
        float r = z * 0.3f;
        c.drawRoundRect(new RectF(0, 0, z, z), r, r, p);
        Drawable d = ctx.getDrawable(iconRes);
        if (d != null) {
            d = d.mutate();
            d.setColorFilter(new PorterDuffColorFilter(iconColor, PorterDuff.Mode.SRC_IN));
            int s = Math.round(z * 0.48f), o = (z - s) / 2;
            d.setBounds(o, o, o + s, o + s);
            d.draw(c);
        }
        CACHE.put(key, bm);
        return bm;
    }

    /** A tasting note's coloured dot. */
    static Bitmap dot(Context ctx, int color) {
        String key = "d" + color;
        Bitmap hit = CACHE.get(key);
        if (hit != null) return hit;
        int z = px(ctx, 8);
        Bitmap bm = Bitmap.createBitmap(z, z, Bitmap.Config.ARGB_8888);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setColor(color);
        new Canvas(bm).drawCircle(z / 2f, z / 2f, z / 2f, p);
        CACHE.put(key, bm);
        return bm;
    }

    /** The step ring: how far through this step the brew is, round the edge, and "2/5" in the middle. */
    static Bitmap ring(Context ctx, int step, int steps, float frac, int accent, boolean dim) {
        boolean n = night(ctx);
        // Kept to 24 positions round the ring: redrawn when the arc moves on visibly, not every second.
        int q = Math.max(0, Math.min(24, Math.round(frac * 24)));
        String key = "r" + step + "/" + steps + ":" + q + ":" + accent + ":" + dim + ":" + n;
        Bitmap hit = CACHE.get(key);
        if (hit != null) return hit;
        int z = px(ctx, 44);
        float sw = z * 0.11f, pad = sw / 2f + 1;
        Bitmap bm = Bitmap.createBitmap(z, z, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bm);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(sw);
        p.setStrokeCap(Paint.Cap.ROUND);
        p.setColor(n ? 0xFF3A3B40 : 0xFFEEE8E1);
        RectF o = new RectF(pad, pad, z - pad, z - pad);
        c.drawArc(o, 0, 360, false, p);
        p.setColor(dim ? (n ? 0xFF8E8A86 : 0xFFA59C93) : accent);
        if (q > 0) c.drawArc(o, -90, 360f * q / 24f, false, p);
        Paint t = new Paint(Paint.ANTI_ALIAS_FLAG);
        t.setColor(n ? 0xFFF2EEE9 : 0xFF1B1A19);
        t.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        t.setTextAlign(Paint.Align.CENTER);
        String s = steps > 0 ? step + "/" + steps : "";
        t.setTextSize(z * 0.27f);
        while (t.measureText(s) > z * 0.62f && t.getTextSize() > 8) t.setTextSize(t.getTextSize() - 1);
        Paint.FontMetrics fm = t.getFontMetrics();
        c.drawText(s, z / 2f, z / 2f - (fm.ascent + fm.descent) / 2f, t);
        CACHE.put(key, bm);
        return bm;
    }

    /**
     * The bar, one segment per step (each as long as its step lasts), filled to where the brew is. Drawn wide and short
     * and stretched to the notification's width; at 200 positions it moves on about every second of a short brew.
     */
    static Bitmap bar(Context ctx, long[] t, long total, long e, int accent) {
        boolean n = night(ctx);
        int q = total > 0 ? (int) Math.max(0, Math.min(200, e * 200 / total)) : 0;
        StringBuilder k = new StringBuilder("b").append(total).append(':').append(q).append(':').append(accent).append(':').append(n);
        for (long x : t) k.append(',').append(x);
        String key = k.toString();
        Bitmap hit = CACHE.get(key);
        if (hit != null) return hit;
        int w = 960, h = 24;
        float gap = 12, r = h / 2f;
        Bitmap bm = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bm);
        Paint track = new Paint(Paint.ANTI_ALIAS_FLAG), fill = new Paint(Paint.ANTI_ALIAS_FLAG);
        track.setColor(n ? 0xFF3A3B40 : 0xFFEEE8E1);
        fill.setColor(accent);
        // The segments' edges: the step times after the first, then the end.
        java.util.ArrayList<Long> cuts = new java.util.ArrayList<>();
        for (long x : t) if (x > 0 && x < total && (cuts.isEmpty() || x > cuts.get(cuts.size() - 1))) cuts.add(x);
        cuts.add(total);
        float fx = total > 0 ? w * (q / 200f) : 0;
        long from = 0;
        for (long to : cuts) {
            float a = total > 0 ? w * (from / (float) total) : 0, b = total > 0 ? w * (to / (float) total) : w;
            float l = from == 0 ? a : a + gap / 2f, rr = to >= total ? b : b - gap / 2f;
            if (rr - l < 2) { from = to; continue; }
            RectF seg = new RectF(l, 0, rr, h);
            c.drawRoundRect(seg, r, r, track);
            if (fx > l) {
                c.save();
                c.clipRect(l, 0, Math.min(fx, rr), h);
                c.drawRoundRect(seg, r, r, fill);
                c.restore();
            }
            from = to;
        }
        CACHE.put(key, bm);
        return bm;
    }

    /** A colour from "#RRGGBB", or the fallback. */
    static int color(String hex, int fallback) {
        try { return hex != null && hex.matches("#[0-9A-Fa-f]{6}") ? android.graphics.Color.parseColor(hex) : fallback; } catch (Exception e) { return fallback; }
    }

    /** A soft version of a colour for a tile behind its icon (light) or a deep one (dark). */
    static int soft(int c, boolean night) {
        int r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
        if (night) return 0xFF000000 | (Math.round(r * .32f + 0x26 * .68f) << 16) | (Math.round(g * .32f + 0x27 * .68f) << 8) | Math.round(b * .32f + 0x2B * .68f);
        return 0xFF000000 | (Math.round(r * .2f + 255 * .8f) << 16) | (Math.round(g * .2f + 255 * .8f) << 8) | Math.round(b * .2f + 255 * .8f);
    }

    /** A colour deepened for an icon on its soft tile (light), or lifted (dark). */
    static int ink(int c, boolean night) {
        int r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
        if (night) return 0xFF000000 | (Math.round(r * .7f + 255 * .3f) << 16) | (Math.round(g * .7f + 255 * .3f) << 8) | Math.round(b * .7f + 255 * .3f);
        return 0xFF000000 | (Math.round(r * .72f) << 16) | (Math.round(g * .72f) << 8) | Math.round(b * .72f);
    }
}
