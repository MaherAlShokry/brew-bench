package io.github.maheralshokry.brewbench;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import android.graphics.Bitmap;
import android.os.Build;
import android.util.Log;
import android.webkit.WebView;
import androidx.activity.BackEventCompat;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.json.JSONArray;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * The app's everyday flows inside the real Android app (its WebView, its back handling), on a bench lived in for a year
 * (150 brews): the five tabs, a coffee opened and closed with Android's back, Settings > Brew log and back (no zoom-out,
 * the page where you left it), the timer waiting at the valve, and the predictive back gesture's drag and cancel.
 * Desktop Chrome hides Android-only problems (the GPU blur, the zoom on back); this runs where they happen. Each flow
 * leaves a picture in widget-shots/ (kept by CI), and how long each tab switch kept the page busy goes to the log.
 */
@RunWith(AndroidJUnit4.class)
public class AppFlowsTest {
    static final String TAG = "AppFlowsTest";
    private MainActivity act;

    /** Runs a script in the page and returns its result (JSON.stringify'd by the caller where it's an object). */
    private String js(String code) throws Exception {
        final String[] out = {null};
        final CountDownLatch done = new CountDownLatch(1);
        act.runOnUiThread(() -> {
            WebView w = act.getBridge().getWebView();
            w.evaluateJavascript("(function(){try{return " + code + "}catch(e){return 'ERR '+e.message}})()", r -> { out[0] = r; done.countDown(); });
        });
        assertTrue("the page answered", done.await(20, TimeUnit.SECONDS));
        String r = out[0];
        if (r == null || "null".equals(r)) return null;
        return r.startsWith("\"") ? new JSONArray("[" + r + "]").getString(0) : r;
    }

    private void waitFor(String cond, long ms) throws Exception {
        long t0 = System.currentTimeMillis();
        while (System.currentTimeMillis() - t0 < ms) { if ("true".equals(js("!!(" + cond + ")"))) return; Thread.sleep(300); }
        throw new AssertionError("timed out waiting for " + cond);
    }

    private void shot(String name) {
        try {
            Bitmap bm = InstrumentationRegistry.getInstrumentation().getUiAutomation().takeScreenshot();
            if (bm == null) return;
            File dir = new File(act.getExternalFilesDir(null), "widget-shots");
            dir.mkdirs();
            try (FileOutputStream o = new FileOutputStream(new File(dir, "flow-" + name + "-api" + Build.VERSION.SDK_INT + ".png"))) { bm.compress(Bitmap.CompressFormat.PNG, 100, o); }
        } catch (Exception e) { Log.w(TAG, "no picture: " + e); }
    }

    private void back() { act.runOnUiThread(() -> act.getOnBackPressedDispatcher().onBackPressed()); }

    // The bench: a few coffees and 150 brews with ratings, flavours, notes and dial-in snapshots, put in before a reload.
    static final String SEED = "(function(){var O=['ethiopia','kenya','colombia','panama','rwanda','yemen'],P=['washed','natural','honey'],B=[];"
        + "for(var i=0;i<12;i++)B.push({id:'af'+i+'x1234',name:'Lot '+(i+1),roaster:'Spirit Hub',origin:O[i%6],process:P[i%3],rating:4,shelf:i<3,flavours:'peach, jasmine, honey',bag:250});"
        + "localStorage.setItem('bb-beans',JSON.stringify(B));var L=[],now=Date.now();"
        + "for(var i=0;i<150;i++){var b=B[i%12],ts=now-(i+1)*2*864e5;L.push({id:'af'+i+'log',ts:ts,date:new Date(ts).toISOString(),coffee:b.name,settings:'Tetsu Kasuya 4:6, 15g : 250g, 93\\u00b0C',stars:2+i%4,brewer:'v60',taste:['sour','good','bitter'][i%3],"
        + "notes:i%4?'':'Sweet and clean.',fl:[['fruity.stone-fruit.peach',3],['floral.floral.jasmine',2]],snap:{b:'v60',dose:15,water:250,rec:'Tetsu Kasuya 4:6',g:'zp6',c:44,t:93,bean:{id:b.id}}})}"
        + "localStorage.setItem('bb-log',JSON.stringify(L));sessionStorage.setItem('bb-splashed','1');return 'ok'})()";

