package io.github.maheralshokry.brewbench;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Shader;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.util.SizeF;
import android.view.View;
import android.widget.RemoteViews;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;
import java.util.TimeZone;

/**
 * "Drinking now": the coffee you're drinking (the one you chose on its page, or the cabinet coffee brewed most recently),
 * with its photo or flag, how fresh it is today (a chip, and a bar along its freshness window), cups left and Log brew.
 * The app sends the coffee with WidgetPlugin.update(); the freshness is worked out here from its roast date and window,
 * so it moves on each day without the app being opened.
 *
 * Every Brew Bench widget fills the size it's given: on Android 12 and later the launcher picks between layouts made
 * for several heights (see push); before that, the widget's height when placed or resized chooses one.
 */
public class BrewWidget extends AppWidgetProvider {
    static final String PREFS = "brew_widget";
    static final String[] STAGES = {"Resting", "At its peak", "Still lovely", "Fading"};
    static final int[] STAGE_COL = {R.color.widget_rest, R.color.widget_peak, R.color.widget_good, R.color.widget_fade};
    static final int[] STAGE_DOT = {R.drawable.wdot_rest, R.drawable.wdot_peak, R.drawable.wdot_good, R.drawable.wdot_fade};
    static final int[] STAGE_CHIP = {R.drawable.wchip_rest, R.drawable.wchip_peak, R.drawable.wchip_good, R.drawable.wchip_fade};

    static SharedPreferences prefs(Context ctx) { return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    interface Maker { RemoteViews make(Context ctx, int heightDp); }

    /** The heights (dp) a widget has a layout for; the launcher uses the tallest that fits. */
    static final int[] HEIGHTS = {60, 100, 130, 170, 220, 280, 360};

    static void push(Context ctx, AppWidgetManager m, int id, Maker mk) {
        if (Build.VERSION.SDK_INT >= 31) {
            Map<SizeF, RemoteViews> map = new HashMap<>();
            for (int h : HEIGHTS) map.put(new SizeF(120f, h), mk.make(ctx, h));
            m.updateAppWidget(id, new RemoteViews(map));
        } else {
            Bundle o = m.getAppWidgetOptions(id);
            int h = o == null ? 0 : o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);
            m.updateAppWidget(id, mk.make(ctx, h > 0 ? h : 150));
        }
    }

