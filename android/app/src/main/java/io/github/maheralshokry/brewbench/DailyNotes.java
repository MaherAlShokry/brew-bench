package io.github.maheralshokry.brewbench;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Build;
import java.util.Arrays;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * The two daily notifications, the coffee of the day ("cabinet") and the coffee fact ("fact"), drawn in the app's own
 * layout (see post()): the coffee's photo or the fact's icon tile, the title, and, opened, your note or the full text,
 * tasting notes and buttons in your accent. Tapping one opens what it is about.
 *
 * The app sends the next two weeks of each kind with schedule(); they are kept here and set as alarms, and set again
 * after the phone restarts or the app is updated. An alarm that fires posts its notification and is then forgotten.
 */
public class DailyNotes extends BroadcastReceiver {
    static final String CHANNEL = "daily";
    private static final String PREFS = "daily_notes", ITEMS = "items", ACCENT = "accent";
    private static final String FIRE = "io.github.maheralshokry.brewbench.DAILY";

    static SharedPreferences prefs(Context ctx) { return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    /** Replaces the notes of one kind ("cabinet" or "fact") with these, each {id, at (ms), tag, title, body, open}. */
    static void schedule(Context ctx, String kind, JSONArray list, String accent) {
        JSONArray keep = new JSONArray();
        JSONArray all = read(ctx);
        for (int i = 0; i < all.length(); i++) {
            JSONObject o = all.optJSONObject(i);
            if (o == null) continue;
            if (kind.equals(o.optString("kind"))) cancelAlarm(ctx, o.optInt("id"));
            else keep.put(o);
        }
        long now = System.currentTimeMillis();
        for (int i = 0; list != null && i < list.length(); i++) {
            JSONObject o = list.optJSONObject(i);
            if (o == null || o.optLong("at") <= now) continue;
            try { o.put("kind", kind); } catch (Exception ignored) { }
            keep.put(o);
            setAlarm(ctx, o);
        }
        SharedPreferences.Editor e = prefs(ctx).edit().putString(ITEMS, keep.toString());
        if (accent != null && accent.matches("#[0-9A-Fa-f]{6}")) e.putString(ACCENT, accent);
        e.apply();
    }

    /** The app's look changed: the next notifications use the new colour (the icon is read when each one is posted). */
    static void accent(Context ctx, String accent) {
        if (accent != null && accent.matches("#[0-9A-Fa-f]{6}")) prefs(ctx).edit().putString(ACCENT, accent).apply();
    }

    private static JSONArray read(Context ctx) {
        try { return new JSONArray(prefs(ctx).getString(ITEMS, "[]")); } catch (Exception e) { return new JSONArray(); }
    }

    private static PendingIntent fireIntent(Context ctx, int id, int flags) {
        Intent i = new Intent(ctx, DailyNotes.class).setAction(FIRE + "." + id).putExtra("id", id);
        return PendingIntent.getBroadcast(ctx, id, i, flags | PendingIntent.FLAG_IMMUTABLE);
    }

    // Not to the minute: Google Play keeps exact alarms for alarm and calendar apps, and a daily note can be a little late.
    private static void setAlarm(Context ctx, JSONObject o) {
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am == null) return;
        PendingIntent pi = fireIntent(ctx, o.optInt("id"), PendingIntent.FLAG_UPDATE_CURRENT);
        if (Build.VERSION.SDK_INT >= 23) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, o.optLong("at"), pi);
        else am.set(AlarmManager.RTC_WAKEUP, o.optLong("at"), pi);
    }

    private static void cancelAlarm(Context ctx, int id) {
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        PendingIntent pi = fireIntent(ctx, id, PendingIntent.FLAG_NO_CREATE);
        if (am != null && pi != null) { am.cancel(pi); pi.cancel(); }
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        String a = intent.getAction();
        if (a == null) return;
        if (a.startsWith(FIRE)) { fire(ctx, intent.getIntExtra("id", -1)); return; }
        // After a restart or an update the alarms are gone: set the ones still to come again.
        if (Intent.ACTION_BOOT_COMPLETED.equals(a) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(a)) {
            JSONArray all = read(ctx), keep = new JSONArray();
            long now = System.currentTimeMillis();
            for (int i = 0; i < all.length(); i++) {
                JSONObject o = all.optJSONObject(i);
                if (o != null && o.optLong("at") > now) { keep.put(o); setAlarm(ctx, o); }
            }
            prefs(ctx).edit().putString(ITEMS, keep.toString()).apply();
        }
    }

    private static void fire(Context ctx, int id) {
        JSONArray all = read(ctx), keep = new JSONArray();
        JSONObject hit = null;
        for (int i = 0; i < all.length(); i++) {
            JSONObject o = all.optJSONObject(i);
            if (o == null) continue;
            if (o.optInt("id") == id) hit = o; else keep.put(o);
        }
        if (hit != null) {
            // The app schedules two weeks ahead and again each time it opens. If this was the last note of its kind (the
            // app hasn't been opened since), the next day's note is set here, at the same time, and opens the app, where
            // the day's own coffee or fact is waiting and the next two weeks are scheduled afresh.
            String kind = hit.optString("kind");
            boolean more = false;
            for (int i = 0; i < keep.length(); i++) { JSONObject o = keep.optJSONObject(i); if (o != null && kind.equals(o.optString("kind"))) more = true; }
            if (!more && kind.length() > 0) {
                try {
                    boolean fact = "fact".equals(kind);
                    long at = hit.optLong("at"), now = System.currentTimeMillis();
                    while (at <= now) at += 24L * 60 * 60 * 1000;
                    JSONObject next = new JSONObject().put("id", hit.optInt("id")).put("kind", kind).put("at", at).put("filler", true)
                        .put("tag", fact ? "Coffee fact" : "Coffee of the day")
                        .put("title", fact ? "A new coffee fact" : "Today\u2019s coffee is waiting")
                        .put("body", fact ? "Open Brew Bench for today\u2019s fact." : "Open Brew Bench to see which coffee to brew today.")
                        .put("open", fact ? "fact:null" : "beans");
                    keep.put(next);
                    setAlarm(ctx, next);
                } catch (Exception ignored) { }
            }
        }
        prefs(ctx).edit().putString(ITEMS, keep.toString()).apply();
        if (hit != null) post(ctx, hit);
    }

    static void channel(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null || nm.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel c = new NotificationChannel(CHANNEL, "Coffee of the day and facts", NotificationManager.IMPORTANCE_DEFAULT);
        c.setDescription("One coffee from your cabinet and one coffee fact a day, at the times you choose in Settings.");
        nm.createNotificationChannel(c);
    }

    /**
     * Posts one note in the app's own layout (the shade's header above it says what it is, e.g. "From your diary").
     * Closed: the coffee's photo or the fact's icon tile, the title and one line. Opened: the same larger, with a line of
     * facts, your note in a soft panel (a coffee) or the full text (a fact), the tasting notes as pills and up to two
     * buttons, the first in your accent. A note scheduled by an older app (no layout fields) shows its title and text.
     */
    static void post(Context ctx, JSONObject o) {
        if (!BrewTimer.allowed(ctx)) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;
        channel(ctx);
        String title = o.optString("title"), body = o.optString("body"), tag = o.optString("tag");
        int id = o.optInt("id"), accent = color(ctx);
        String open = o.optString("open", "beans");
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(ctx, CHANNEL) : new Notification.Builder(ctx);
        b.setSmallIcon(R.drawable.ic_stat_bean)
            .setColor(accent)
            .setContentTitle(title)
            .setContentText(o.optString("line", body))
            .setAutoCancel(true)
            .setShowWhen(true)
            .setWhen(System.currentTimeMillis())
            .setCategory(Notification.CATEGORY_RECOMMENDATION)
            .setContentIntent(BrewWidget.open(ctx, open, 600 + (id % 1000)));
        if (!tag.isEmpty()) b.setSubText(tag);
        try {
            b.setCustomContentView(small(ctx, o, accent));
            b.setCustomBigContentView(big(ctx, o, accent, id));
            b.setStyle(new Notification.DecoratedCustomViewStyle());
        } catch (Exception e) {
            b.setStyle(new Notification.BigTextStyle().bigText(body));
        }
        if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_DEFAULT);
        nm.notify(id, b.build());
    }

    private static final String[] ICONS = {"bean", "book", "leaf", "globe", "flask", "drop", "hourglass", "trophy", "check", "cup"};
    private static final int[] ICON_RES = {R.drawable.nfi_bean, R.drawable.nfi_book, R.drawable.nfi_leaf, R.drawable.nfi_globe, R.drawable.nfi_flask,
        R.drawable.nfi_drop, R.drawable.nfi_hourglass, R.drawable.nfi_trophy, R.drawable.nfi_check, R.drawable.nfi_cup};

    static int iconRes(String k) { int i = Arrays.asList(ICONS).indexOf(k); return ICON_RES[i < 0 ? 0 : i]; }

    /**
     * The picture on the left: the coffee's photo when the app sent one; else a tile. A coffee's tile is its own colour
     * with a cream bean; a fact's is a soft wash of its topic's colour with the icon in a deeper shade.
     */
    static Bitmap picture(Context ctx, JSONObject o, int sizeDp) {
        String ph = o.optString("photo", "");
        if (!ph.isEmpty()) {
            Bitmap p = BrewWidget.thumb(ctx, "n" + o.optString("open"), ph, sizeDp, Math.round(sizeDp * 0.3f));
            if (p != null) return p;
        }
        boolean night = NotifViews.night(ctx);
        int c = NotifViews.color(o.optString("tile", ""), 0xFF8A4B2D);
        String ic = o.optString("icon", "bean");
        if ("bean".equals(ic)) return NotifViews.tile(ctx, c, R.drawable.nfi_bean, 0xFFF3D9B8, sizeDp);
        return NotifViews.tile(ctx, NotifViews.soft(c, night), iconRes(ic), NotifViews.ink(c, night), sizeDp);
    }

    static android.widget.RemoteViews small(Context ctx, JSONObject o, int accent) {
        android.widget.RemoteViews v = new android.widget.RemoteViews(ctx.getPackageName(), R.layout.nf_daily);
        Bitmap pic = picture(ctx, o, 44);
        if (pic != null) v.setImageViewBitmap(R.id.nf_tile, pic);
        v.setTextViewText(R.id.nf_title, o.optString("title"));
        v.setTextViewText(R.id.nf_line, o.optString("line", o.optString("body")));
        return v;
    }

    static android.widget.RemoteViews big(Context ctx, JSONObject o, int accent, int id) {
        android.widget.RemoteViews v = new android.widget.RemoteViews(ctx.getPackageName(), R.layout.nf_daily_big);
        Bitmap pic = picture(ctx, o, 56);
        if (pic != null) v.setImageViewBitmap(R.id.nf_tile, pic);
        text(v, R.id.nf_eyebrow, o.optString("eyebrow", ""));
        v.setTextViewText(R.id.nf_title, o.optString("title"));
        String meta = o.optString("meta", ""), note = o.optString("note", "");
        boolean layout = o.has("line");
        // An older note: its text under the title, as before.
        String bodyText = o.has("note") ? "" : o.optString(layout ? "text" : "body", layout ? "" : o.optString("body"));
        text(v, R.id.nf_meta, meta);
        if (note.isEmpty()) v.setViewVisibility(R.id.nf_panel, android.view.View.GONE);
        else { text(v, R.id.nf_note_label, o.optString("noteLabel", "")); v.setTextViewText(R.id.nf_note, note); }
        text(v, R.id.nf_body, bodyText);
        JSONArray chips = o.optJSONArray("chips");
        v.removeAllViews(R.id.nf_chips);
        int nc = 0;
        for (int i = 0; chips != null && i < chips.length() && nc < 3; i++) {
            JSONArray c = chips.optJSONArray(i);
            if (c == null || c.optString(0).isEmpty()) continue;
            android.widget.RemoteViews chip = new android.widget.RemoteViews(ctx.getPackageName(), R.layout.nf_chip_item);
            chip.setImageViewBitmap(R.id.nf_dot, NotifViews.dot(ctx, NotifViews.color(c.optString(1), 0xFFA59C93)));
            chip.setTextViewText(R.id.nf_chip_t, c.optString(0));
            v.addView(R.id.nf_chips, chip);
            nc++;
        }
        if (nc == 0) v.setViewVisibility(R.id.nf_chips, android.view.View.GONE);
        JSONArray acts = o.optJSONArray("acts");
        JSONArray a1 = acts != null ? acts.optJSONArray(0) : null, a2 = acts != null ? acts.optJSONArray(1) : null;
        if (a1 == null) v.setViewVisibility(R.id.nf_acts, android.view.View.GONE);
        else {
            v.setTextViewText(R.id.nf_b1_t, a1.optString(0));
            v.setInt(R.id.nf_b1_bg, "setColorFilter", accent);
            v.setOnClickPendingIntent(R.id.nf_b1, BrewWidget.open(ctx, a1.optString(1, "beans"), 620 + (id % 1000)));
            v.setContentDescription(R.id.nf_b1, a1.optString(0));
            if (a2 == null) v.setViewVisibility(R.id.nf_b2, android.view.View.GONE);
            else {
                v.setTextViewText(R.id.nf_b2, a2.optString(0));
                v.setOnClickPendingIntent(R.id.nf_b2, BrewWidget.open(ctx, a2.optString(1, "beans"), 640 + (id % 1000)));
            }
        }
        return v;
    }

    /** Sets a line's text, or hides the line when there is none. */
    static void text(android.widget.RemoteViews v, int id, String t) {
        if (t == null || t.isEmpty()) v.setViewVisibility(id, android.view.View.GONE);
        else v.setTextViewText(id, t);
    }

    private static int color(Context ctx) {
        try { return Color.parseColor(prefs(ctx).getString(ACCENT, "#8A5A3B")); } catch (Exception e) { return 0xFF8A5A3B; }
    }
}
