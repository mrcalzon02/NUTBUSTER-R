package io.github.mrcalzon02.nutbuster;

import android.app.Activity;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.google.android.gms.games.PlayGames;
import com.google.android.gms.games.SnapshotsClient;
import com.google.android.gms.games.snapshot.Snapshot;
import com.google.android.gms.games.snapshot.SnapshotMetadataChange;
import org.json.JSONException;
import org.json.JSONObject;
import java.nio.charset.StandardCharsets;

/** Explicit cloud backup and restore for the complete Rupee Rush game-state JSON.
 * Never replaces local progress without the game's separate confirmation.
 */
public final class PlayCloudBridge {
    private static final String SLOT = "nutbuster-profile-v1";
    private static final int MAX_BYTES = 1024 * 1024;
    private final Activity activity;
    private final WebView view;

    PlayCloudBridge(Activity activity, WebView view) {
        this.activity = activity;
        this.view = view;
    }

    private void send(String action, boolean ok, String detail, String payload) {
        JSONObject message = new JSONObject();
        try {
            message.put("action", action);
            message.put("ok", ok);
            message.put("detail", detail);
            if (payload != null) message.put("payload", payload);
        } catch (JSONException error) {
            throw new IllegalStateException("JSON bridge message failed", error);
        }
        view.post(() -> view.evaluateJavascript(
            "window.NutPlayCloudMessage && window.NutPlayCloudMessage(" +
            message.toString() + ")", null));
    }

    private void authorized(String action, Runnable work) {
        activity.runOnUiThread(() ->
            PlayGames.getGamesSignInClient(activity).isAuthenticated()
                .addOnCompleteListener(activity, task -> {
                    if (!task.isSuccessful() || !task.getResult().isAuthenticated()) {
                        send(action, false, "Play Games is not authenticated. Check the configured player profile and Play Console tester access.", null);
                    } else {
                        work.run();
                    }
                }));
    }

    @JavascriptInterface public void backup(String json) {
        if (json == null || json.isEmpty()) {
            send("backup", false, "No local save to back up.", null);
            return;
        }
        final byte[] data = json.getBytes(StandardCharsets.UTF_8);
        if (data.length > MAX_BYTES) {
            send("backup", false, "Local save exceeds the 1 MiB snapshot safety limit.", null);
            return;
        }
        try {
            JSONObject candidate = new JSONObject(json);
            if (!candidate.has("unlocked") || !candidate.has("stars") ||
                !candidate.has("coins") || !candidate.has("gems")) {
                send("backup", false, "Save is missing required progression/economy fields.", null);
                return;
            }
        } catch (JSONException error) {
            send("backup", false, "Local save is not valid JSON.", null);
            return;
        }
        authorized("backup", () -> {
            SnapshotsClient client = PlayGames.getSnapshotsClient(activity);
            client.open(SLOT, true, SnapshotsClient.RESOLUTION_POLICY_MOST_RECENTLY_MODIFIED)
                .addOnCompleteListener(activity, task -> {
                    if (!task.isSuccessful() || task.getResult().isConflict()) {
                        send("backup", false, "Cloud snapshot unavailable or conflicting; do not discard local progress.", null);
                        return;
                    }
                    Snapshot snap = task.getResult().getData();
                    if (snap == null) {
                        send("backup", false, "Play Games returned no writable snapshot.", null);
                        return;
                    }
                    try {
                        snap.getSnapshotContents().writeBytes(data);
                    } catch (RuntimeException error) {
                        client.discardAndClose(snap);
                        send("backup", false, "Cannot write cloud snapshot: " + error.getMessage(), null);
                        return;
                    }
                    SnapshotMetadataChange metadata = new SnapshotMetadataChange.Builder()
                        .setDescription("Nut Buster campaign, currencies and homestead backup").build();
                    client.commitAndClose(snap, metadata)
                        .addOnCompleteListener(activity, completed ->
                            send("backup", completed.isSuccessful(),
                                completed.isSuccessful() ? "Backup queued with Play Games Saved Games." :
                                    "Cloud commit failed; local save was preserved.", null));
                });
        });
    }

    @JavascriptInterface public void restore() {
        authorized("restore", () -> {
            SnapshotsClient client = PlayGames.getSnapshotsClient(activity);
            client.open(SLOT, false, SnapshotsClient.RESOLUTION_POLICY_MOST_RECENTLY_MODIFIED)
                .addOnCompleteListener(activity, task -> {
                    if (!task.isSuccessful() || task.getResult().isConflict()) {
                        send("restore", false, "No accessible cloud snapshot, or an unresolved conflict. Local progress was not modified.", null);
                        return;
                    }
                    Snapshot snap = task.getResult().getData();
                    if (snap == null) {
                        send("restore", false, "Cloud snapshot was empty.", null);
                        return;
                    }
                    try {
                        byte[] bytes = snap.getSnapshotContents().readFully();
                        if (bytes == null || bytes.length == 0 || bytes.length > MAX_BYTES) {
                            send("restore", false, "Cloud snapshot is empty or exceeds the save limit.", null);
                        } else {
                            send("restore", true, "Cloud save loaded for confirmation.", new String(bytes, StandardCharsets.UTF_8));
                        }
                    } catch (Exception error) {
                        send("restore", false, "Cloud read failed: " + error.getMessage(), null);
                    } finally {
                        client.discardAndClose(snap);
                    }
                });
        });
    }

    @JavascriptInterface public void profile() {
        authorized("profile", () ->
            PlayGames.getPlayersClient(activity).getCurrentPlayer()
                .addOnCompleteListener(activity, task ->
                    send("profile", task.isSuccessful(),
                         task.isSuccessful() ? "Authenticated Play Games player" :
                             "Could not retrieve Play Games player.", 
                         task.isSuccessful() ? task.getResult().getPlayerId() : null)));
    }
}
