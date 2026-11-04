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
 * The home-screen icon follows the app's look: its logo, in the vibe's colours, light or dark. Each combination is an
 * activity-alias in AndroidManifest.xml (listed in IconNames, made by tools/gen-app-icons.py) and exactly one is
 * enabled. The app says which one it wants with set({name, vibe, mode}); the switch happens in apply(), called when the
 * app goes to the background, because changing the launcher entry of a running app can close it.
 */
@CapacitorPlugin(name = "AppIcon")
public class AppIconPlugin extends Plugin {
    static final List<String> KEYS = Arrays.asList(IconNames.KEYS);
    private static final String PREFS = "app_icon", KEY = "icon", DEFAULT = "bean:roastery:l";

    private static SharedPreferences prefs(Context ctx) { return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    private static ComponentName alias(Context ctx, String key) {
        return new ComponentName(ctx, ctx.getPackageName() + IconNames.ALIASES[KEYS.indexOf(key)]);
    }

    /** A saved choice from before vibes ("cherry") means that logo in the house look. */
    private static String norm(String k) {
        if (k == null) return DEFAULT;
        if (!k.contains(":")) k = k + ":roastery:l";
        return KEYS.contains(k) ? k : DEFAULT;
    }

    @PluginMethod
    public void set(PluginCall call) {
        String mode = "dark".equals(call.getString("mode", "light")) ? "d" : "l";
        String key = norm(call.getString("name", "bean") + ":" + call.getString("vibe", "roastery") + ":" + mode);
        // An unknown vibe falls back to the same logo in the house look, not to the bean.
        if (key.equals(DEFAULT) && !"bean".equals(call.getString("name", "bean"))) key = norm(call.getString("name", "bean"));
        prefs(getContext()).edit().putString(KEY, key).apply();
        JSObject ret = new JSObject();
        ret.put("name", key);
        call.resolve(ret);
    }

    /** Enable the wanted icon first, then turn the others off, so there is always one way to open the app. */
    static void apply(Context ctx) {
        String want = norm(prefs(ctx).getString(KEY, DEFAULT));
        PackageManager pm = ctx.getPackageManager();
        try {
            setState(pm, alias(ctx, want), true, want.equals(DEFAULT));
            for (String k : KEYS) if (!k.equals(want)) setState(pm, alias(ctx, k), false, k.equals(DEFAULT));
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
