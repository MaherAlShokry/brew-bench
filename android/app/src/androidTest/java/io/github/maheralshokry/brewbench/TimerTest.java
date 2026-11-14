package io.github.maheralshokry.brewbench;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import android.app.Notification;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * The brew timer outside the app (BrewTimer): the widget's Start, then Next step, Pause, Resume, the end of the brew and
 * Stop, each as its button sends it, with the notification checked after each. On Android 16 the running brew's
 * notification must qualify as a Live Update (the status-bar chip). It leaves a brew running at the end, so CI can take a
 * picture of the notification.
 */
@RunWith(AndroidJUnit4.class)
public class TimerTest {
    static final String[] STEPS = {"Bloom with 50 g", "Pour to 150 g", "Pour to 300 g"};
    static final long[] AT = {0, 45000, 90000};

    static void seed(Context ctx) throws Exception {
        JSONArray st = new JSONArray();
        for (int i = 0; i < AT.length; i++) st.put(new JSONArray().put(AT[i]).put(STEPS[i]));
        BrewWidget.prefs(ctx).edit().clear()
            .putString("brew", new JSONObject().put("key", "r:test").put("name", "Tetsu Kasuya 4:6").put("brewer", "Hario V60")
                .put("dose", "20 g").put("water", "300 g").put("temp", "92°C").put("steps", st).put("total", 210000L).toString())
            .commit();
    }

    static StatusBarNotification note(Context ctx) throws Exception {
        Thread.sleep(400);
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        for (StatusBarNotification s : nm.getActiveNotifications()) if (s.getId() == BrewTimer.NOTE_ID) return s;
        return null;
    }

    /** A no-argument method the public SDK doesn't list, for the log. */
    static Object hidden(Object o, String m) {
        try { return o.getClass().getMethod(m).invoke(o); } catch (Exception e) { return "n/a"; }
    }

    static String title(StatusBarNotification s) { return String.valueOf(s.getNotification().extras.getCharSequence(Notification.EXTRA_TITLE)); }

    @Test
    public void runsFromItsButtons() throws Exception {
        Context ctx = InstrumentationRegistry.getInstrumentation().getTargetContext();
        seed(ctx);

        BrewTimer.act(ctx, BrewTimer.START);
        BrewTimer.St s = BrewTimer.read(ctx);
        assertEquals("run", s.state);
        assertEquals("Tetsu Kasuya 4:6", s.name);
        assertEquals(STEPS[0], s.step);
        assertTrue(s.next.startsWith("Next at 0:45"));
        StatusBarNotification n = note(ctx);
        assertNotNull("a running brew shows a notification", n);
        assertTrue("it stays while brewing", (n.getNotification().flags & Notification.FLAG_ONGOING_EVENT) != 0);
        assertEquals(STEPS[0], title(n));
        assertEquals("Pause, Next step and Stop", 3, n.getNotification().actions.length);
        // What Android asks of a Live Update (all public): ongoing, a title, a progress style, not colourised, and the
        // request to be promoted. Whether the phone then promoted it is logged (those calls aren't in the public SDK).
        Notification nn = n.getNotification();
        assertTrue("asks to be a Live Update", nn.extras.getBoolean("android.requestPromotedOngoing"));
        assertTrue("not colourised", !nn.extras.getBoolean(Notification.EXTRA_COLORIZED));
        if (Build.VERSION.SDK_INT >= 36) {
            assertEquals("a progress-style notification", Notification.ProgressStyle.class.getName(), nn.extras.getString(Notification.EXTRA_TEMPLATE));
            Log.i("TimerTest", "promotable=" + hidden(nn, "hasPromotableCharacteristics") + " promoted=" + hidden(nn, "isPromotedOngoing")
                + " canPost=" + hidden(ctx.getSystemService(NotificationManager.class), "canPostPromotedNotifications"));
        }

        BrewTimer.act(ctx, BrewTimer.NEXT);
        s = BrewTimer.read(ctx);
        assertTrue("next jumps to the next step's time", s.elapsed(System.currentTimeMillis()) >= 45000);
        assertEquals(STEPS[1], s.step);

        BrewTimer.act(ctx, BrewTimer.TOGGLE);
        s = BrewTimer.read(ctx);
        assertEquals("pause", s.state);
        long held = s.el;
        Thread.sleep(600);
        assertEquals("paused, the clock holds", held, BrewTimer.read(ctx).elapsed(System.currentTimeMillis()));
        assertTrue(title(note(ctx)).startsWith("Paused at 0:4"));

        BrewTimer.act(ctx, BrewTimer.TOGGLE);
        assertEquals("run", BrewTimer.read(ctx).state);

        BrewTimer.act(ctx, BrewTimer.NEXT);
        assertEquals(STEPS[2], BrewTimer.read(ctx).step);
        BrewTimer.act(ctx, BrewTimer.NEXT);
        s = BrewTimer.read(ctx);
        assertEquals("next after the last step finishes the brew", "done", s.state);
        n = note(ctx);
        assertNotNull(n);
        assertEquals("Brew complete", title(n));
        assertEquals("it can be swiped away once done", 0, n.getNotification().flags & Notification.FLAG_ONGOING_EVENT);

        BrewTimer.act(ctx, BrewTimer.STOP);
        // The notification service applies posts and cancels in its own time: wait up to 3 s for it to go.
        StatusBarNotification left = note(ctx);
        for (int i = 0; i < 13 && left != null; i++) left = note(ctx);
        assertNull("stop takes the notification away", left);

        // A brew left running for CI's picture of the notification and the status bar.
        BrewTimer.act(ctx, BrewTimer.START);
        BrewTimer.act(ctx, BrewTimer.NEXT);
        assertNotNull(note(ctx));
    }
}
