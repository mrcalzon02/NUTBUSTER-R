package io.github.mrcalzon02.nutbuster;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.SystemClock;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;
import java.util.function.Consumer;

/** Store-managed flexible updates; never downloads GitHub APKs or requests install permission. */
final class PlayUpdateService {
    private static final long AUTO_INTERVAL = 3600000L;
    private static final int UPDATE_REQUEST_CODE = 7904;
    private final Activity activity;
    private final AppUpdateManager manager;
    private final Consumer<String> status;
    private final InstallStateUpdatedListener listener;
    private long lastAutoCheck = -AUTO_INTERVAL;
    PlayUpdateService(Activity activity, Consumer<String> status) {
        this.activity=activity; this.status=status;
        manager=AppUpdateManagerFactory.create(activity);
        listener=state -> {
            if (state.installStatus() == InstallStatus.DOWNLOADED) promptInstall();
        };
        manager.registerListener(listener);
    }
    void check(boolean manually) {
        if (!manually && SystemClock.elapsedRealtime() - lastAutoCheck < AUTO_INTERVAL) return;
        lastAutoCheck = SystemClock.elapsedRealtime();
        manager.getAppUpdateInfo().addOnSuccessListener(info -> {
            if (info.installStatus() == InstallStatus.DOWNLOADED) { promptInstall(); return; }
            if (info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE ||
                !info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) {
                if (manually) status.accept("Google Play reports no eligible update."); return;
            }
            new AlertDialog.Builder(activity).setTitle("Google Play update available")
                .setMessage("Google Play can download the update. You can keep playing while it downloads.")
                .setPositiveButton("Update", (dialog, which) -> {
                    try { manager.startUpdateFlowForResult(info, activity,
                        AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build(), UPDATE_REQUEST_CODE); }
                    catch (Exception error) { status.accept("Google Play could not start this update."); }
                }).setNegativeButton("Later", null).show();
        }).addOnFailureListener(error -> { if (manually) status.accept("Could not check Google Play for updates."); });
    }
    void onResume() {
        manager.getAppUpdateInfo().addOnSuccessListener(info -> {
            if (info.installStatus() == InstallStatus.DOWNLOADED) promptInstall();
        });
    }
    private void promptInstall() {
        activity.runOnUiThread(() -> new AlertDialog.Builder(activity)
            .setTitle("Update downloaded")
            .setMessage("Restart NUTBUSTER now to install the Google Play update?")
            .setPositiveButton("Restart", (dialog, which) -> manager.completeUpdate())
            .setNegativeButton("Later", null).show());
    }
    void close() { manager.unregisterListener(listener); }
}
