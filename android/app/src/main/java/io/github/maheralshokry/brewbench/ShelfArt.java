package io.github.maheralshokry.brewbench;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffColorFilter;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.os.Build;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Drinking now and Your shelf, drawn as the app's share cards are: the card's own colours (the style chosen for share
 * cards, in the coffee's origin colours), the bean mark and a small capitals heading over a fading rule, "Drinking now"
 * in large type with "now" in the accent, counts as pills, and a panel with a row per bag (its photo, name, roastery
 * and origin, a freshness tag with its coloured dot, your rating in beans, and a ring for what's left in the bag).
 *
 * Each picture is drawn at the widget's own size, in dp, with the same measures as the tap areas laid over it in
 * widget_bean.xml and widget_cabinet.xml (heading heights, the row band, the round buttons), so a tap lands on the row
 * or button drawn under the finger. Freshness is worked out here from the roast date each time, so it moves on daily.
 */
final class ShelfArt {
    private ShelfArt() { }

    /** The outer padding, the heading's band, and the extra bands for the count pills and the big title (dp). */
    static final float PAD = 16, HEAD = 44, PILLS = 34, TITLE = 34;
    /** A row's round log button: its centre is this far in from the panel's right edge (the tap area is 44dp wide). */
    static final float LOG_IN = 22, LOG_R = 14;

    static final int[] FRESH = {0xFF8FB3D6, 0xFF7CC48A, 0xFFE2B866, 0xFFD08A6A};
    static final String[] SHORT = {"Resting", "Peak", "Lovely", "Fading"};

    /** The card's colours. */
    static final class Theme {
        int bg0 = 0xFF2E1C12, bg1 = 0xFF1E130C, bg2 = 0xFF120B07, glow = 0xFFC9964A, acc = 0xFFE2B866, ink = 0xFFFFF8EE;
        boolean light = false;

        int muted() { return a(ink, light ? .78f : .8f); }
        int pane() { return light ? a(0xFFFFFFFF, .8f) : a(bg1, .9f); }
        int chip() { return light ? a(0xFFFFFFFF, .86f) : a(bg0, .86f); }

        static Theme of(String json) {
            Theme t = new Theme();
            try {
                JSONObject o = new JSONObject(json == null || json.isEmpty() ? "{}" : json);
                JSONArray bg = o.optJSONArray("bg");
                if (bg != null && bg.length() >= 3) { t.bg0 = col(bg.optString(0), t.bg0); t.bg1 = col(bg.optString(1), t.bg1); t.bg2 = col(bg.optString(2), t.bg2); }
                t.glow = col(o.optString("glow"), t.glow);
                t.acc = col(o.optString("acc"), t.acc);
                t.ink = col(o.optString("ink"), t.ink);
                t.light = o.optBoolean("light", false);
            } catch (Exception ignored) { }
            return t;
        }
    }

    static int col(String hex, int fallback) { return NotifViews.color(hex, fallback); }

    static int a(int c, float alpha) { return (Math.round(Color.alpha(c) * alpha) << 24) | (c & 0xFFFFFF); }

    static Typeface face(int weight) {
        if (Build.VERSION.SDK_INT >= 28) return Typeface.create(Typeface.DEFAULT, weight, false);
        return Typeface.create("sans-serif", weight >= 600 ? Typeface.BOLD : Typeface.NORMAL);
    }

    /** A coffee for a picture: what its row shows. */
    static final class Bag {
        String id = "", title = "", sub = "", roastDate = "", win = "", photo = "";
        float rating = 0;
        int g = -1, bag = 0;

        static Bag of(JSONObject o) {
            Bag b = new Bag();
            b.id = o.optString("id", "");
            b.title = o.optString("title", "");
            b.sub = o.optString("sub", "");
            b.roastDate = o.optString("roastDate", "");
            b.win = o.optString("win", "");
            b.photo = o.optString("ph", "");
            b.rating = (float) o.optDouble("rating", 0);
            b.g = o.optInt("g", -1);
            b.bag = o.optInt("bag", 0);
            return b;
        }
    }

    /** The scale (pixels per dp) for a picture of w × h dp: the screen's, held to about 1.6 million pixels. */
    static float scale(Context ctx, float w, float h) {
        float d = ctx.getResources().getDisplayMetrics().density;
        return Math.max(1f, Math.min(d, (float) Math.sqrt(1.6e6 / Math.max(1f, w * h))));
    }

    // ---------- The pieces, in dp (the canvas is scaled) ----------

    static void background(Canvas c, Theme t, float w, float h) {
        RectF r = new RectF(0, 0, w, h);
        float rad = 22;
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setShader(new LinearGradient(0, 0, w * .35f, h, new int[] {t.bg0, t.bg1, t.bg2}, new float[] {0, .55f, 1}, Shader.TileMode.CLAMP));
        c.drawRoundRect(r, rad, rad, p);
        // The glow of the origin's colour from the top corner, as on the cards.
        Paint g = new Paint(Paint.ANTI_ALIAS_FLAG);
        g.setShader(new RadialGradient(w * .92f, -h * .05f, Math.max(w, h) * .85f, new int[] {a(t.glow, t.light ? .2f : .32f), a(t.glow, 0)}, null, Shader.TileMode.CLAMP));
        c.drawRoundRect(r, rad, rad, g);
        Paint e = new Paint(Paint.ANTI_ALIAS_FLAG);
        e.setStyle(Paint.Style.STROKE);
        e.setStrokeWidth(1);
        e.setColor(a(t.ink, t.light ? .08f : .1f));
        c.drawRoundRect(new RectF(.5f, .5f, w - .5f, h - .5f), rad, rad, e);
    }

    /** The app's bean mark. */
    static void bean(Canvas c, float cx, float cy, float s, int fill, int crease) {
        c.save();
        c.translate(cx, cy);
        c.rotate(-38);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setColor(fill);
        c.drawOval(new RectF(-s * .36f, -s * .5f, s * .36f, s * .5f), p);
        Path cr = new Path();
        cr.moveTo(s * .02f, -s * .5f);
        cr.cubicTo(-s * .16f, -s * .2f, s * .16f, 0, 0, s * .18f);
        cr.cubicTo(-s * .1f, s * .32f, s * .06f, s * .42f, s * .02f, s * .5f);
        Paint l = new Paint(Paint.ANTI_ALIAS_FLAG);
        l.setStyle(Paint.Style.STROKE);
        l.setStrokeWidth(s * .07f);
        l.setColor(crease);
        c.drawPath(cr, l);
        c.restore();
    }

    /** The heading: the bean mark, the label in small capitals, something on the right, and a rule fading out under it. */
    static void head(Canvas c, Theme t, float w, String label, String right) {
        bean(c, PAD + 6, PAD + 6, 13, t.acc, t.bg0);
        Paint p = text(t.acc, 10.5f, 800);
        p.setLetterSpacing(.14f);
        String lab = label.toUpperCase(Locale.ROOT);
        c.drawText(lab, PAD + 18, PAD + 10, p);
        if (right != null && !right.isEmpty()) {
            Paint r = text(t.muted(), 11, 500);
            r.setTextAlign(Paint.Align.RIGHT);
            // What's on the right gives way to the label: cut to the room left beside it.
            float room = w - PAD - (PAD + 18 + p.measureText(lab) + 12);
            if (room > 24) c.drawText(fit(r, right, room), w - PAD, PAD + 10, r);
        }
        rule(c, t, PAD, PAD + 19, w - PAD);
    }

    static void rule(Canvas c, Theme t, float x0, float y, float x1) {
        Paint l = new Paint(Paint.ANTI_ALIAS_FLAG);
        l.setShader(new LinearGradient(x0, 0, x1, 0, a(t.acc, .55f), a(t.acc, 0), Shader.TileMode.CLAMP));
        c.drawRect(x0, y, x1, y + 1, l);
    }

    static Paint text(int color, float size, int weight) {
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG);
        p.setColor(color);
        p.setTextSize(size);
        p.setTypeface(face(weight));
        return p;
    }

    /** One line that fits the width, ending in "…" when cut. */
    static String fit(Paint p, String s, float w) {
        if (s == null) return "";
        if (p.measureText(s) <= w) return s;
        String x = s;
        while (x.length() > 1 && p.measureText(x + "…") > w) x = x.substring(0, x.length() - 1);
        return x.trim() + "…";
    }

    /** Up to `max` lines that fit the width (the last cut with "…"). */
    static String[] wrap(Paint p, String s, float w, int max) {
        String[] words = (s == null ? "" : s.trim()).split("\\s+");
        java.util.ArrayList<String> out = new java.util.ArrayList<>();
        String cur = "";
        int i = 0;
        for (; i < words.length; i++) {
            String tryL = cur.isEmpty() ? words[i] : cur + " " + words[i];
            if (p.measureText(tryL) <= w || cur.isEmpty()) cur = tryL;
            else { out.add(cur); cur = words[i]; if (out.size() == max) break; }
        }
        if (out.size() < max && !cur.isEmpty()) { out.add(cur); i = words.length; }
        if (out.size() == max && i < words.length) out.set(max - 1, fit(p, out.get(max - 1) + " " + words[i], w));
        for (int k = 0; k < out.size(); k++) out.set(k, fit(p, out.get(k), w));
        return out.toArray(new String[0]);
    }

    /** A soft panel with a fine edge, as on the cards. */
    static void pane(Canvas c, Theme t, RectF r, float rad) {
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setColor(t.pane());
        c.drawRoundRect(r, rad, rad, p);
        Paint g = new Paint(Paint.ANTI_ALIAS_FLAG);
        g.setShader(new LinearGradient(0, r.top, 0, r.bottom, a(t.ink, .085f), a(t.ink, .035f), Shader.TileMode.CLAMP));
        c.drawRoundRect(r, rad, rad, g);
        Paint e = new Paint(Paint.ANTI_ALIAS_FLAG);
        e.setStyle(Paint.Style.STROKE);
        e.setStrokeWidth(.8f);
        e.setColor(a(t.ink, .13f));
        c.drawRoundRect(r, rad, rad, e);
    }

    /** The counts as pills: the figure in the accent, the word after it. Returns how many fitted. */
    static int pills(Canvas c, Theme t, float x, float y, float maxX, String[][] list) {
        float h = 24, px = x;
        int n = 0;
        for (String[] it : list) {
            Paint v = text(t.acc, 12.5f, 800), l = text(t.ink, 11.5f, 500);
            float vw = v.measureText(it[0]), lw = l.measureText(it[1]), w = vw + lw + 24;
            if (px + w > maxX) break;
            RectF r = new RectF(px, y, px + w, y + h);
            Paint f = new Paint(Paint.ANTI_ALIAS_FLAG);
            f.setColor(t.chip());
            c.drawRoundRect(r, h / 2, h / 2, f);
            Paint s = new Paint(Paint.ANTI_ALIAS_FLAG);
            s.setStyle(Paint.Style.STROKE);
            s.setStrokeWidth(.8f);
            s.setColor(a(t.acc, .38f));
            c.drawRoundRect(r, h / 2, h / 2, s);
            c.drawText(it[0], px + 10, y + 16.5f, v);
            c.drawText(it[1], px + 10 + vw + 4, y + 16.5f, l);
            px += w + 6;
            n++;
        }
        return n;
    }

    /** A coffee's picture: its photo cropped square, or a tile in the card's colours with the bean mark. */
    static void pic(Canvas c, Context ctx, Theme t, Bag b, float x, float y, float s, float scale) {
        RectF r = new RectF(x, y, x + s, y + s);
        float rad = s * .22f;
        Bitmap src = decode(b.photo);
        if (src != null) {
            int m = Math.min(src.getWidth(), src.getHeight());
            Bitmap sq = Bitmap.createBitmap(src, (src.getWidth() - m) / 2, (src.getHeight() - m) / 2, m, m);
            Paint p = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
            BitmapShader sh = new BitmapShader(sq, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP);
            android.graphics.Matrix mx = new android.graphics.Matrix();
            mx.setScale(s / m, s / m);
            mx.postTranslate(x, y);
            sh.setLocalMatrix(mx);
            p.setShader(sh);
            c.drawRoundRect(r, rad, rad, p);
        } else {
            Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
            int top = t.light ? blend(t.bg0, t.glow, .25f) : blend(t.glow, t.bg0, .55f), bot = t.light ? blend(t.bg2, t.glow, .12f) : t.bg1;
            p.setShader(new LinearGradient(x, y, x + s, y + s, top, bot, Shader.TileMode.CLAMP));
            c.drawRoundRect(r, rad, rad, p);
            bean(c, x + s / 2, y + s / 2, s * .42f, t.light ? 0x29402414 : 0x38FFF8EE, t.light ? 0x59FFFFFF : 0x2E000000);
        }
        Paint e = new Paint(Paint.ANTI_ALIAS_FLAG);
        e.setStyle(Paint.Style.STROKE);
        e.setStrokeWidth(.8f);
        e.setColor(a(t.ink, .14f));
        c.drawRoundRect(r, rad, rad, e);
    }

    static int blend(int a, int b, float f) {
        return Color.rgb(Math.round(Color.red(a) + (Color.red(b) - Color.red(a)) * f), Math.round(Color.green(a) + (Color.green(b) - Color.green(a)) * f),
            Math.round(Color.blue(a) + (Color.blue(b) - Color.blue(a)) * f));
    }

    static Bitmap decode(String dataUrl) {
        if (dataUrl == null || dataUrl.isEmpty()) return null;
        try {
            int i = dataUrl.indexOf(',');
            byte[] b = android.util.Base64.decode(i >= 0 ? dataUrl.substring(i + 1) : dataUrl, android.util.Base64.DEFAULT);
            return android.graphics.BitmapFactory.decodeByteArray(b, 0, b.length);
        } catch (Exception e) { return null; }
    }

    /** Today's freshness: [stage (-1 without a roast date), day]. */
    static int[] fresh(Bag b) {
        int d = BrewWidget.daysSince(b.roastDate);
        return new int[] {BrewWidget.stage(d, BrewWidget.window(b.win)), d};
    }

    /** The freshness tag: a pill tinted in the stage's colour with its dot, "Day 12 · At its peak". Returns its width. */
    static float tag(Canvas c, Theme t, Bag b, float x, float y, float h, float maxW) {
        int[] f = fresh(b);
        String s = f[0] < 0 ? "No roast date" : "Day " + f[1] + " · " + BrewWidget.STAGES[f[0]];
        int fc = f[0] < 0 ? a(t.ink, .4f) : FRESH[f[0]];
        Paint tx = text(t.ink, h * .48f, 700);
        // Too long for the room: the stage's short word ("Day 14 · Peak") before cutting anything.
        if (f[0] >= 0 && tx.measureText(s) + h * 1.35f > maxW) s = "Day " + f[1] + " · " + SHORT[f[0]];
        float dotX = h * .5f, w = Math.min(maxW, tx.measureText(s) + h * 1.35f);
        s = fit(tx, s, w - h * 1.35f);
        RectF r = new RectF(x, y, x + w, y + h);
        Paint bg = new Paint(Paint.ANTI_ALIAS_FLAG);
        bg.setColor(a(fc, .16f));
        c.drawRoundRect(r, h / 2, h / 2, bg);
        Paint st = new Paint(Paint.ANTI_ALIAS_FLAG);
        st.setStyle(Paint.Style.STROKE);
        st.setStrokeWidth(.8f);
        st.setColor(a(fc, .55f));
        c.drawRoundRect(r, h / 2, h / 2, st);
        Paint dot = new Paint(Paint.ANTI_ALIAS_FLAG);
        dot.setColor(fc);
        c.drawCircle(x + dotX, y + h / 2, h * .16f, dot);
        Paint.FontMetrics fm = tx.getFontMetrics();
        c.drawText(s, x + h * .9f, y + h / 2 - (fm.ascent + fm.descent) / 2, tx);
        return w;
    }

    /** Your rating as five beans (halves allowed), as on the cards. Returns the width. */
    static float rating(Canvas c, Theme t, float v, float x, float cy, float s) {
        for (int i = 1; i <= 5; i++) {
            float cx = x + (i - 1) * s * 1.18f + s / 2;
            float f = v >= i ? 1 : v >= i - .5f ? .5f : 0;
            bean(c, cx, cy, s, a(t.ink, .18f), 0);
            if (f > 0) {
                c.save();
                if (f < 1) c.clipRect(cx - s, cy - s, cx, cy + s);
                bean(c, cx, cy, s, t.acc, t.light ? 0x55FFFFFF : a(t.bg0, .7f));
                c.restore();
            }
        }
        return 5 * s * 1.18f;
    }

    /** The ring for what's left in the bag, the grams in its middle. */
    static void ring(Canvas c, Theme t, float cx, float cy, float r, int g, int bag) {
        float pc = bag > 0 ? Math.max(0, Math.min(1, g / (float) bag)) : 0;
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeCap(Paint.Cap.ROUND);
        p.setStrokeWidth(Math.max(3, r * .17f));
        p.setColor(a(t.ink, .12f));
        RectF o = new RectF(cx - r, cy - r, cx + r, cy + r);
        c.drawArc(o, 0, 360, false, p);
        if (pc > 0) { p.setColor(t.acc); c.drawArc(o, -90, 360 * pc, false, p); }
        Paint n = text(t.ink, r * .5f, 800), u = text(t.muted(), r * .32f, 700);
        String gs = String.valueOf(g);
        float nw = n.measureText(gs), uw = u.measureText(" g"), x0 = cx - (nw + uw) / 2, by = cy + r * .17f;
        c.drawText(gs, x0, by, n);
        c.drawText(" g", x0 + nw, by, u);
    }

    /** The round log button: a cup with a plus, on the card's chip colour. */
    static void logButton(Context ctx, Canvas c, Theme t, float cx, float cy, float r) {
        Paint f = new Paint(Paint.ANTI_ALIAS_FLAG);
        f.setColor(t.chip());
        c.drawCircle(cx, cy, r, f);
        Paint s = new Paint(Paint.ANTI_ALIAS_FLAG);
        s.setStyle(Paint.Style.STROKE);
        s.setStrokeWidth(.8f);
        s.setColor(a(t.acc, .38f));
        c.drawCircle(cx, cy, r, s);
        Drawable d = ctx.getDrawable(R.drawable.wic_log);
        if (d != null) {
            d = d.mutate();
            d.setColorFilter(new PorterDuffColorFilter(t.acc, PorterDuff.Mode.SRC_IN));
            int z = Math.round(r * 1.1f);
            d.setBounds(Math.round(cx - z / 2f), Math.round(cy - z / 2f), Math.round(cx + z / 2f), Math.round(cy + z / 2f));
            d.draw(c);
        }
    }

    static String today() { return new SimpleDateFormat("d MMM", Locale.getDefault()).format(new Date()); }

    static Bitmap canvas(Context ctx, float w, float h, Canvas[] out) {
        float k = scale(ctx, w, h);
        Bitmap bm = Bitmap.createBitmap(Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k)), Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bm);
        c.scale(k, k);
        out[0] = c;
        return bm;
    }

    // ---------- A skin for the widgets with live parts (Quick brew, Word of the day, Passport) ----------

    /**
     * The card's background, and (with a heading) the bean mark, the label in small capitals with something on the
     * right, and the fading rule, drawn behind a widget's own views. Those views start under the heading (HEAD dp).
     */
    static Bitmap skin(Context ctx, Theme t, float w, float h, String label, String right) {
        Canvas[] cc = new Canvas[1];
        Bitmap bm = canvas(ctx, w, h, cc);
        background(cc[0], t, w, h);
        if (label != null) head(cc[0], t, w, label, right);
        return bm;
    }

    /** The colour for text on a button in the accent: the card's deep tone on a light accent, white on a deep one. */
    static int onAcc(Theme t) { return t.light ? 0xFFFFFFFF : t.bg0; }

    /** A tile or chip in the card's chip colour (Android 12+; before that it keeps its own). */
    static void tint(android.widget.RemoteViews v, int id, int color) {
        if (Build.VERSION.SDK_INT >= 31) v.setColorStateList(id, "setBackgroundTintList", android.content.res.ColorStateList.valueOf(color));
    }

    /** Pads a widget's content to sit under the drawn heading (or near the top without one). */
    static void underHead(Context ctx, android.widget.RemoteViews v, int id, boolean withHead, int sideDp, int bottomDp) {
        v.setViewPadding(id, BrewWidget.dp(ctx, sideDp), BrewWidget.dp(ctx, withHead ? (int) HEAD : 14), BrewWidget.dp(ctx, sideDp), BrewWidget.dp(ctx, bottomDp));
    }

    // ---------- Drinking now ----------

    /**
     * One coffee. Under 100dp tall: its picture, name and freshness tag. Taller: the heading ("Drinking now", the round
     * log button on its right), then the picture, the name, roastery and origin, the freshness tag and your rating, and
     * the ring for what's left on the right when there's room.
     */
    static Bitmap drinking(Context ctx, Theme t, Bag b, float w, float h) {
        Canvas[] cc = new Canvas[1];
        Bitmap bm = canvas(ctx, w, h, cc);
        Canvas c = cc[0];
        background(c, t, w, h);
        boolean compact = h < 100;
        float top = compact ? 12 : HEAD, bottom = h - (compact ? 12 : PAD), left = compact ? 12 : PAD;
        if (!compact) {
            head(c, t, w, "Drinking now", null);
            logButton(ctx, c, t, w - PAD - 15, PAD + 8, 15);
        }
        if (b == null) {
            Paint n = text(t.ink, compact ? 15 : 18, 800), m = text(t.muted(), 12.5f, 500);
            float cy = (top + bottom) / 2;
            c.drawText(fit(n, "Nothing on your shelf", w - 2 * left), left, cy - (compact ? 0 : 4), n);
            c.drawText(fit(m, "Add the bag you're drinking", w - 2 * left), left, cy + (compact ? 16 : 16), m);
            return bm;
        }
        float bodyH = bottom - top, s = Math.min(bodyH, Math.min(Math.max(48, w * .28f), 116));
        pic(c, ctx, t, b, left, top + (bodyH - s) / 2, s, 1);
        boolean ringOn = !compact && b.g >= 0 && b.bag > 0 && w >= 300;
        float ringR = Math.min(bodyH / 2 - 2, Math.min(34, w * .1f)), cxR = w - PAD - ringR;
        float tx = left + s + 14, tw = (ringOn ? cxR - ringR - 12 : w - left) - tx;
        Paint name = text(t.ink, compact ? 15 : h >= 170 ? 21 : 18, 800), meta = text(t.muted(), compact ? 11.5f : 12.5f, 500);
        Paint.FontMetrics nf = name.getFontMetrics();
        float nameLh = (nf.descent - nf.ascent) * 1.02f;
        String[] lines = wrap(name, b.title, tw, !compact && bodyH >= 100 ? 2 : 1);
        boolean metaOn = !compact && !b.sub.isEmpty();
        float tagH = compact ? 20 : 22;
        boolean rateOn = !compact && b.rating > 0 && bodyH >= 108;
        float block = lines.length * nameLh + (metaOn ? 18 : 0) + 8 + tagH + (rateOn ? 8 + 13 : 0);
        float y = top + (bodyH - block) / 2 - nf.ascent;
        for (String l : lines) { c.drawText(l, tx, y, name); y += nameLh; }
        y += nf.ascent;
        if (metaOn) { c.drawText(fit(meta, b.sub, tw), tx, y + 13, meta); y += 18; }
        y += 8;
        tag(c, t, b, tx, y, tagH, tw);
        y += tagH;
        if (rateOn) rating(c, t, b.rating, tx, y + 8 + 6.5f, 13);
        if (ringOn) ring(c, t, cxR, top + bodyH / 2, ringR, b.g, b.bag);
        return bm;
    }

    // ---------- Your shelf ----------

    /** The heading tiers by height: 0 just the heading, 1 with the count pills, 2 with "Drinking now" large too. */
    static int tier(float h) { return h >= 290 ? 2 : h >= 240 ? 1 : 0; }

    /** Where the rows start (dp from the top) for a tier: the same as the spacers in widget_cabinet.xml. */
    static float rowsTop(int tier) { return HEAD + (tier >= 2 ? TITLE : 0) + (tier >= 1 ? PILLS : 0); }

    /** How many rows a panel this tall holds: at least 44dp each, at most six. */
    static int fits(float paneH) { return Math.max(1, Math.min(6, (int) (paneH / 44))); }

    /**
     * Every bag on the shelf, as the shelf card: the heading ("On my shelf", today's date or how many more there are),
     * then (when tall enough) "Drinking now" large and the counts, then the panel with as many rows as fit, sharing its
     * height. Each row: the picture, the name, roastery and origin (on taller rows), the freshness tag and your
     * rating, the ring for what's left (on wider widgets), and the round log button at its end.
     */
    static Bitmap shelf(Context ctx, Theme t, Bag[] bags, int[] stats, float w, float h) {
        Canvas[] cc = new Canvas[1];
        Bitmap bm = canvas(ctx, w, h, cc);
        Canvas c = cc[0];
        background(c, t, w, h);
        int tier = tier(h), n = bags.length;
        float top = rowsTop(tier), paneH = h - PAD - top;
        int shown = Math.min(n, fits(paneH));
        head(c, t, w, "On my shelf", n > shown ? "+" + (n - shown) + " more" : today());
        float y = HEAD;
        if (tier >= 2) {
            Paint big = text(t.ink, 27, 800), now = text(t.acc, 27, 800);
            float bw = big.measureText("Drinking ");
            c.drawText("Drinking ", PAD - 1, y + 25, big);
            c.drawText("now", PAD - 1 + bw, y + 25, now);
            y += TITLE;
        }
        if (tier >= 1 && stats != null) {
            pills(c, t, PAD, y + 2, w - PAD, new String[][] {
                {String.valueOf(stats[0]), stats[0] == 1 ? "bag open" : "bags open"},
                {String.valueOf(stats[1]), stats[1] == 1 ? "roastery" : "roasteries"},
                {String.valueOf(stats[2]), stats[2] == 1 ? "origin" : "origins"}});
        }
        RectF pr = new RectF(PAD, top, w - PAD, h - PAD);
        pane(c, t, pr, 16);
        if (n == 0) {
            Paint a1 = text(t.ink, 15, 800), a2 = text(t.muted(), 12, 500);
            a1.setTextAlign(Paint.Align.CENTER);
            a2.setTextAlign(Paint.Align.CENTER);
            c.drawText("Nothing on your shelf yet", w / 2, pr.centerY() - 2, a1);
            c.drawText("Tap to add the bag you're drinking", w / 2, pr.centerY() + 16, a2);
            return bm;
        }
        float rowH = paneH / shown;
        boolean ringOn = w >= 300 && rowH >= 46;
        for (int i = 0; i < shown; i++) {
            Bag b = bags[i];
            float ry = top + i * rowH, cy = ry + rowH / 2;
            if (i > 0) {
                Paint sep = new Paint();
                sep.setColor(a(t.ink, .09f));
                c.drawRect(PAD + 12, ry, w - PAD - 12, ry + .8f, sep);
            }
            float s = Math.min(rowH - 14, 64), px = PAD + 8;
            pic(c, ctx, t, b, px, cy - s / 2, s, 1);
            float logX = w - PAD - LOG_IN;
            logButton(ctx, c, t, logX, cy, LOG_R);
            float ringR = Math.min(rowH / 2 - 7, 19), rcx = logX - LOG_R - 10 - ringR;
            boolean thisRing = ringOn && b.g >= 0 && b.bag > 0;
            if (thisRing) ring(c, t, rcx, cy, ringR, b.g, b.bag);
            float tx = px + s + 12, tw = (thisRing ? rcx - ringR - 10 : logX - LOG_R - 10) - tx;
            boolean big = rowH >= 64, metaOn = rowH >= 60 && !b.sub.isEmpty();
            Paint name = text(t.ink, big ? 15 : 14, 800), meta = text(t.muted(), 11.5f, 500);
            float tagH = big ? 20 : 18;
            Paint.FontMetrics nf = name.getFontMetrics();
            float nh = nf.descent - nf.ascent, block = nh + (metaOn ? 16 : 0) + 5 + tagH;
            float ty = cy - block / 2;
            c.drawText(fit(name, b.title, tw), tx, ty - nf.ascent, name);
            ty += nh;
            if (metaOn) { c.drawText(fit(meta, b.sub, tw), tx, ty + 12, meta); ty += 16; }
            ty += 5;
            float tgw = tag(c, t, b, tx, ty, tagH, tw);
            float rs = big ? 11 : 10;
            if (b.rating > 0 && tgw + 8 + 5 * rs * 1.18f <= tw) rating(c, t, b.rating, tx + tgw + 8, ty + tagH / 2, rs);
        }
        return bm;
    }
}
