package io.github.maheralshokry.brewbench;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Typeface;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Quick brew, Word of the day and Coffee passport, drawn whole in the shelf card's look (see ShelfArt), every line placed
 * from the widget's own size so nothing is cut or out of line. Only Quick brew's running clock is a live view (it
 * ticks by itself): its place is worked out here and handed back, and its buttons get tap areas over them.
 * All measures in dp.
 */
final class WidgetArt {
    private WidgetArt() { }

    static final float PAD = ShelfArt.PAD, BTN = 40;

    static float top(boolean head) { return head ? ShelfArt.HEAD : 14; }

    /** A round-ended button in a colour, its label (and an icon: 1 play, 2 pause, 3 next) centred. */
    static void button(Canvas c, RectF r, int fill, int ink, String label, int icon) {
        Paint f = new Paint(Paint.ANTI_ALIAS_FLAG);
        f.setColor(fill);
        c.drawRoundRect(r, r.height() / 2, r.height() / 2, f);
        Paint t = ShelfArt.text(ink, 14.5f, 700);
        float tw = t.measureText(label), ic = icon > 0 ? 12 : 0, gap = icon > 0 ? 7 : 0, x = r.centerX() - (tw + ic + gap) / 2;
        Paint.FontMetrics fm = t.getFontMetrics();
        float by = r.centerY() - (fm.ascent + fm.descent) / 2;
        if (icon > 0) icon(c, icon, x, r.centerY(), ic, ink);
        c.drawText(label, x + ic + gap, by, t);
    }

    static void icon(Canvas c, int kind, float x, float cy, float s, int col) {
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setColor(col);
        Path path = new Path();
        if (kind == 1 || kind == 3) {
            path.moveTo(x, cy - s / 2);
            path.lineTo(x + s * (kind == 3 ? .7f : .9f), cy);
            path.lineTo(x, cy + s / 2);
            path.close();
            c.drawPath(path, p);
            if (kind == 3) c.drawRoundRect(new RectF(x + s * .78f, cy - s / 2, x + s, cy + s / 2), 1.2f, 1.2f, p);
        } else {
            c.drawRoundRect(new RectF(x, cy - s / 2, x + s * .36f, cy + s / 2), 1.2f, 1.2f, p);
            c.drawRoundRect(new RectF(x + s * .64f, cy - s / 2, x + s, cy + s / 2), 1.2f, 1.2f, p);
        }
    }

    static float lineH(Paint p) { Paint.FontMetrics fm = p.getFontMetrics(); return fm.descent - fm.ascent; }

    /** Draws a line with its top at y (not its baseline). */
    static void at(Canvas c, String s, float x, float y, Paint p) { c.drawText(s, x, y - p.getFontMetrics().ascent, p); }

    // ---------- Quick brew ----------

    /** What Quick brew shows. */
    static final class Quick {
        boolean brewing, run, done, hasNext, startable = true, empty;
        String label = "Quick brew", right = "", name = "", line = "", step = "", next = "", beanTitle = "", beanPhoto = "";
        String[] vals = {"", "", ""};
        float frac = 0;
    }

    /** Where things landed, for the live views and tap areas laid over the picture. */
    static final class Places {
        boolean button, twoButtons, clock;
        float clockTop, clockSize, clockLeft;
    }

