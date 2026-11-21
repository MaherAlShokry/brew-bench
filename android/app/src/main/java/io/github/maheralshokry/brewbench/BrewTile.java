package io.github.maheralshokry.brewbench;

import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

/**
 * Quick Settings tiles, in the panel pulled down from the top of the screen: "Start a brew" opens your go-to recipe's
 * timer (or the dial-in), "Log a brew" opens the brew log's form. Each opens the app the way the widgets do, with what
 * to open handed over in the intent (see WidgetPlugin.take).
 */
public class BrewTile extends TileService {
    protected String what() { return "brew"; }
    protected int code() { return 40; }

    @Override
    public void onStartListening() {
        Tile t = getQsTile();
        if (t == null) return;
        t.setState(Tile.STATE_INACTIVE);
        t.updateTile();
    }

    @Override
    public void onClick() {
        Intent i = new Intent(this, MainActivity.class);
        i.setAction("io.github.maheralshokry.brewbench.TILE." + what());
        i.putExtra(WidgetPlugin.EXTRA, what());
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (Build.VERSION.SDK_INT >= 34) {
            startActivityAndCollapse(PendingIntent.getActivity(this, code(), i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        } else {
            startActivityAndCollapse(i);
        }
    }

    /** "Log a brew": the same, opening the log. */
    public static class Log extends BrewTile {
        @Override protected String what() { return "log"; }
        @Override protected int code() { return 41; }
    }
}
