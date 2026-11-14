package io.github.maheralshokry.brewbench;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** The brew timer's buttons on the notification and the Quick brew widget: pause or resume, next step, start, stop. */
public class TimerReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (intent == null || intent.getAction() == null) return;
        BrewTimer.act(ctx, intent.getAction());
    }
}
