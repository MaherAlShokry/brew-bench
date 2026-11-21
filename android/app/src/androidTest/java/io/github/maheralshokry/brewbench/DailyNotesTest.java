package io.github.maheralshokry.brewbench;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
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
 * The daily notes (DailyNotes) in the app's look: a coffee of the day and a coffee fact, each with a header (what it
 * is), its title and text, no emoji, the chosen icon as the picture and the vibe's colour. Schedule keeps only notes
 * still to come and replaces one kind without touching the other. Both notes are left showing, so CI can take a
 * picture of the notification shade.
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

    @Test
    public void notesLookLikeTheApp() throws Exception {
        Context ctx = InstrumentationRegistry.getInstrumentation().getTargetContext();
        // The icon you chose: the cup, in the Nordic vibe, dark.
        ctx.getSharedPreferences("app_icon", Context.MODE_PRIVATE).edit().putString("icon", "cup:nordic:d").commit();
        long soon = System.currentTimeMillis() + 3600_000L;

        DailyNotes.schedule(ctx, "cabinet", new JSONArray().put(note(7101, soon, "From your cabinet", "Hayma Dakhiliya XI",
            "Windrose Coffee · Yemen · 5 beans. You tasted candied fig, cardamom and dark honey.", "bean:b1"))
            .put(note(7102, System.currentTimeMillis() - 1000, "From your cabinet", "Gone", "Already past", "beans")), "#3B6E8F");
        DailyNotes.schedule(ctx, "fact", new JSONArray().put(note(7201, soon, "From history", "Plants reach Europe",
            "1616. Dutch trader Pieter van den Broecke carries coffee plants from Mocha to Amsterdam.", "fact:{\"tab\":\"history\"}")), null);
        JSONArray kept = new JSONArray(DailyNotes.prefs(ctx).getString("items", "[]"));
        assertEquals("only notes still to come are kept, both kinds", 2, kept.length());
        // Replacing the cabinet notes leaves the fact alone.
        DailyNotes.schedule(ctx, "cabinet", new JSONArray().put(note(7101, soon, "From your cabinet", "Hayma Dakhiliya XI",
            "Windrose Coffee · Yemen · 5 beans. You tasted candied fig, cardamom and dark honey.", "bean:b1")), "#3B6E8F");
        assertEquals(2, new JSONArray(DailyNotes.prefs(ctx).getString("items", "[]")).length());

        for (int i = 0; i < kept.length(); i++) DailyNotes.post(ctx, kept.getJSONObject(i));
        StatusBarNotification c = find(ctx, 7101), f = find(ctx, 7201);
        assertNotNull("the coffee of the day shows", c);
        assertNotNull("the coffee fact shows", f);
        for (StatusBarNotification s : new StatusBarNotification[] {c, f}) {
            Notification n = s.getNotification();
            String title = String.valueOf(n.extras.getCharSequence(Notification.EXTRA_TITLE));
            assertFalse("no emoji in the title: " + title, title.codePoints().anyMatch(cp -> cp > 0x2000));
            assertNotNull("a header saying what it is", n.extras.getCharSequence(Notification.EXTRA_SUB_TEXT));
            assertNotNull("the chosen icon as the picture", n.getLargeIcon());
            assertEquals("the vibe's colour", 0xFF3B6E8F, n.color);
            assertNotNull("tapping opens what it is about", n.contentIntent);
        }
        assertEquals("Hayma Dakhiliya XI", String.valueOf(c.getNotification().extras.getCharSequence(Notification.EXTRA_TITLE)));
        assertEquals("From history", String.valueOf(f.getNotification().extras.getCharSequence(Notification.EXTRA_SUB_TEXT)));
        assertTrue("the full text when opened", String.valueOf(f.getNotification().extras.getCharSequence(Notification.EXTRA_BIG_TEXT)).startsWith("1616."));
    }
}
