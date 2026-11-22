package io.github.maheralshokry.brewbench;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import android.app.Notification;
import android.app.NotificationManager;
import android.content.Context;
import android.service.notification.StatusBarNotification;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * The daily notes (DailyNotes) in the app's own layout: a coffee of the day (photo or tile, your note in its panel,
 * tasting notes, Brew it and Open diary) and a coffee fact (its topic's icon tile, the full text, Read more), each with
 * the shade's header saying what it is, no emoji in the title and the vibe's colour. A note scheduled by an older app
 * (no layout fields) still shows. Schedule keeps only notes still to come and replaces one kind without touching the
 * other. The notes are left showing, so CI can take a picture of the notification shade.
 */
@RunWith(AndroidJUnit4.class)
public class DailyNotesTest {
    static StatusBarNotification find(Context ctx, int id) throws Exception {
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        for (int i = 0; i < 15; i++) {
            Thread.sleep(200);
            for (StatusBarNotification s : nm.getActiveNotifications()) if (s.getId() == id) return s;
        }
        return null;
    }

    static JSONObject note(int id, long at, String tag, String title, String body, String open) throws Exception {
        return new JSONObject().put("id", id).put("at", at).put("tag", tag).put("title", title).put("body", body).put("open", open);
    }

    static JSONObject coffee(int id, long at) throws Exception {
        return note(id, at, "From your diary", "East Haraz Wadi Al Sallol", "\u201cTest on the go\u201d East Haraz Wadi Al Sallol, Oct 23, 2026", "bean:b1")
            .put("line", "\u201cTest on the go\u201d \u00b7 Oct 23").put("meta", "Spirit Hub \u00b7 Yemen \u00b7 Natural")
            .put("note", "Test on the go").put("noteLabel", "Your note \u00b7 Oct 23").put("text", "").put("icon", "bean")
            .put("chips", new JSONArray().put(new JSONArray().put("Peach").put("#E0662B")).put(new JSONArray().put("Brown sugar").put("#B76A2B"))
                .put(new JSONArray().put("Mandarin").put("#D0545B")))
            .put("acts", new JSONArray().put(new JSONArray().put("Brew it").put("brewbean:b1")).put(new JSONArray().put("Open diary").put("bean:b1")));
    }

    static JSONObject fact(int id, long at) throws Exception {
        String t = "Skin and fruit removed, the sticky mucilage fermented off in water, then the beans dried. Clean, transparent, acid-forward.";
        return note(id, at, "Coffee fact", "Washed", t, "fact:{\"process\":\"washed\"}")
            .put("line", "Skin and fruit removed, the sticky mucilage fermented off in water, then the beans dried.")
            .put("eyebrow", "Did you know \u00b7 Process").put("text", t).put("icon", "flask").put("tile", "#D2A04A")
            .put("acts", new JSONArray().put(new JSONArray().put("Read more").put("fact:{\"process\":\"washed\"}")));
    }

    @Test
    public void notesLookLikeTheApp() throws Exception {
        Context ctx = InstrumentationRegistry.getInstrumentation().getTargetContext();
        long soon = System.currentTimeMillis() + 3600_000L;

        DailyNotes.schedule(ctx, "cabinet", new JSONArray().put(coffee(7101, soon))
            .put(note(7102, System.currentTimeMillis() - 1000, "From your cabinet", "Gone", "Already past", "beans")), "#3B6E8F");
        DailyNotes.schedule(ctx, "fact", new JSONArray().put(fact(7201, soon)), null);
        JSONArray kept = new JSONArray(DailyNotes.prefs(ctx).getString("items", "[]"));
        assertEquals("only notes still to come are kept, both kinds", 2, kept.length());
        // Replacing the cabinet notes leaves the fact alone.
        DailyNotes.schedule(ctx, "cabinet", new JSONArray().put(coffee(7101, soon)), "#3B6E8F");
        assertEquals(2, new JSONArray(DailyNotes.prefs(ctx).getString("items", "[]")).length());

        for (int i = 0; i < kept.length(); i++) DailyNotes.post(ctx, kept.getJSONObject(i));
        // One from an older app: title and text only.
        DailyNotes.post(ctx, note(7103, soon, "From your cabinet", "Hayma Dakhiliya XI", "Windrose Coffee \u00b7 Yemen. You tasted candied fig.", "bean:b2"));
        StatusBarNotification c = find(ctx, 7101), f = find(ctx, 7201), old = find(ctx, 7103);
        assertNotNull("the coffee of the day shows", c);
        assertNotNull("the coffee fact shows", f);
        assertNotNull("a note from an older app still shows", old);
        for (StatusBarNotification s : new StatusBarNotification[] {c, f, old}) {
            Notification n = s.getNotification();
            String title = String.valueOf(n.extras.getCharSequence(Notification.EXTRA_TITLE));
            assertFalse("no emoji in the title: " + title, title.codePoints().anyMatch(cp -> cp > 0x2000));
            assertNotNull("a header saying what it is", n.extras.getCharSequence(Notification.EXTRA_SUB_TEXT));
            assertEquals("the app's own layout", Notification.DecoratedCustomViewStyle.class.getName(), n.extras.getString(Notification.EXTRA_TEMPLATE));
            assertNotNull("a closed view", n.contentView);
            assertNotNull("an opened view", n.bigContentView);
            assertNull("no second logo beside the app's icon", n.getLargeIcon());
            assertEquals("the vibe's colour", 0xFF3B6E8F, n.color);
            assertNotNull("tapping opens what it is about", n.contentIntent);
        }
        assertEquals("East Haraz Wadi Al Sallol", String.valueOf(c.getNotification().extras.getCharSequence(Notification.EXTRA_TITLE)));
        assertEquals("the closed line is the note and its date, not the name again", "\u201cTest on the go\u201d \u00b7 Oct 23",
            String.valueOf(c.getNotification().extras.getCharSequence(Notification.EXTRA_TEXT)));
        assertEquals("Coffee fact", String.valueOf(f.getNotification().extras.getCharSequence(Notification.EXTRA_SUB_TEXT)));
        assertTrue("its views draw on this phone", draws(ctx, c.getNotification()) && draws(ctx, f.getNotification()) && draws(ctx, old.getNotification()));
    }

    /** The closed and opened views inflate here, on the main thread, as the shade will inflate them. */
    static boolean draws(Context ctx, Notification n) {
        final boolean[] ok = {false};
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            try {
                android.widget.FrameLayout p = new android.widget.FrameLayout(ctx);
                n.contentView.apply(ctx, p);
                n.bigContentView.apply(ctx, p);
                ok[0] = true;
            } catch (Exception e) {
                android.util.Log.e("DailyNotesTest", "a view failed to draw", e);
            }
        });
        return ok[0];
    }
}
