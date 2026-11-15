package io.github.maheralshokry.brewbench;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * A brew timer that keeps going outside the app. The app sends each brew (its steps, where it is, running or paused);
 * from then on this keeps the lock-screen notification, the status-bar chip and the Quick brew widget up to date, and
 * runs the buttons on them (pause, resume, next step, and start from the widget) even while the app is closed. When the
 * app is open it follows along (WidgetPlugin passes each change back to it).
 *
 * On Android 16 the notification asks to be a Live Update: the brew's clock sits in a chip in the status bar, on the lock
 * screen and, on Samsung phones with One UI 8, in the Now Bar. Older phones show it as an ongoing notification with a
 * progress bar. Everything is kept in the widget's preferences (the t_ keys), so it survives the app being closed.
 */
final class BrewTimer {
    private BrewTimer() { }

    static final String CHANNEL = "brew_timer";
    static final int NOTE_ID = 4711;
    static final String PKG = "io.github.maheralshokry.brewbench";
    static final String TOGGLE = PKG + ".TIMER_TOGGLE", NEXT = PKG + ".TIMER_NEXT", START = PKG + ".TIMER_START", STOP = PKG + ".TIMER_STOP";
    /** A finished brew stays on show this long; one left running is forgotten this long after its end. */
    static final long DONE_KEEP = 15 * 60000L, STALE = 20 * 60000L;

    /** Where a brew is. Times are in milliseconds. */
    static final class St {
        String state = "stop", name = "", key = "", step = "", next = "";
        long start, el, total, at;
        long[] t = new long[0];
        String[] tx = new String[0];

        long elapsed(long now) {
            long e = "run".equals(state) ? now - start : el;
            return total > 0 ? Math.max(0, Math.min(total, e)) : Math.max(0, e);
        }

        /** The step under way at a moment (the last one started), or -1 before the first. */
        int cur(long e) { int c = -1; for (int i = 0; i < t.length; i++) if (t[i] <= e) c = i; return c; }

        /** Run or paused, and not long forgotten. */
        boolean live(long now) {
            if ("run".equals(state) || "pause".equals(state)) return now - at <= total + STALE;
            return false;
        }

        boolean showDone(long now) { return "done".equals(state) && now - at <= DONE_KEEP; }
    }

    static St read(Context ctx) {
        SharedPreferences p = BrewWidget.prefs(ctx);
        St s = new St();
        s.state = p.getString("t_state", "stop");
        s.name = p.getString("t_name", "");
        s.key = p.getString("t_key", "");
        s.step = p.getString("t_step", "");
        s.next = p.getString("t_next", "");
        s.start = p.getLong("t_start", 0L);
        s.el = p.getLong("t_el", 0L);
        s.total = p.getLong("t_total", 0L);
        s.at = p.getLong("t_at", 0L);
        try {
            JSONArray a = new JSONArray(p.getString("t_steps", "[]"));
            s.t = new long[a.length()];
            s.tx = new String[a.length()];
            for (int i = 0; i < a.length(); i++) { JSONArray x = a.getJSONArray(i); s.t[i] = x.getLong(0); s.tx[i] = x.getString(1); }
        } catch (Exception e) { s.t = new long[0]; s.tx = new String[0]; }
        return s;
    }

    static String clock(long ms) { long s = ms / 1000; return String.format(Locale.US, "%d:%02d", s / 60, s % 60); }

    /** The step now and the next one, worked out from the steps (when the app sent them) at a moment. */
    static void texts(St s, long e) {
        if (s.t.length == 0) return;
        int c = s.cur(e);
        s.step = c >= 0 ? s.tx[c] : "Get ready";
        int n = c + 1;
        while (n < s.t.length && s.t[n] <= e) n++;
        s.next = n < s.t.length ? "Next at " + clock(s.t[n]) + ": " + s.tx[n] : "Last step";
    }

    static void write(Context ctx, St s, long now) {
        SharedPreferences.Editor e = BrewWidget.prefs(ctx).edit();
        e.putString("t_state", s.state).putString("t_step", s.step).putString("t_next", s.next)
            .putLong("t_start", s.start).putLong("t_el", s.el).putLong("t_at", now);
        e.apply();
        s.at = now;
    }