    static Bitmap quick(Context ctx, ShelfArt.Theme t, Quick q, float w, float h, Places out) {
        Canvas[] cc = new Canvas[1];
        Bitmap bm = ShelfArt.canvas(ctx, w, h, cc);
        Canvas c = cc[0];
        ShelfArt.background(c, t, w, h);
        // While brewing, a short widget gives the clock the heading's room: its label and the recipe go on one small line.
        boolean head = h >= (q.brewing ? 170 : 100);
        if (head) ShelfArt.head(c, t, w, q.label, q.right);
        float top = top(head);
        boolean btnRoom = h >= 120;
        RectF btn = new RectF(PAD, h - PAD - BTN, w - PAD, h - PAD);
        int on = ShelfArt.onAcc(t);
        if (q.brewing) {
            // Buttons along the foot: pause or resume and next while it runs, Log this brew once it's done.
            float bottom = h - PAD;
            if (btnRoom) {
                if (q.done) { button(c, btn, t.acc, on, "Log this brew", 0); out.button = true; }
                else {
                    float half = (btn.width() - 8) / 2;
                    button(c, new RectF(btn.left, btn.top, btn.left + half, btn.bottom), t.acc, on, q.run ? "Pause" : "Resume", q.run ? 2 : 1);
                    if (q.hasNext) button(c, new RectF(btn.right - half, btn.top, btn.right, btn.bottom), t.chip(), t.ink, "Next", 3);
                    out.twoButtons = true;
                }
                bottom = btn.top - 10;
            }
            // How far through the brew, as a thin bar over the buttons.
            if (btnRoom && !q.done && bottom - 12 - (top + (head ? 0 : 16)) >= 40) {
                float by = bottom - 4;
                Paint tr = new Paint(Paint.ANTI_ALIAS_FLAG);
                tr.setColor(ShelfArt.a(t.ink, .12f));
                c.drawRoundRect(new RectF(PAD, by, w - PAD, by + 4), 2, 2, tr);
                tr.setColor(t.acc);
                if (q.frac > 0) c.drawRoundRect(new RectF(PAD, by, PAD + Math.max(4, (w - 2 * PAD) * Math.min(1, q.frac)), by + 4), 2, 2, tr);
                bottom = by - 8;
            }
            if (!head) {
                // No heading: the recipe's name sits small at the top.
                Paint nm = ShelfArt.text(t.muted(), 11.5f, 700);
                at(c, ShelfArt.fit(nm, q.label + " · " + q.name, w - 2 * PAD), PAD, top, nm);
                top += 16;
            }
            float room = bottom - top;
            if (q.done) {
                Paint d = ShelfArt.text(t.ink, 17, 800);
                at(c, ShelfArt.fit(d, "Enjoy it. How was it?", w - 2 * PAD), PAD, top + Math.max(0, (room - lineH(d)) / 2), d);
                return bm;
            }
            // The clock: as large as the room allows (up to 40), with the step beside it when it's short, or under it.
            float size = Math.max(22, Math.min(40, room * .62f));
            Paint clk = ShelfArt.text(t.ink, size, 700);
            float clkH = lineH(clk) * .86f, clkW = clk.measureText("00:00");
            Paint st = ShelfArt.text(t.acc, 14, 700), nx = ShelfArt.text(t.muted(), 12, 500);
            boolean stacked = room >= clkH + 4 + lineH(st);
            out.clock = true;
            out.clockSize = size;
            out.clockLeft = PAD;
            if (stacked) {
                boolean nextOn = !q.next.isEmpty() && room >= clkH + 4 + lineH(st) + lineH(nx) + 2;
                float block = clkH + 4 + lineH(st) + (nextOn ? lineH(nx) + 2 : 0), y = top + (room - block) / 2;
                out.clockTop = y;
                y += clkH + 4;
                at(c, ShelfArt.fit(st, q.step, w - 2 * PAD), PAD, y, st);
                if (nextOn) at(c, ShelfArt.fit(nx, q.next, w - 2 * PAD), PAD, y + lineH(st) + 2, nx);
            } else {
                out.clockTop = top + (room - clkH) / 2;
                float tx = PAD + clkW + 12, tw = w - PAD - tx;
                String[] ls = ShelfArt.wrap(st, q.step, tw, 2);
                float y = top + (room - ls.length * lineH(st)) / 2;
                for (String l : ls) { at(c, l, tx, y, st); y += lineH(st); }
            }
            return bm;
        }
        // Your go-to recipe.
        Paint title = ShelfArt.text(t.ink, 19, 800);
        at(c, ShelfArt.fit(title, q.name, w - 2 * PAD), PAD, top, title);
        float y = top + lineH(title) + 6;
        boolean btnOn = btnRoom;
        if (btnOn) { button(c, btn, t.acc, on, q.empty ? "Recipes" : "Start brew", q.empty ? 0 : 1); out.button = true; }
        float bottom = btnOn ? btn.top - 10 : h - PAD, area = bottom - y;
        if (q.empty || area < 58) {
            Paint ln = ShelfArt.text(t.muted(), 13, 500);
            String[] ls = ShelfArt.wrap(ln, q.line, w - 2 * PAD, Math.max(1, Math.min(2, (int) (area / lineH(ln)))));
            for (String l : ls) { if (y + lineH(ln) > bottom + 2) break; at(c, l, PAD, y, ln); y += lineH(ln); }
            return bm;
        }
        // With room, the coffee you're drinking above the numbers.
        if (!q.beanTitle.isEmpty() && area >= 58 + 34) {
            ShelfArt.Bag b = new ShelfArt.Bag();
            b.photo = q.beanPhoto;
            ShelfArt.pic(c, ctx, t, b, PAD, y, 24, 1);
            Paint bt = ShelfArt.text(t.muted(), 12, 600);
            Paint.FontMetrics fm = bt.getFontMetrics();
            c.drawText(ShelfArt.fit(bt, "With " + q.beanTitle, w - 2 * PAD - 32), PAD + 32, y + 12 - (fm.ascent + fm.descent) / 2, bt);
            y += 34;
        }
        // The numbers as three tiles sharing the width, each its value over a short label.
        String[] labs = {"Coffee", "Water", "Temp"};
        float th = Math.min(bottom - y, 86), gap = 6, tw = (w - 2 * PAD - 2 * gap) / 3, ty = y + (bottom - y - th) / 2;
        for (int i = 0; i < 3; i++) {
            RectF r = new RectF(PAD + i * (tw + gap), ty, PAD + i * (tw + gap) + tw, ty + th);
            ShelfArt.pane(c, t, r, 12);
            Paint v = ShelfArt.text(t.ink, Math.min(20, th * .3f), 800), l = ShelfArt.text(t.muted(), 9.5f, 700);
            l.setLetterSpacing(.1f);
            l.setTextAlign(Paint.Align.CENTER);
            v.setTextAlign(Paint.Align.CENTER);
            String val = q.vals[i].isEmpty() ? "–" : q.vals[i];
            float vh = lineH(v) * .86f, lh = lineH(l), by = r.centerY() - (vh + 3 + lh) / 2;
            c.drawText(ShelfArt.fit(v, val, tw - 8), r.centerX(), by - v.getFontMetrics().ascent * .86f, v);
            at(c, labs[i].toUpperCase(Locale.ROOT), r.centerX(), by + vh + 3, l);
        }
        return bm;
    }

