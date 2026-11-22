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
    /** What the brew's notification last showed (below Android 16), so a second that changes nothing isn't posted again. */
    private static String LAST_SIG = null;

    @SuppressWarnings("deprecation")
    static void note(Context ctx, St s, long now) {
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;
        boolean run = "run".equals(s.state), pause = "pause".equals(s.state), done = s.showDone(now);
        if (!(s.live(now) || done) || !allowed(ctx)) {
            LAST_SIG = null;
            nm.cancel(NOTE_ID);
            // Android queues posts and cancels; a cancel right after a post (Next on the last step, then Stop) can be lost
            // while that post is still queued. Once it has landed, take it away again if the brew is still over.
            final Context app = ctx.getApplicationContext();
            H.postDelayed(() -> { long t = System.currentTimeMillis(); St x = read(app); if (!(x.live(t) || x.showDone(t))) nm.cancel(NOTE_ID); }, 600);
            return;
        }
        channel(ctx);
        long e = s.elapsed(now);
        // The brew has the app's own layout. On Android 16 a notification can instead be a Live Update (the clock in a
        // status-bar chip, on the lock screen, in Samsung's Now Bar), but only in Android's own layout: a notification
        // with its own layout never becomes one. So that is a choice in the app's settings ("t_live"), off by default.
        boolean custom = Build.VERSION.SDK_INT < 36 || !BrewWidget.prefs(ctx).getBoolean("t_live", false);
        // In the app's layout the clocks tick by themselves; it is posted again only when what it shows changes (the
        // step, the ring's arc, the bar, the state, light or dark), and at least every 30 seconds.
        if (custom) {
            int c0 = s.cur(e);
            long na = -1; for (long x : s.t) if (x > e) { na = x; break; }
            if (na < 0) na = s.total;
            long sa = c0 >= 0 ? s.t[c0] : 0;
            String sig = s.state + "|" + done + "|" + c0 + "|" + s.name + "|" + s.step + "|" + (na > sa ? (e - sa) * 24 / (na - sa) : 24)
                + "|" + (s.total > 0 ? e * 200 / s.total : 0) + "|" + NotifViews.night(ctx) + "|" + (now / 30000);
            if (sig.equals(LAST_SIG)) return;
            LAST_SIG = sig;
        } else LAST_SIG = null;  // back in the app's layout (the Now Bar turned off), it is posted again at once
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(ctx, CHANNEL) : new Notification.Builder(ctx);
        b.setSmallIcon(R.drawable.ic_stat_bean)
            .setColor(ACCENT)
            .setOnlyAlertOnce(true)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setCategory(done ? Notification.CATEGORY_STATUS : Notification.CATEGORY_STOPWATCH)
            .setContentIntent(BrewWidget.open(ctx, "resume", 40))
            .setSubText(s.name.isEmpty() ? "Brew" : s.name);
        if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_DEFAULT);
        String recipe = s.name.isEmpty() ? "Brew" : s.name.replaceFirst("\\s+on (the |an? )?\\S.*$", "");
        if (done) {
            String line = (s.name.isEmpty() ? "Your brew" : recipe) + " in " + clock(e) + ". Enjoy it.";
            b.setOngoing(false).setAutoCancel(true)
                .setContentTitle("Brew complete")
                .setContentText(line)
                .setShowWhen(false);
            if (Build.VERSION.SDK_INT >= 26) b.setTimeoutAfter(Math.max(1000, DONE_KEEP - (now - s.at)));
            if (custom) {
                try {
                    JSONObject o = new JSONObject().put("title", "Brew complete · " + clock(e)).put("line", recipe).put("meta", recipe)
                        .put("icon", "check").put("tile", "#4F8A3E").put("acts", new JSONArray()
                            .put(new JSONArray().put("Log this brew").put("log")));
                    b.setCustomContentView(DailyNotes.small(ctx, o, ACCENT));
                    android.widget.RemoteViews big = DailyNotes.big(ctx, o, ACCENT, 41);
                    // Brew again restarts here, without opening the app.
                    big.setTextViewText(R.id.nf_b2, "Brew again");
                    big.setViewVisibility(R.id.nf_b2, android.view.View.VISIBLE);
                    big.setOnClickPendingIntent(R.id.nf_b2, action(ctx, TOGGLE, 42));
                    big.setOnClickPendingIntent(R.id.nf_b1, BrewWidget.open(ctx, "log", 41));
                    b.setCustomBigContentView(big);
                    b.setStyle(new Notification.DecoratedCustomViewStyle());
                } catch (Exception ignored) { custom = false; }
            }
            if (!custom) {
                b.addAction(new Notification.Action.Builder(null, "Log this brew", BrewWidget.open(ctx, "log", 41)).build());
                b.addAction(new Notification.Action.Builder(null, "Brew again", action(ctx, TOGGLE, 42)).build());
            }
        } else {
            // The clock counts down to the next step (on the last, to the end), ticking by itself: it is also what the
            // status-bar chip and the Now Bar show.
            int c = s.cur(e), n = s.t.length;
            long nextAt = -1, stepAt = c >= 0 ? s.t[c] : 0;
            for (long x : s.t) if (x > e) { nextAt = x; break; }
            if (nextAt < 0 && s.total > e) nextAt = s.total;
            float frac = nextAt > stepAt ? (e - stepAt) / (float) (nextAt - stepAt) : 1f;
            String step = s.step.isEmpty() ? "Brewing" : s.step.replaceAll("\\.$", "");
            String nx = s.next.replaceFirst("^Next at (\\d+:\\d\\d): ", "Next at $1 · ").replaceAll("\\.$", "");
            // Android's own layout cuts the title to one short line: it holds the step's action ("Pour 45g at 90°C"),
            // and the rest of the step ("Valve closed", "Then cool the kettle") leads the line below.
            String[] st = split(step);
            int d = nx.indexOf(" · ");
            String pre = nx.startsWith("Next at") && d > 0 ? nx.substring(0, d + 3) : "";
            String[] sn = split(nx.substring(pre.length()));
            String head = calm(st[0]), aside = st[1].isEmpty() ? "" : calm(st[1]) + " · ";
            String nxs = pre + calm(sn[0]) + (sn[1].isEmpty() ? "" : ". " + calm(sn[1]));
            b.setOngoing(true)
                .setContentTitle(pause ? "Paused at " + clock(e) : head)  // paused, no clock runs: the title holds the time
                .setContentText(pause ? step : aside + nxs)
                .setSubText(recipe);
            android.graphics.Bitmap ring = n > 0 ? NotifViews.ring(ctx, Math.max(1, c + 1), n, Math.max(0, Math.min(1, frac)), ACCENT, pause) : null;
            if (custom) {
                b.setShowWhen(false);
                try { custom(ctx, b, s, e, now, nextAt, c, n, ring, step, nx, run, pause); }
                catch (Exception ex) { custom = false; }
            }
            if (!custom) {
                if (ring != null) b.setLargeIcon(ring);
                if (run && nextAt > 0 && Build.VERSION.SDK_INT >= 24) b.setWhen(now + (nextAt - e)).setUsesChronometer(true).setChronometerCountDown(true).setShowWhen(true);
                else if (run) b.setWhen(now - e).setUsesChronometer(true).setShowWhen(true);
                else b.setShowWhen(false);
                b.addAction(new Notification.Action.Builder(android.graphics.drawable.Icon.createWithResource(ctx, run ? R.drawable.nfi_pause : R.drawable.nfi_play), run ? "Pause" : "Resume", action(ctx, TOGGLE, 43)).build());
                if (s.t.length > 0) b.addAction(new Notification.Action.Builder(android.graphics.drawable.Icon.createWithResource(ctx, R.drawable.nfi_next), "Next", action(ctx, NEXT, 44)).build());
                b.addAction(new Notification.Action.Builder(android.graphics.drawable.Icon.createWithResource(ctx, R.drawable.nfi_stop), "Stop", action(ctx, STOP, 45)).build());
                progress(b, s, e);
                // Android 16: ask to be a Live Update (the clock in a status-bar chip, on the lock screen and in Samsung's
                // Now Bar). The chip shows the running clock; paused, it says so.
                Bundle x = new Bundle();
                x.putBoolean("android.requestPromotedOngoing", true);
                b.addExtras(x);
                if (Build.VERSION.SDK_INT >= 36 && pause) b.setShortCriticalText("Paused");
            }
        }
        nm.notify(NOTE_ID, b.build());
    }

    /** "OPEN the valve" reads as "Open the valve": capitals that shout in the app read oddly in a notification. */
    static String calm(String t) {
        String x = t.replace("CLOSED", "closed").replace("CLOSE", "close").replace("OPEN", "open");
        return x.isEmpty() ? x : Character.toUpperCase(x.charAt(0)) + x.substring(1);
    }

    /**
     * A step split into its action (the sentence with an amount to pour, else the first) and the rest, for Android's
     * own layout: "Valve CLOSED. Pour 45g at 90°C" gives "Pour 45g at 90°C" and "Valve closed".
     */
    static String[] split(String t) {
        String[] p = t.split("(?<=\\.)\\s+(?=[A-Z])");
        if (p.length < 2) return new String[] { t.replaceAll("\\.$", ""), "" };
        int k = 0;
        for (int i = 0; i < p.length; i++) if (p[i].matches(".*\\d+\\s?g\\b.*")) { k = i; break; }
        StringBuilder rest = new StringBuilder();
        for (int i = 0; i < p.length; i++) if (i != k) {
            String x = p[i].replaceAll("\\.$", "").replace("CLOSED", "closed").replace("OPEN", "open");
            rest.append(rest.length() > 0 ? ". " : "").append(x);
        }
        return new String[] { p[k].replaceAll("\\.$", ""), rest.toString() };
    }

    /**
     * The brew in the app's own layout (unless a Live Update was chosen on Android 16). Closed: the step ring, the
     * step and what's next, and the
     * countdown to the next step. Opened: the brew's clock large with its length, the countdown, the bar split into the
     * recipe's steps, the step now and the next one, and round buttons (pause or resume, next, stop). The clocks are
     * Android's own and tick by themselves; the rest is redrawn as the brew moves on.
     */
    static void custom(Context ctx, Notification.Builder b, St s, long e, long now, long nextAt, int c, int n,
                       android.graphics.Bitmap ring, String step, String nx, boolean run, boolean pause) {
        String pkg = ctx.getPackageName();
        long rt = android.os.SystemClock.elapsedRealtime();
        int tint = NotifViews.night(ctx) ? 0xFFE2A877 : ACCENT;
        android.widget.RemoteViews sm = new android.widget.RemoteViews(pkg, R.layout.nf_timer);
        if (ring != null) sm.setImageViewBitmap(R.id.nf_ring, ring); else sm.setViewVisibility(R.id.nf_ring, android.view.View.GONE);
        // One line each: the step's action as the title ("Pour 45g at 90°C"), the rest of it ("Valve closed") leading
        // the line with what's next, as in Android's own layout.
        String[] st = split(step);
        String nxc = nx.startsWith("Next at") && nx.indexOf(" · ") > 0 ? nx.substring(0, nx.indexOf(" · ") + 3) + calm(nx.substring(nx.indexOf(" · ") + 3)) : nx;
        sm.setTextViewText(R.id.nf_title, pause ? "Paused at " + clock(e) : calm(st[0]));
        sm.setTextViewText(R.id.nf_line, pause ? calm(step) : (st[1].isEmpty() ? "" : calm(st[1]) + " · ") + nxc);
        boolean cd = run && nextAt > e;
        if (cd) {
            sm.setChronometer(R.id.nf_cd, rt + (nextAt - e), null, true);
            sm.setChronometerCountDown(R.id.nf_cd, true);
            sm.setTextColor(R.id.nf_cd, tint);
        } else sm.setViewVisibility(R.id.nf_cd, android.view.View.GONE);

        android.widget.RemoteViews bg = new android.widget.RemoteViews(pkg, R.layout.nf_timer_big);
        bg.setChronometer(R.id.nf_clock, rt - e, null, run);
        String of = (s.total > 0 ? "of " + clock(s.total) : "") + (n > 0 && c >= 0 ? (s.total > 0 ? " · " : "") + "step " + (c + 1) + " of " + n : "");
        DailyNotes.text(bg, R.id.nf_of, pause ? "Paused" + (of.isEmpty() ? "" : " · " + of) : of);
        if (cd) {
            bg.setTextViewText(R.id.nf_nextlbl, nextAt >= s.total && s.total > 0 ? "Done in" : "Next in");
            bg.setChronometer(R.id.nf_cd, rt + (nextAt - e), null, true);
            bg.setChronometerCountDown(R.id.nf_cd, true);
            bg.setTextColor(R.id.nf_cd, tint);
        } else bg.setViewVisibility(R.id.nf_nextbox, android.view.View.GONE);
        if (s.total > 0) bg.setImageViewBitmap(R.id.nf_bar, NotifViews.bar(ctx, s.t, s.total, e, tint));
        else bg.setViewVisibility(R.id.nf_bar, android.view.View.GONE);
        bg.setTextViewText(R.id.nf_nowtag, "Now");
        bg.setTextViewText(R.id.nf_now, calm(step));
        // The next step: its time in a small pill, then what it is.
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("^Next at (\\d+:\\d\\d) · (.*)$").matcher(nx);
        if (m.find()) { bg.setTextViewText(R.id.nf_nexttag, m.group(1)); bg.setTextViewText(R.id.nf_next, calm(m.group(2))); }
        else if (!nx.isEmpty()) { bg.setTextViewText(R.id.nf_nexttag, "Last"); bg.setTextViewText(R.id.nf_next, "Then it's done"); }
        else bg.setViewVisibility(R.id.nf_nextrow, android.view.View.GONE);
        bg.setInt(R.id.nf_toggle_bg, "setColorFilter", ACCENT);
        bg.setImageViewResource(R.id.nf_toggle_ic, run ? R.drawable.nfi_pause : R.drawable.nfi_play);
        bg.setContentDescription(R.id.nf_toggle, run ? "Pause" : "Resume");
        bg.setOnClickPendingIntent(R.id.nf_toggle, action(ctx, TOGGLE, 43));
        if (s.t.length > 0) { bg.setOnClickPendingIntent(R.id.nf_skip, action(ctx, NEXT, 44)); bg.setContentDescription(R.id.nf_skip, "Next step"); }
        else bg.setViewVisibility(R.id.nf_skip, android.view.View.GONE);
        bg.setOnClickPendingIntent(R.id.nf_stop, action(ctx, STOP, 45));
        bg.setContentDescription(R.id.nf_stop, "Stop");
        b.setCustomContentView(sm);
        b.setCustomBigContentView(bg);
        b.setStyle(new Notification.DecoratedCustomViewStyle());
    }

    /**
     * The marker that rides the bar: a white disc with a thin ring, a coffee-coloured centre and a bean in it, drawn
     * centred in a square (the status-bar icon, white on a pale bar, could vanish or sit off the line).
     */
    private static android.graphics.Bitmap TRACKER = null;
    static android.graphics.Bitmap tracker() {
        if (TRACKER != null) return TRACKER;
        int z = 96;
        float c = z / 2f;
        android.graphics.Bitmap bm = android.graphics.Bitmap.createBitmap(z, z, android.graphics.Bitmap.Config.ARGB_8888);
        android.graphics.Canvas cv = new android.graphics.Canvas(bm);
        android.graphics.Paint p = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
        p.setColor(0x33000000);
        cv.drawCircle(c, c + 2, c - 2, p);
        p.setColor(0xFFFFFFFF);
        cv.drawCircle(c, c, c - 4, p);
        p.setColor(ACCENT);
        cv.drawCircle(c, c, c - 14, p);
        cv.save();
        cv.rotate(-38, c, c);
        p.setColor(0xFFFFFFFF);
        cv.drawOval(new android.graphics.RectF(c - 11, c - 16, c + 11, c + 16), p);
        p.setColor(ACCENT);
        p.setStyle(android.graphics.Paint.Style.STROKE);
        p.setStrokeWidth(3.5f);
        p.setStrokeCap(android.graphics.Paint.Cap.ROUND);
        android.graphics.Path crease = new android.graphics.Path();
        crease.moveTo(c - 1, c - 13);
        crease.cubicTo(c + 6, c - 4, c - 6, c + 4, c + 1, c + 13);
        cv.drawPath(crease, p);
        cv.restore();
        TRACKER = bm;
        return bm;
    }

    /**
     * The bar: one segment per step, the gaps between them marking each pour (Android 16), else a plain bar. In seconds.
     * Samsung's One UI draws nothing for the segmented style (the brew showed no progress at all on its lock screen and
     * in the shade), so Samsung phones get the plain bar, which every Android draws.
     */
    static void progress(Notification.Builder b, St s, long e) {
        int max = (int) Math.max(1, s.total / 1000), at = (int) Math.min(max, e / 1000);
        if (s.total <= 0) return;
        if (Build.VERSION.SDK_INT >= 36 && !"samsung".equalsIgnoreCase(Build.MANUFACTURER)) {
            Notification.ProgressStyle ps = new Notification.ProgressStyle();
            List<Notification.ProgressStyle.Segment> segs = new ArrayList<>();
            int last = 0;
            for (long t : s.t) {
                int p = (int) Math.min(max, t / 1000);
                if (p > last) { segs.add(new Notification.ProgressStyle.Segment(p - last).setColor(ACCENT)); last = p; }
            }
            if (max > last) segs.add(new Notification.ProgressStyle.Segment(max - last).setColor(ACCENT));
            ps.setProgressSegments(segs).setStyledByProgress(true).setProgress(at)
                // A bean rides along the bar to where the brew is.
                .setProgressTrackerIcon(android.graphics.drawable.Icon.createWithBitmap(tracker()));
            b.setStyle(ps);
        } else {
            b.setProgress(max, at, false);
        }
    }
}
