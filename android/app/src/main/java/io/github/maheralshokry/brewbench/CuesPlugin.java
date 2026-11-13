package io.github.maheralshokry.brewbench;

import android.content.Context;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.speech.tts.TextToSpeech;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;

/**
 * The brew timer's cues: a step read aloud and a buzz, so you can follow a recipe without watching the screen. The
 * WebView has no speech of its own, so the phone's text-to-speech reads it; it starts on the first cue and is kept.
 */
@CapacitorPlugin(name = "Cues")
public class CuesPlugin extends Plugin {
    private TextToSpeech tts = null;
    private boolean ready = false;
    private String waiting = null;

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        if (text == null || text.isEmpty()) { call.resolve(); return; }
        if (text.length() > 200) text = text.substring(0, 200);
        if (tts == null) {
            waiting = text;
            tts = new TextToSpeech(getContext(), status -> {
                ready = status == TextToSpeech.SUCCESS;
                if (ready) {
                    tts.setLanguage(Locale.getDefault());
                    if (waiting != null) { tts.speak(waiting, TextToSpeech.QUEUE_FLUSH, null, "bb"); waiting = null; }
                }
            });
        } else if (ready) {
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "bb");
        } else {
            waiting = text;
        }
        call.resolve();
    }

    @PluginMethod
    public void vibrate(PluginCall call) {
        try {
            JSArray p = call.getArray("pattern");
            long[] ms;
            if (p == null || p.length() == 0) ms = new long[] {0, 120};
            else {
                ms = new long[p.length() + 1];
                ms[0] = 0;
                for (int i = 0; i < p.length() && i < 12; i++) ms[i + 1] = Math.max(0, Math.min(2000, p.getLong(i)));
            }
            Vibrator v = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createWaveform(ms, -1));
                else v.vibrate(ms, -1);
            }
        } catch (Exception ignored) { }
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) { tts.shutdown(); tts = null; ready = false; }
    }
}