    /** Redraws every Brew Bench widget on the home screen. */
    static void refresh(Context ctx) {
        AppWidgetManager m = AppWidgetManager.getInstance(ctx);
        AppWidgetProvider[] all = {new BrewWidget(), new CabinetWidget(), new QuickBrewWidget(), new WordWidget()};
        for (AppWidgetProvider w : all) {
            int[] ids = m.getAppWidgetIds(new ComponentName(ctx, w.getClass()));
            if (ids != null && ids.length > 0) w.onUpdate(ctx, m, ids);
        }
    }

    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) {
        for (int id : ids) push(ctx, m, id, BrewWidget::views);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager m, int id, Bundle o) {
        onUpdate(ctx, m, new int[] {id});
    }

    /** Days from the roast date (yyyy-mm-dd) to today, or -1 when there's no date. */
    static int daysSince(String iso) {
        if (iso == null || iso.length() < 10) return -1;
        try {
            Calendar r = Calendar.getInstance(TimeZone.getDefault());
            r.clear();
            r.set(Integer.parseInt(iso.substring(0, 4)), Integer.parseInt(iso.substring(5, 7)) - 1, Integer.parseInt(iso.substring(8, 10)), 12, 0);
            Calendar t = Calendar.getInstance(TimeZone.getDefault());
            t.set(Calendar.HOUR_OF_DAY, 12); t.set(Calendar.MINUTE, 0); t.set(Calendar.SECOND, 0); t.set(Calendar.MILLISECOND, 0);
            return (int) Math.round((t.getTimeInMillis() - r.getTimeInMillis()) / 86400000.0);
        } catch (Exception e) { return -1; }
    }

    static int[] window(String win) {
        int[] w = {7, 30, 60};
        try { String[] p = win.split(","); if (p.length == 3) for (int i = 0; i < 3; i++) w[i] = Integer.parseInt(p[i].trim()); } catch (Exception ignored) { }
        return w;
    }

    /** The day's stretch: 0 resting, 1 at its peak, 2 still lovely, 3 fading; -1 without a roast date. */
    static int stage(int d, int[] w) { return d < 0 ? -1 : d < w[0] ? 0 : d <= w[1] ? 1 : d <= w[2] ? 2 : 3; }

    /**
     * When to drink it, counted down: "Peaks in 3 days", "Peak for 5 more days", "Last peak day", "Fades in 4 days",
     * "Past its best". The widget refreshes every few hours, so the count moves on each day by itself.
     */
    static String countdown(int d, int[] w) {
        if (d < 0) return "";
        int s = stage(d, w);
        if (s == 0) { int n = w[0] - d; return n <= 1 ? "Peaks tomorrow" : "Peaks in " + n + " days"; }
        if (s == 1) { int n = w[1] - d; return n <= 0 ? "Last peak day" : "Peak for " + n + " more day" + (n == 1 ? "" : "s"); }
        if (s == 2) { int n = w[2] - d; return n <= 0 ? "Fades from tomorrow" : n <= 7 ? "Fades in " + n + " day" + (n == 1 ? "" : "s") : "Still lovely for " + n + " days"; }
        return "Past its best";
    }

    /** The day's stretch in words, as the app names it: "At its peak · day 12". Kept for the cabinet's older rows. */
    static String freshLine(String roastDate, String win) {
        int d = daysSince(roastDate), s = stage(d, window(win));
        return s < 0 ? "" : STAGES[s] + " · day " + d;
    }

    static PendingIntent open(Context ctx, String what, int code) {
        Intent i = new Intent(ctx, MainActivity.class);
        i.setAction("io.github.maheralshokry.brewbench.WIDGET." + code + "." + what.hashCode());
        i.putExtra(WidgetPlugin.EXTRA, what);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(ctx, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static int dp(Context ctx, int v) { return Math.round(v * ctx.getResources().getDisplayMetrics().density); }

    /**
     * The coffee's photo, sent by the app as a small JPEG, cropped square with rounded corners. Made once and kept: the
     * layouts for every height then share the same picture, which Android sends to the launcher only once.
     */
    private static String photoKey = null;
    private static Bitmap photoBm = null;

    static Bitmap photo(Context ctx, String dataUrl, int sizeDp, int radiusDp) {
        if (dataUrl == null || dataUrl.isEmpty()) return null;
        String key = dataUrl.length() + ":" + dataUrl.hashCode() + ":" + sizeDp;
        if (key.equals(photoKey)) return photoBm;
        photoBm = make(ctx, dataUrl, sizeDp, radiusDp);
        photoKey = key;
        return photoBm;
    }

    private static Bitmap make(Context ctx, String dataUrl, int sizeDp, int radiusDp) {
        try {
            int c = dataUrl.indexOf(',');
            byte[] b = Base64.decode(c >= 0 ? dataUrl.substring(c + 1) : dataUrl, Base64.DEFAULT);
            Bitmap src = BitmapFactory.decodeByteArray(b, 0, b.length);
            if (src == null) return null;
            int s = Math.min(src.getWidth(), src.getHeight()), px = dp(ctx, sizeDp);
            Bitmap sq = Bitmap.createScaledBitmap(Bitmap.createBitmap(src, (src.getWidth() - s) / 2, (src.getHeight() - s) / 2, s, s), px, px, true);
            Bitmap out = Bitmap.createBitmap(px, px, Bitmap.Config.ARGB_8888);
            Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
            p.setShader(new BitmapShader(sq, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP));
            float r = dp(ctx, radiusDp);
            new Canvas(out).drawRoundRect(new RectF(0, 0, px, px), r, r, p);
            return out;
        } catch (Exception e) { return null; }
    }

    static RemoteViews views(Context ctx, int h) {
        SharedPreferences p = prefs(ctx);
        String id = p.getString("id", ""), title = p.getString("title", ""), sub = p.getString("sub", ""), left = p.getString("left", "");
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_bean);
        boolean small = h < 130;
        v.setViewVisibility(R.id.w_kicker, small ? View.GONE : View.VISIBLE);
        v.setViewVisibility(R.id.w_pic, h < 100 ? View.GONE : View.VISIBLE);
        v.setViewVisibility(R.id.w_log, small ? View.GONE : View.VISIBLE);
        int[] pbs = {R.id.w_pb0, R.id.w_pb1, R.id.w_pb2, R.id.w_pb3};
        for (int pb : pbs) v.setViewVisibility(pb, View.GONE);
        v.setViewVisibility(R.id.w_chip, View.GONE);
        if (id.isEmpty()) {
            v.setTextViewText(R.id.w_title, "Nothing in your cabinet");
            v.setTextViewText(R.id.w_sub, "Add the bag you're drinking");
            v.setTextViewText(R.id.w_flag, "☕");
            v.setViewVisibility(R.id.w_photo, View.GONE);
            v.setViewVisibility(R.id.w_flag, View.VISIBLE);
            v.setTextViewText(R.id.w_fresh, "");
            v.setTextViewText(R.id.w_log, "Add a coffee");
            v.setOnClickPendingIntent(R.id.w_root, open(ctx, "beans", 1));
            v.setOnClickPendingIntent(R.id.w_log, open(ctx, "beans", 2));
            return v;
        }
        int[] w = window(p.getString("win", ""));
        int d = daysSince(p.getString("roastDate", "")), s = stage(d, w);
        v.setTextViewText(R.id.w_title, title);
        String fresh = s < 0 ? "Add its roast date for freshness" : countdown(d, w) + " · day " + d;
        if (!left.isEmpty()) fresh = fresh + " · " + left;
        v.setTextViewText(R.id.w_sub, small ? (s < 0 ? sub : countdown(d, w) + (left.isEmpty() ? "" : " · " + left)) : sub);
        v.setTextViewText(R.id.w_fresh, fresh);
        v.setViewVisibility(R.id.w_fresh, small ? View.GONE : View.VISIBLE);
        if (s >= 0 && !small) {
            v.setViewVisibility(R.id.w_chip, View.VISIBLE);
            v.setTextViewText(R.id.w_chip, STAGES[s]);
            v.setInt(R.id.w_chip, "setBackgroundResource", STAGE_CHIP[s]);
            v.setTextColor(R.id.w_chip, ctx.getColor(STAGE_COL[s]));
            v.setViewVisibility(pbs[s], View.VISIBLE);
            v.setProgressBar(pbs[s], 100, Math.max(3, Math.min(100, Math.round(d * 100f / Math.max(1, w[2])))), false);
        }
        Bitmap ph = h < 100 ? null : photo(ctx, p.getString("photo", ""), 64, 16);
        if (ph != null) { v.setImageViewBitmap(R.id.w_photo, ph); v.setViewVisibility(R.id.w_photo, View.VISIBLE); v.setViewVisibility(R.id.w_flag, View.GONE); }
        else { v.setViewVisibility(R.id.w_photo, View.GONE); v.setViewVisibility(R.id.w_flag, View.VISIBLE); String f = p.getString("flag", ""); v.setTextViewText(R.id.w_flag, f.isEmpty() ? "☕" : f); }
        v.setTextViewText(R.id.w_log, "Log brew");
        v.setOnClickPendingIntent(R.id.w_root, open(ctx, "bean:" + id, 1));
        v.setOnClickPendingIntent(R.id.w_log, open(ctx, "log:" + id, 2));
        return v;
    }
}