    // ---------- Word of the day ----------

    static Bitmap word(Context ctx, ShelfArt.Theme t, String word, String text, String cat, int catCol, float w, float h) {
        Canvas[] cc = new Canvas[1];
        Bitmap bm = ShelfArt.canvas(ctx, w, h, cc);
        Canvas c = cc[0];
        ShelfArt.background(c, t, w, h);
        Typeface serif = Typeface.create(Typeface.SERIF, Typeface.BOLD);
        // The word's first letter, large and faint in the corner.
        if (!word.isEmpty() && h >= 120) {
            Paint m = ShelfArt.text(ShelfArt.a(t.ink, .06f), 150, 800);
            m.setTypeface(serif);
            m.setTextAlign(Paint.Align.RIGHT);
            c.save();
            c.clipRect(0, 0, w, h);
            c.drawText(word.substring(0, 1).toUpperCase(Locale.ROOT), w - 8, h + 26, m);
            c.restore();
        }
        boolean head = h >= 100;
        if (head) ShelfArt.head(c, t, w, "Word of the day", new SimpleDateFormat("EEE d MMM", Locale.getDefault()).format(new Date()));
        float y = top(head);
        if (word.isEmpty()) { word = "Open Brew Bench"; text = "Today's coffee word appears here."; cat = ""; }
        Paint wd = ShelfArt.text(t.ink, h < 130 ? 22 : 27, 800);
        wd.setTypeface(serif);
        at(c, ShelfArt.fit(wd, word, w - 2 * PAD), PAD, y, wd);
        y += lineH(wd) * .92f;
        if (h >= 150) {
            Paint r = new Paint(Paint.ANTI_ALIAS_FLAG);
            r.setColor(catCol);
            c.drawRoundRect(new RectF(PAD, y + 4, PAD + 30, y + 7), 1.5f, 1.5f, r);
            y += 13;
        }
        boolean foot = h >= 160 && !cat.isEmpty();
        float bottom = foot ? h - PAD - 24 - 8 : h - PAD;
        Paint tx = ShelfArt.text(t.muted(), 14, 500);
        float lh = lineH(tx) * 1.08f;
        int lines = Math.max(1, (int) ((bottom - y) / lh));
        for (String l : ShelfArt.wrap(tx, text, w - 2 * PAD, lines)) { at(c, l, PAD, y, tx); y += lh; }
        if (foot) {
            // The word's part of coffee as a chip, and Read more.
            float fy = h - PAD - 24;
            Paint cp = ShelfArt.text(t.ink, 11, 700);
            float cw = Math.min(w - 2 * PAD - 100, cp.measureText(cat) + 30);
            RectF chip = new RectF(PAD, fy, PAD + cw, fy + 24);
            Paint f = new Paint(Paint.ANTI_ALIAS_FLAG);
            f.setColor(t.chip());
            c.drawRoundRect(chip, 12, 12, f);
            f.setColor(catCol);
            c.drawCircle(PAD + 12, fy + 12, 4, f);
            Paint.FontMetrics fm = cp.getFontMetrics();
            c.drawText(ShelfArt.fit(cp, cat, cw - 30), PAD + 22, fy + 12 - (fm.ascent + fm.descent) / 2, cp);
            Paint mt = ShelfArt.text(ShelfArt.onAcc(t), 12, 700);
            float mw = mt.measureText("Read more") + 28;
            RectF more = new RectF(w - PAD - mw, fy, w - PAD, fy + 24);
            f.setColor(t.acc);
            c.drawRoundRect(more, 12, 12, f);
            c.drawText("Read more", more.left + 14, fy + 12 - (mt.getFontMetrics().ascent + mt.getFontMetrics().descent) / 2, mt);
        }
        return bm;
    }

