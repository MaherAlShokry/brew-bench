package io.github.maheralshokry.brewbench;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.os.Build;
import java.util.Arrays;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * The two daily notifications, the coffee of the day ("cabinet") and the coffee fact ("fact"), drawn by the app itself
 * so they look like the app: the picture is the home-screen icon you chose (your logo, in your vibe's colours, light or
 * dark), the accent is your vibe's colour, and the text is laid out as a header (what it is, e.g. "From your cabinet"),
 * a title (the coffee or the fact) and the full text when opened. Tapping one opens what it is about.
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

    /** Posts one note: header (tag), title, text, your icon as the picture and your vibe's colour. */
    static void post(Context ctx, JSONObject o) {
        if (!BrewTimer.allowed(ctx)) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;
        channel(ctx);
        String title = o.optString("title"), body = o.optString("body"), tag = o.optString("tag");
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(ctx, CHANNEL) : new Notification.Builder(ctx);
        b.setSmallIcon(R.drawable.ic_stat_bean)
            .setColor(color(ctx))
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new Notification.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setShowWhen(true)
            .setWhen(System.currentTimeMillis())
            .setCategory(Notification.CATEGORY_RECOMMENDATION)
            .setContentIntent(BrewWidget.open(ctx, o.optString("open", "beans"), 600 + (o.optInt("id") % 1000)));
        if (!tag.isEmpty()) b.setSubText(tag);
        Bitmap icon = appIcon(ctx);
        if (icon != null) b.setLargeIcon(icon);
        if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_DEFAULT);
        nm.notify(o.optInt("id"), b.build());
    }

    private static int color(Context ctx) {
        try { return Color.parseColor(prefs(ctx).getString(ACCENT, "#8A5A3B")); } catch (Exception e) { return 0xFF8A5A3B; }
    }

    /** The home-screen icon in use (the logo, vibe and light or dark you chose), as a picture for the notification. */
    static Bitmap appIcon(Context ctx) {
        try {
            String key = ctx.getSharedPreferences("app_icon", Context.MODE_PRIVATE).getString("icon", "bean:roastery:l");
            int i = Arrays.asList(IconNames.KEYS).indexOf(key);
            if (i < 0) i = 0;
            // Only the icon in use is switched on (and the switch waits until the app is left), so the chosen one is
            // read even while it is off; failing that, the app's own icon.
            PackageManager pm = ctx.getPackageManager();
            Drawable d;
            try {
                ActivityInfo ai = pm.getActivityInfo(new ComponentName(ctx, ctx.getPackageName() + IconNames.ALIASES[i]),
                    PackageManager.MATCH_DISABLED_COMPONENTS);
                d = ai.loadIcon(pm);
            } catch (Exception e) {
                d = pm.getApplicationIcon(ctx.getApplicationInfo());
            }
            int px = BrewWidget.dp(ctx, 64);
            Bitmap bm = Bitmap.createBitmap(px, px, Bitmap.Config.ARGB_8888);
            d.setBounds(0, 0, px, px);
            d.draw(new Canvas(bm));
            return bm;
        } catch (Exception e) {
            return null;
        }
    }
}