    @Test
    public void everydayFlows() throws Exception {
        try (ActivityScenario<MainActivity> sc = ActivityScenario.launch(MainActivity.class)) {
            sc.onActivity(a -> act = a);
            waitFor("window.BEANS_OK", 60000);
            assertEquals("ok", js(SEED));
            js("(location.reload(),1)");
            Thread.sleep(1500);
            waitFor("window.BEANS_OK&&document.querySelector('main section.on')", 60000);
            js("(window.__errs=[],addEventListener('error',function(e){__errs.push(String(e.message))}),window.__lf=[],(function(){try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){__lf.push(e.duration)})}).observe({type:'long-animation-frame'})}catch(e){}})(),1)");
            Thread.sleep(4000);

            // The five tabs.
            for (String t : new String[]{"recipes", "beans", "explore", "settings", "dial"}) {
                js("(__lf=[],document.querySelector('.bottomnav [data-bn=\"" + t + "\"]').click(),1)");
                Thread.sleep(1200);
                assertEquals("on " + t, t, js("document.querySelector('main section.on').id"));
                Log.i(TAG, "tab " + t + ": busy " + js("Math.round(__lf.reduce(function(a,x){return a+Math.max(0,x-16)},0))") + " ms");
                shot("tab-" + t);
            }

            // A coffee opened, then closed with Android's back.
            js("(showTab('beans'),1)");
            Thread.sleep(900);
            js("(openBean(BEANS[0].id),1)");
            Thread.sleep(1200);
            assertEquals("the coffee is open", "true", js("$('vd').open"));
            shot("coffee");
            back();
            Thread.sleep(1000);
            assertEquals("back closed it", "false", js("$('vd').open"));

            // Settings > Brew log > back: the app never zooms out and Settings is where it was.
            js("(showTab('settings'),1)");
            Thread.sleep(900);
            js("(scrollTo(0,200),1)");
            Thread.sleep(400);
            String y0 = js("String(Math.round(scrollY))");
            js("(document.querySelector('#settings [data-go=\"log\"]').click(),1)");
            Thread.sleep(1200);
            assertEquals("the log is open", "log", js("document.querySelector('main section.on').id"));
            shot("log");
            js("(window.__ih=[],(function f(){__ih.push(innerHeight);if(__ih.length<60)requestAnimationFrame(f)})(),1)");
            back();
            Thread.sleep(1300);
            assertEquals("back to Settings", "settings", js("document.querySelector('main section.on').id"));
            assertEquals("never zoomed out on the way back", "1", js("String(new Set(__ih).size)"));
            assertEquals("Settings where you left it", y0, js("String(Math.round(scrollY))"));

            // The predictive back gesture (Android 14 and later report the drag): a page follows the finger, then springs back.
            if (Build.VERSION.SDK_INT >= 34) {
                js("(document.querySelector('#settings [data-go=\"log\"]').click(),1)");
                Thread.sleep(1200);
                act.runOnUiThread(() -> {
                    act.getOnBackPressedDispatcher().dispatchOnBackStarted(new BackEventCompat(10f, 900f, 0f, BackEventCompat.EDGE_LEFT));
                    act.getOnBackPressedDispatcher().dispatchOnBackProgressed(new BackEventCompat(200f, 900f, 0.6f, BackEventCompat.EDGE_LEFT));
                });
                Thread.sleep(600);
                assertEquals("the page follows the drag", "true", js("$('log').classList.contains('bk-drag')&&parseFloat($('log').style.getPropertyValue('--bk-s'))<1"));
                shot("back-drag");
                act.runOnUiThread(() -> act.getOnBackPressedDispatcher().dispatchOnBackCancelled());
                Thread.sleep(700);
                assertEquals("…and springs back when you let it go", "false", js("$('log').classList.contains('bk-drag')"));
                back();
                Thread.sleep(1200);
            }

            // The timer waits at the valve and carries on with Next.
            js("(openTimerNow(RECIPES.findIndex(function(r){return r.name==='New Hybrid (2025)'})),$('tm-go').click(),TM.t0-=46000,1)");
            Thread.sleep(1500);
            assertEquals("the clock holds at the valve", "Your move", js("$('tm-step').textContent"));
            shot("timer-hold");
            js("($('tm-skip').click(),1)");
            Thread.sleep(800);
            assertEquals("Next carries on", "true", js("TM.run&&TM.hold==null"));
            js("($('timer').close(),1)");

            assertEquals("no page errors", "[]", js("JSON.stringify(__errs)"));
        }
    }
}
