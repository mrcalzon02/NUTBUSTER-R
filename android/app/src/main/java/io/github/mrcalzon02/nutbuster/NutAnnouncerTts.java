package io.github.mrcalzon02.nutbuster;

import android.app.Activity;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.webkit.JavascriptInterface;
import java.util.Locale;

/**
 * The Nutvale Auditor. Uses only a device-installed, offline English TTS voice.
 * No network service, SDK key, personal data upload, or voice imitation.
 * The web UI owns the authored text; the bridge owns Android synthesis.
 */
public final class NutAnnouncerTts {
    public interface Completion { void finished(String utteranceId); }

    private final Activity activity;
    private final Completion completion;
    private TextToSpeech engine;
    private volatile String status = "initializing";
    private volatile boolean closed = false;

    public NutAnnouncerTts(Activity activity, Completion completion) {
        this.activity = activity;
        this.completion = completion;
        engine = new TextToSpeech(activity, code -> {
            if (closed) return;
            if (code != TextToSpeech.SUCCESS || engine == null) {
                status = "unavailable";
                return;
            }
            try {
                Voice chosen = null;
                for (Voice candidate : engine.getVoices()) {
                    if (candidate == null || candidate.isNetworkConnectionRequired()
                            || candidate.getLocale() == null
                            || !"en".equals(candidate.getLocale().getLanguage())) continue;
                    if (chosen == null ||
                            (!"US".equals(chosen.getLocale().getCountry())
                            && "US".equals(candidate.getLocale().getCountry()))) {
                        chosen = candidate;
                    }
                }
                if (chosen == null || engine.setVoice(chosen) == TextToSpeech.ERROR) {
                    status = "offline-voice-missing";
                    return;
                }
                engine.setSpeechRate(0.89f);
                engine.setPitch(0.88f);
                engine.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String utteranceId) { }
                    @Override public void onDone(String utteranceId) { completion.finished(utteranceId); }
                    @Override public void onError(String utteranceId) { completion.finished(utteranceId); }
                });
                status = "ready";
            } catch (Exception unavailable) {
                status = "unavailable";
            }
        });
    }

    @JavascriptInterface public String getStatus() { return status; }

    @JavascriptInterface public boolean speak(String utteranceId, String text, double volume) {
        if (!"ready".equals(status) || utteranceId == null || !utteranceId.matches("auditor-[0-9]+")
                || text == null || text.isEmpty() || text.length() > 256 || closed) return false;
        final float gain = (float) Math.max(0, Math.min(1, Double.isFinite(volume) ? volume : .9));
        activity.runOnUiThread(() -> {
            if (closed || engine == null || !"ready".equals(status)) return;
            Bundle settings = new Bundle();
            settings.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, gain);
            if (engine.speak(text, TextToSpeech.QUEUE_FLUSH, settings, utteranceId) == TextToSpeech.ERROR)
                completion.finished(utteranceId);
        });
        return true;
    }

    @JavascriptInterface public void stop() {
        activity.runOnUiThread(() -> { if (!closed && engine != null) engine.stop(); });
    }

    public void close() {
        closed = true;
        status = "unavailable";
        if (engine != null) { engine.stop(); engine.shutdown(); engine = null; }
    }
}
