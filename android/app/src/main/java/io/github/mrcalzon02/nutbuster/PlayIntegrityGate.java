package io.github.mrcalzon02.nutbuster;

import android.app.Activity;
import com.google.android.play.core.integrity.IntegrityManagerFactory;
import com.google.android.play.core.integrity.StandardIntegrityManager;
import java.util.function.Consumer;

/** A fresh Google Play standard verdict bound to exactly one billing-token verification. */
final class PlayIntegrityGate {
    private final Activity activity;
    private final StandardIntegrityManager manager;
    private StandardIntegrityManager.StandardIntegrityTokenProvider provider;

    PlayIntegrityGate(Activity activity) {
        this.activity=activity;
        manager=IntegrityManagerFactory.createStandard(activity.getApplicationContext());
    }
    void attest(String requestHash, Consumer<String> success, Runnable failure) {
        activity.runOnUiThread(() -> {
            if (requestHash==null || !requestHash.matches("[a-f0-9]{64}") ||
                BuildConfig.PLAY_INTEGRITY_PROJECT_NUMBER.isEmpty()) { failure.run(); return; }
            if (provider!=null) { requestToken(provider,requestHash,success,failure); return; }
            try {
                long project=Long.parseLong(BuildConfig.PLAY_INTEGRITY_PROJECT_NUMBER);
                manager.prepareIntegrityToken(
                    StandardIntegrityManager.PrepareIntegrityTokenRequest.builder()
                    .setCloudProjectNumber(project).build())
                    .addOnSuccessListener(newProvider -> {
                        provider=newProvider;
                        requestToken(newProvider,requestHash,success,failure);
                    })
                    .addOnFailureListener(error -> failure.run());
            } catch (RuntimeException error) { failure.run(); }
        });
    }
    private void requestToken(StandardIntegrityManager.StandardIntegrityTokenProvider ready,
            String hash, Consumer<String> success, Runnable failure) {
        ready.request(StandardIntegrityManager.StandardIntegrityTokenRequest.builder()
            .setRequestHash(hash).build())
            .addOnSuccessListener(token -> success.accept(token.token()))
            .addOnFailureListener(error -> {
                provider=null;
                failure.run();
            });
    }
}
