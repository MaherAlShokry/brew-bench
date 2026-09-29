package io.github.maheralshokry.brewbench;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // The back gesture (or button) steps back inside the app: it closes the open sheet or returns to the previous
        // screen. Only when there is nowhere left to go does the app go to the background.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView web = getBridge() == null ? null : getBridge().getWebView();
                if (web == null) { moveTaskToBack(true); return; }
                web.evaluateJavascript("(window.bbBack&&window.bbBack())===true", result -> {
                    if ("true".equals(result)) return;
                    if (web.canGoBack() && !"false".equals(result)) web.goBack();
                    else moveTaskToBack(true);
                });
            }
        });
    }
}