    /**
     * A button on the notification or the widget. Toggle starts, pauses or resumes (a finished brew starts again); next
     * jumps to the next step's time (after the last, the brew is done); start begins your go-to recipe from the widget.
     */
    static void act(Context ctx, String what) {
        long now = System.currentTimeMillis();
        St s = read(ctx);
        if (START.equals(what) && !s.live(now)) {
            if (!loadGoTo(ctx, s)) { openApp(ctx); return; }
            s.state = "run"; s.el = 0; s.start = now;
        } else if (TOGGLE.equals(what) || START.equals(what)) {
            if ("run".equals(s.state)) { s.el = s.elapsed(now); s.state = "pause"; }
            else if (s.total > 0 || s.t.length > 0) {
                long e = "done".equals(s.state) || (s.total > 0 && s.el >= s.total) ? 0 : s.el;
                s.state = "run"; s.el = e; s.start = now - e;
            } else return;
        } else if (NEXT.equals(what)) {
            if (!s.live(now)) return;
            long e = s.elapsed(now), to = -1;
            for (long x : s.t) if (x > e + 500) { to = x; break; }
            if (to < 0) { s.state = "done"; s.el = s.total > 0 ? Math.min(e, s.total) : e; }
            else { s.el = to; if ("run".equals(s.state)) s.start = now - to; }
        } else if (STOP.equals(what)) {
            s.state = "stop";
        } else return;
        texts(s, s.elapsed(now));
        write(ctx, s, now);
        sync(ctx, true);
        WidgetPlugin.timerChanged(s, now);
    }

    /** The widget's Start: the go-to recipe the app last sent (its steps and length), if it sent them. */
    static boolean loadGoTo(Context ctx, St s) {
        try {
            JSONObject o = new JSONObject(BrewWidget.prefs(ctx).getString("brew", "{}"));
            JSONArray a = o.optJSONArray("steps");
            long total = o.optLong("total", 0L);
            if (a == null || a.length() == 0 || total <= 0) return false;
            s.name = o.optString("name", "");
            s.key = o.optString("key", "");
            s.total = total;
            BrewWidget.prefs(ctx).edit().putString("t_name", s.name).putString("t_key", s.key).putLong("t_total", total)
                .putString("t_steps", a.toString()).putString("t_plan", "").apply();
            s.t = new long[a.length()];
            s.tx = new String[a.length()];
            for (int i = 0; i < a.length(); i++) { JSONArray x = a.getJSONArray(i); s.t[i] = x.getLong(0); s.tx[i] = x.getString(1); }
            return true;
        } catch (Exception e) { return false; }
    }

    static void openApp(Context ctx) {
        try { BrewWidget.open(ctx, "brew", 30).send(); } catch (Exception ignored) { }
    }

    /* ---------- Keeping it up to date ---------- */

    private static final Handler H = new Handler(Looper.getMainLooper());
    private static Context appCtx = null;
    private static final Runnable TICK = () -> { if (appCtx != null) tick(appCtx); };

    /** Every few seconds while a brew runs, and at each new step: the step texts, the bar, and the end. */
    static void tick(Context ctx) {
        long now = System.currentTimeMillis();
        St s = read(ctx);
        if (!"run".equals(s.state)) return;
        long e = s.elapsed(now);
        if (s.total > 0 && e >= s.total) {
            s.state = "done"; s.el = s.total;
            texts(s, s.el);
            write(ctx, s, now);
            sync(ctx, true);
            WidgetPlugin.timerChanged(s, now);
            return;
        }
        String was = s.step;
        texts(s, e);
        if (!s.step.equals(was)) BrewWidget.prefs(ctx).edit().putString("t_step", s.step).putString("t_next", s.next).apply();
        sync(ctx, true);
    }

    /** Draws the notification (and, with widgets, the Quick brew widget), and sets the next tick. */
    static void sync(Context ctx, boolean widgets) {
        appCtx = ctx.getApplicationContext();
        long now = System.currentTimeMillis();
        St s = read(ctx);
        try { note(ctx, s, now); } catch (Exception ignored) { }
        if (widgets) refreshQuick(ctx);
        H.removeCallbacks(TICK);
        if ("run".equals(s.state) && s.live(now)) {
            // Every second: the bar and the time readout move with the brew (the clocks tick on their own).
            long e = s.elapsed(now), wait = 1000 - (e % 1000) + 20;
            for (long x : s.t) if (x > e) { wait = Math.min(wait, x - e + 60); break; }
            if (s.total > 0) wait = Math.min(wait, s.total - e + 60);
            H.postDelayed(TICK, Math.max(250, wait));
        }
    }

    static void refreshQuick(Context ctx) {
        AppWidgetManager m = AppWidgetManager.getInstance(ctx);
        int[] ids = m.getAppWidgetIds(new ComponentName(ctx, QuickBrewWidget.class));
        if (ids != null && ids.length > 0) new QuickBrewWidget().onUpdate(ctx, m, ids);
    }

