package io.github.maheralshokry.brewbench;

import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.RemoteViews;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.FileOutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Draws every home-screen widget the way a launcher would (its RemoteViews applied into a frame of the widget's size),
 * at the sizes people use, in light and dark, with and without a coffee, and saves each as a PNG in the app's files
 * (widget-shots/). CI runs this on an emulator and keeps the pictures, so a layout change can be checked without a phone.
 */
@RunWith(AndroidJUnit4.class)
public class WidgetShots {

    interface Maker { RemoteViews make(Context ctx, int heightDp); }

    // Width × height in dp: 2×1, 2×2, 3×2, 4×1, 4×2, 4×3 and 5×4 cells on a typical phone.
    static final int[][] SIZES = {{110, 60}, {110, 130}, {180, 130}, {250, 60}, {250, 130}, {250, 220}, {320, 280}};

    static String daysAgo(int d) {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date(System.currentTimeMillis() - d * 86400000L));
    }

    static void seed(Context ctx, boolean full, boolean brewing) throws Exception {
        SharedPreferences.Editor e = BrewWidget.prefs(ctx).edit().clear();
        if (full) {
            e.putString("id", "w1").putString("title", "Kenya Nyeri AA").putString("sub", "Archers Coffee · Kenya")
                .putString("flag", "🇰🇪").putString("roastDate", daysAgo(14)).putString("win", "7,21,35").putString("left", "6 cups left");
            JSONArray cab = new JSONArray();
            String[][] beans = {{"Kenya Nyeri AA", "14", "6 cups"}, {"Ethiopia Guji Natural", "5", "11 cups"}, {"House Blend", "30", "2 cups"},
                {"Colombia Huila Pink Bourbon", "40", "Empty"}, {"Panama Geisha", "9", "4 cups"}, {"Yemen Haraz", "20", "8 cups"}};
            for (int i = 0; i < beans.length; i++)
                cab.put(new JSONObject().put("id", "c" + i).put("title", beans[i][0]).put("roastDate", daysAgo(Integer.parseInt(beans[i][1]))).put("win", "7,21,35").put("cups", beans[i][2]));
            e.putString("cabinet", cab.toString());
            e.putString("brew", new JSONObject().put("key", "r:kasuya-4-6").put("name", "Tetsu Kasuya 4:6").put("brewer", "Hario V60")
                .put("dose", "20 g").put("water", "300 g").put("temp", "92°C").put("line", "Hario V60 · 20 g : 300 g · 92°C").toString());
        }
        long day = System.currentTimeMillis() / 86400000L;
        e.putString("words", new JSONArray().put(new JSONArray().put(day).put("Bloom")
            .put("The first small pour that wets the grounds and lets trapped gas escape before the main pours.").put("Brewing")).toString());
        if (brewing) {
            long now = System.currentTimeMillis();
            e.putString("t_state", "run").putString("t_name", "Tetsu Kasuya 4:6").putString("t_step", "Pour to 120 g")
                .putString("t_next", "1:30 pour to 180 g").putLong("t_start", now - 75000).putLong("t_el", 75000).putLong("t_total", 210000).putLong("t_at", now);
        }
        e.commit();
    }

    static Context themed(Context base, boolean dark) {
        Configuration c = new Configuration(base.getResources().getConfiguration());
        c.uiMode = (c.uiMode & ~Configuration.UI_MODE_NIGHT_MASK) | (dark ? Configuration.UI_MODE_NIGHT_YES : Configuration.UI_MODE_NIGHT_NO);
        return base.createConfigurationContext(c);
    }

    static File shot(Context ctx, File dir, String name, Maker mk, int wDp, int hDp, boolean dark) throws Exception {
        float dens = ctx.getResources().getDisplayMetrics().density;
        int w = Math.round(wDp * dens), h = Math.round(hDp * dens), pad = Math.round(12 * dens);
        Context tc = themed(ctx, dark);
        final Bitmap[] out = new Bitmap[1];
        final Exception[] err = new Exception[1];
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            try {
                FrameLayout host = new FrameLayout(tc);
                View v = mk.make(ctx, hDp).apply(tc, host);
                host.addView(v, new FrameLayout.LayoutParams(w, h));
                host.measure(View.MeasureSpec.makeMeasureSpec(w, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(h, View.MeasureSpec.EXACTLY));
                host.layout(0, 0, w, h);
                // A wallpaper-like backdrop around the widget, so its rounded corners and edges show.
                Bitmap b = Bitmap.createBitmap(w + 2 * pad, h + 2 * pad, Bitmap.Config.ARGB_8888);
                Canvas cv = new Canvas(b);
                cv.drawColor(dark ? Color.rgb(28, 30, 36) : Color.rgb(196, 206, 218));
                cv.translate(pad, pad);
                host.draw(cv);
                out[0] = b;
            } catch (Exception e) { err[0] = e; }
        });
        if (err[0] != null) throw err[0];
        File f = new File(dir, name + "-" + wDp + "x" + hDp + (dark ? "-dark" : "") + ".png");
        try (FileOutputStream o = new FileOutputStream(f)) { out[0].compress(Bitmap.CompressFormat.PNG, 100, o); }
        return f;
    }

    @Test
    public void drawEveryWidget() throws Exception {
        Context ctx = InstrumentationRegistry.getInstrumentation().getTargetContext();
        File dir = new File(ctx.getExternalFilesDir(null), "widget-shots");
        dir.mkdirs();
        for (File f : dir.listFiles()) f.delete();
        Object[][] widgets = {
            {"drinking-now", (Maker) BrewWidget::views}, {"cabinet", (Maker) CabinetWidget::views},
            {"quick-brew", (Maker) QuickBrewWidget::views}, {"word", (Maker) WordWidget::views}};
        int n = 0;
        for (String state : new String[] {"full", "empty", "brewing"}) {
            seed(ctx, !state.equals("empty"), state.equals("brewing"));
            for (Object[] wd : widgets) {
                String name = (String) wd[0];
                if (state.equals("brewing") && !name.equals("quick-brew")) continue;
                if (state.equals("empty") && name.equals("word")) continue;
                for (int[] s : SIZES) for (boolean dark : new boolean[] {false, true}) {
                    File f = shot(ctx, dir, name + "-" + state, (Maker) wd[1], s[0], s[1], dark);
                    assertTrue(f.length() > 500);
                    n++;
                }
            }
        }
        assertTrue(n > 0);
    }
}
