package io.github.maheralshokry.brewbench;

import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Arrays;
import java.util.List;

/**
 * The home-screen icon follows the app logo. Each logo is an activity-alias in AndroidManifest.xml (".IconBean",
 * ".IconCup"…) and exactly one is enabled. The app says which one it wants with set(); the switch happens in apply(),
 * called when the app goes to the background, because changing the launcher entry of a running app can close it.
 */
@CapacitorPlugin(name = "AppIcon")
public class AppIconPlugin extends Plugin {
    static final List<String> ICONS = Arrays.asList("bean", "cup", "latte", "dripper", "cherry", "moka", "kettle", "grinder");
    private static final String PREFS = "app_icon", KEY = "icon";

    private static SharedPreferences prefs(Context ctx) { return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    private static ComponentName alias(Context ctx, String name) {
        return new ComponentName(ctx, ctx.getPackageName() + ".Icon" + Character.toUpperCase(name.charAt(0)) + name.substring(1));
    }

    @PluginMethod
    public void set(PluginCall call) {
        String name = call.getString("name", "bean");
        if (!ICONS.contains(name)) name = "bean";
        prefs(getContext()).edit().putString(KEY, name).apply();
        JSObject ret = new JSObject();
        ret.put("name", name);
        call.resolve(ret);
    }

    /** Enable the wanted icon first, then turn the others off, so there is always one way to open the app. */
    static void apply(Context ctx) {
        String want = prefs(ctx).getString(KEY, "bean");
        if (!ICONS.contains(want)) want = "bean";
        PackageManager pm = ctx.getPackageManager();
        try {
            setState(pm, alias(ctx, want), true, want.equals("bean"));
            for (String name : ICONS) if (!name.equals(want)) setState(pm, alias(ctx, name), false, name.equals("bean"));
        } catch (Exception ignored) {
            // A launcher that refuses the change keeps the current icon; the app itself is unaffected.
        }
    }

    private static void setState(PackageManager pm, ComponentName cn, boolean on, boolean onByDefault) {
        int s = pm.getComponentEnabledSetting(cn);
        boolean isOn = s == PackageManager.COMPONENT_ENABLED_STATE_ENABLED || (s == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT && onByDefault);
        if (isOn == on) return;
        pm.setComponentEnabledSetting(cn, on ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED : PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
            PackageManager.DONT_KILL_APP);
    }
}