    /* ---------- The notification ---------- */

    static PendingIntent action(Context ctx, String what, int code) {
        Intent i = new Intent(ctx, TimerReceiver.class).setAction(what);
        return PendingIntent.getBroadcast(ctx, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static boolean allowed(Context ctx) {
        if (Build.VERSION.SDK_INT >= 33 && ctx.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return false;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        return nm != null && (Build.VERSION.SDK_INT < 24 || nm.areNotificationsEnabled());
    }

    static void channel(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null || nm.getNotificationChannel(CHANNEL) != null) return;
        // Low: it updates as the brew goes, so it shouldn't sound each time. (The timer's own cues do that.)
        NotificationChannel c = new NotificationChannel(CHANNEL, "Brew timer", NotificationManager.IMPORTANCE_LOW);
        c.setDescription("The brew you're making: its clock, the step now and buttons to pause or skip, on the lock screen and in the status bar.");
        c.setShowBadge(false);
        c.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(c);
    }

    static final int ACCENT = 0xFFB0703A;

    @SuppressWarnings("deprecation")
    static void note(Context ctx, St s, long now) {
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;
        boolean run = "run".equals(s.state), pause = "pause".equals(s.state), done = s.showDone(now);
        if (!(s.live(now) || done) || !allowed(ctx)) {
            nm.cancel(NOTE_ID);
            // Android queues posts and cancels; a cancel right after a post (Next on the last step, then Stop) can be lost
            // while that post is still queued. Once it has landed, take it away again if the brew is still over.
            final Context app = ctx.getApplicationContext();
            H.postDelayed(() -> { long t = System.currentTimeMillis(); St x = read(app); if (!(x.live(t) || x.showDone(t))) nm.cancel(NOTE_ID); }, 600);
            return;
        }
        channel(ctx);
        long e = s.elapsed(now);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(ctx, CHANNEL) : new Notification.Builder(ctx);
        b.setSmallIcon(R.drawable.ic_stat_bean)
            .setColor(ACCENT)
            .setOnlyAlertOnce(true)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setCategory(done ? Notification.CATEGORY_STATUS : Notification.CATEGORY_STOPWATCH)
            .setContentIntent(BrewWidget.open(ctx, "resume", 40))
            .setSubText(s.name.isEmpty() ? "Brew" : s.name);
        if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_DEFAULT);
        if (done) {
            b.setOngoing(false).setAutoCancel(true)
                .setContentTitle("Brew complete")
                .setContentText((s.name.isEmpty() ? "Your brew" : s.name) + " in " + clock(e) + ". Enjoy it.")
                .setShowWhen(false);
            if (Build.VERSION.SDK_INT >= 26) b.setTimeoutAfter(Math.max(1000, DONE_KEEP - (now - s.at)));
            b.addAction(new Notification.Action.Builder(null, "Log this brew", BrewWidget.open(ctx, "log", 41)).build());
            b.addAction(new Notification.Action.Builder(null, "Brew again", action(ctx, TOGGLE, 42)).build());
        } else {
            // The clock counts down to the next step (on the last, to the end), ticking by itself: it is also what the
            // status-bar chip and the Now Bar show.
            int c = s.cur(e), n = s.t.length;
            long nextAt = -1;
            for (long x : s.t) if (x > e) { nextAt = x; break; }
            if (nextAt < 0 && s.total > e) nextAt = s.total;
            // One thing per line: the step as the title, what's next under it, the recipe beside the app's name, and
            // the clock counting down to the next pour. The amount to pour and the step count sit in a round badge.
            String nx = s.next.replaceFirst("^Next at \\d+:\\d\\d: ", "Next: ");
            String step = s.step.isEmpty() ? "Brewing" : s.step.replaceAll("\\.$", "");
            b.setOngoing(true)
                .setContentTitle(pause ? "Paused · " + step : step)
                .setContentText(nx.replaceAll("\\.$", ""))
                // The recipe's name without the brewer it's made on ("Tetsu Kasuya 10-pour", not "... on the NEO"), so the
                // header stays one short line next to the countdown.
                .setSubText(s.name.isEmpty() ? "Brew" : s.name.replaceFirst("\\s+on (the |an? )?\\S.*$", ""));
            if (n > 0 && c >= 0) try { b.setLargeIcon(badge(s.step, c + 1, n)); } catch (Exception ignored) { }
            if (run && nextAt > 0 && Build.VERSION.SDK_INT >= 24) b.setWhen(now + (nextAt - e)).setUsesChronometer(true).setChronometerCountDown(true).setShowWhen(true);
            else if (run) b.setWhen(now - e).setUsesChronometer(true).setShowWhen(true);
            else b.setShowWhen(false);
            b.addAction(new Notification.Action.Builder(null, run ? "Pause" : "Resume", action(ctx, TOGGLE, 43)).build());
            if (s.t.length > 0) b.addAction(new Notification.Action.Builder(null, "Next", action(ctx, NEXT, 44)).build());
            b.addAction(new Notification.Action.Builder(null, "Stop", action(ctx, STOP, 45)).build());
            progress(b, s, e);
            // Android 16: ask to be a Live Update (the clock in a status-bar chip, on the lock screen and in Samsung's
            // Now Bar). The chip shows the running clock; paused, it says so.
            Bundle x = new Bundle();
            x.putBoolean("android.requestPromotedOngoing", true);
            b.addExtras(x);
            if (Build.VERSION.SDK_INT >= 36 && pause) b.setShortCriticalText("Paused");
        }
        nm.notify(NOTE_ID, b.build());
    }

    /**
     * The round badge on the right of the notification: the amount this step pours large ("+30g", or "150g" for a pour
     * up to a total on the scale), and which step of how many under it ("1 of 10"), in the app's coffee colours.
     */
    static android.graphics.Bitmap badge(String step, int i, int n) {
        int z = 192;
        android.graphics.Bitmap bm = android.graphics.Bitmap.createBitmap(z, z, android.graphics.Bitmap.Config.ARGB_8888);
        android.graphics.Canvas cv = new android.graphics.Canvas(bm);
        android.graphics.Paint bg = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
        bg.setShader(new android.graphics.LinearGradient(0, 0, z, z, 0xFFC98A52, 0xFF8A5230, android.graphics.Shader.TileMode.CLAMP));
        cv.drawCircle(z / 2f, z / 2f, z / 2f, bg);
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(?i)(to\\s*)?(\\d+(?:\\.\\d+)?)\\s?(g|ml)\\b").matcher(step == null ? "" : step);
        boolean f = m.find();
        String big = f ? (m.group(1) != null ? "" : "+") + m.group(2) + m.group(3).toLowerCase(Locale.US) : String.valueOf(i);
        String small = f ? i + " of " + n : "of " + n;
        android.graphics.Paint t = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
        t.setColor(0xFFFFFFFF);
        t.setTextAlign(android.graphics.Paint.Align.CENTER);
        t.setTypeface(android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD));
        t.setTextSize(big.length() > 5 ? 46 : big.length() > 4 ? 54 : 62);
        cv.drawText(big, z / 2f, z * 0.52f, t);
        t.setTypeface(android.graphics.Typeface.DEFAULT);
        t.setTextSize(28);
        t.setAlpha(225);
        cv.drawText(small, z / 2f, z * 0.74f, t);
        return bm;
    }