    // ---------- Coffee passport ----------

    static Bitmap passport(Context ctx, ShelfArt.Theme t, JSONObject d, float w, float h) {
        Canvas[] cc = new Canvas[1];
        Bitmap bm = ShelfArt.canvas(ctx, w, h, cc);
        Canvas c = cc[0];
        ShelfArt.background(c, t, w, h);
        boolean head = h >= 100;
        if (head) ShelfArt.head(c, t, w, "Coffee passport", null);
        float y = top(head);
        int n = d == null ? 0 : d.optInt("n"), total = d == null ? 0 : d.optInt("total"), pct = d == null ? 0 : d.optInt("pct");
        if (total == 0) {
            Paint a = ShelfArt.text(t.ink, 16, 800), b = ShelfArt.text(t.muted(), 12.5f, 500);
            at(c, ShelfArt.fit(a, "Your coffee passport", w - 2 * PAD), PAD, y, a);
            at(c, ShelfArt.fit(b, "Open Brew Bench to start it", w - 2 * PAD), PAD, y + lineH(a) + 2, b);
            return bm;
        }
        // The count and "of 51 origins" on one baseline, the ring of the share collected beside them.
        float rowH = Math.min(60, Math.max(40, h - y - PAD - (h >= 115 ? 22 : 0))), ringR = rowH / 2 - 3, cy = y + rowH / 2;
        Paint num = ShelfArt.text(t.acc, Math.min(40, rowH * .72f), 800), of = ShelfArt.text(t.muted(), 14, 500);
        Paint.FontMetrics nf = num.getFontMetrics();
        float base = cy - (nf.ascent + nf.descent) / 2;
        String ns = String.valueOf(n);
        c.drawText(ns, PAD - 1, base, num);
        float ox = PAD - 1 + num.measureText(ns) + 8;
        c.drawText(ShelfArt.fit(of, "of " + total + " origins", w - PAD - ringR * 2 - 12 - ox), ox, base, of);
        float rcx = w - PAD - ringR;
        Paint rp = new Paint(Paint.ANTI_ALIAS_FLAG);
        rp.setStyle(Paint.Style.STROKE);
        rp.setStrokeCap(Paint.Cap.ROUND);
        rp.setStrokeWidth(Math.max(4, ringR * .18f));
        rp.setColor(ShelfArt.a(t.ink, .12f));
        RectF o = new RectF(rcx - ringR, cy - ringR, rcx + ringR, cy + ringR);
        c.drawArc(o, 0, 360, false, rp);
        rp.setColor(t.acc);
        if (pct > 0) c.drawArc(o, -90, Math.max(4, pct * 3.6f), false, rp);
        Paint pc = ShelfArt.text(t.ink, Math.min(14, ringR * .5f), 800);
        pc.setTextAlign(Paint.Align.CENTER);
        c.drawText(pct + "%", rcx, cy - (pc.getFontMetrics().ascent + pc.getFontMetrics().descent) / 2, pc);
        y += rowH;
        // The next origin to try, along the foot.
        JSONArray next = d.optJSONArray("next");
        float bottom = h - PAD;
        if (h >= 115 && next != null && next.length() > 1) {
            Paint nx = ShelfArt.text(t.acc, 12, 700);
            c.drawText(ShelfArt.fit(nx, "Next to discover: " + next.optString(0, "") + " " + next.optString(1, ""), w - 2 * PAD), PAD, h - PAD - nx.getFontMetrics().descent, nx);
            bottom = h - PAD - lineH(nx) - 8;
        }
        // The regions, two columns of thin bars, when there's height for them.
        JSONArray regs = d.optJSONArray("regs");
        if (regs != null && regs.length() > 0 && bottom - y >= 60) {
            int rows = (regs.length() + 1) / 2;
            float ry = y + 12, rh = Math.min(26, (bottom - ry) / rows), colW = (w - 2 * PAD - 14) / 2;
            if (rh >= 20) for (int i = 0; i < regs.length(); i++) {
                JSONArray r = regs.optJSONArray(i);
                if (r == null) continue;
                float x = PAD + (i % 2) * (colW + 14), yy = ry + (i / 2) * rh;
                Paint lt = ShelfArt.text(t.muted(), 11, 500), lc = ShelfArt.text(t.ink, 11, 700);
                lc.setTextAlign(Paint.Align.RIGHT);
                int have = r.optInt(1), all = Math.max(1, r.optInt(2, 1));
                String cnt = have + "/" + all;
                c.drawText(ShelfArt.fit(lt, r.optString(0, ""), colW - lc.measureText(cnt) - 6), x, yy + 11, lt);
                c.drawText(cnt, x + colW, yy + 11, lc);
                Paint bar = new Paint(Paint.ANTI_ALIAS_FLAG);
                bar.setColor(ShelfArt.a(t.ink, .12f));
                c.drawRoundRect(new RectF(x, yy + 15, x + colW, yy + 19), 2, 2, bar);
                bar.setColor(ShelfArt.col(r.optString(3, ""), t.acc));
                if (have > 0) c.drawRoundRect(new RectF(x, yy + 15, x + Math.max(4, colW * Math.min(1f, have / (float) all)), yy + 19), 2, 2, bar);
            }
        }
        return bm;
    }
}