    /** The bar: one segment per step, a dot where each starts (Android 16), else a plain progress bar. In seconds. */
    static void progress(Notification.Builder b, St s, long e) {
        int max = (int) Math.max(1, s.total / 1000), at = (int) Math.min(max, e / 1000);
        if (s.total <= 0) return;
        if (Build.VERSION.SDK_INT >= 36) {
            Notification.ProgressStyle ps = new Notification.ProgressStyle();
            List<Notification.ProgressStyle.Segment> segs = new ArrayList<>();
            List<Notification.ProgressStyle.Point> pts = new ArrayList<>();
            int last = 0;
            for (long t : s.t) {
                int p = (int) Math.min(max, t / 1000);
                if (p > last) { segs.add(new Notification.ProgressStyle.Segment(p - last).setColor(ACCENT)); last = p; }
                if (p > 0 && p < max) pts.add(new Notification.ProgressStyle.Point(p).setColor(0xFF6B3F24));
            }
            if (max > last) segs.add(new Notification.ProgressStyle.Segment(max - last).setColor(ACCENT));
            ps.setProgressSegments(segs).setProgressPoints(pts).setStyledByProgress(true).setProgress(at)
                // A bean rides along the bar to where the brew is.
                .setProgressTrackerIcon(android.graphics.drawable.Icon.createWithResource(PKG, R.drawable.ic_stat_bean));
            b.setStyle(ps);
        } else {
            b.setProgress(max, at, false);
        }
    }
}
