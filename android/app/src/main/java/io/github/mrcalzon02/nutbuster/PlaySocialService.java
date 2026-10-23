package io.github.mrcalzon02.nutbuster;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;
import com.google.android.gms.games.PlayGames;
import com.google.android.gms.games.PlayGamesSdk;
import com.google.android.gms.games.FriendsResolutionRequiredException;
import com.google.android.gms.games.Player;
import java.util.function.Consumer;

/** Play Games v2 achievements and consent-based friend discovery, without collecting contacts. */
final class PlaySocialService {
    static final int FRIENDS_CONSENT = 9906;
    private final Activity activity;
    private final Consumer<String> status;
    PlaySocialService(Activity activity, Consumer<String> status) {
        this.activity=activity; this.status=status;
        if (BuildConfig.PLAY_GAMES_PROJECT_ID.isEmpty()) return;
        PlayGamesSdk.initialize(activity.getApplicationContext());
        PlayGames.getGamesSignInClient(activity).isAuthenticated().addOnCompleteListener(task -> {
            if (!task.isSuccessful() || !task.getResult().isAuthenticated())
                status.accept("Play Games unavailable; local progress still works.");
        });
    }
    void showAchievements() {
        if (!configured()) return;
        PlayGames.getAchievementsClient(activity).getAchievementsIntent()
            .addOnSuccessListener(activity::startActivity)
            .addOnFailureListener(e -> status.accept("Play Games achievements unavailable."));
    }
    void unlock(String key) {
        if (!configured()) return;
        final String resourceName;
        switch (key) {
            case "level_1": resourceName="play_achievement_level_1"; break;
            case "level_100": resourceName="play_achievement_level_100"; break;
            case "level_500": resourceName="play_achievement_level_500"; break;
            case "level_1000": resourceName="play_achievement_level_1000"; break;
            default: return;
        }
        int id = activity.getResources().getIdentifier(resourceName, "string", activity.getPackageName());
        if (id == 0) return;
        String achievementId=activity.getString(id);
        if (!achievementId.isEmpty())
            PlayGames.getAchievementsClient(activity).unlock(achievementId);
    }
    void friends() {
        if (!configured()) { status.accept("Play Games is not configured."); return; }
        PlayGames.getPlayersClient(activity).loadFriends(50, false)
            .addOnSuccessListener(data -> {
                try {
                    int count=data.get().getCount();
                    status.accept("Your consenting Play Games friend list has " + count + " player(s).");
                } finally { data.get().release(); }
            })
            .addOnFailureListener(e -> {
                if (e instanceof FriendsResolutionRequiredException) {
                    PendingIntent consent=((FriendsResolutionRequiredException)e).getResolution();
                    try {
                        activity.startIntentSenderForResult(consent.getIntentSender(), FRIENDS_CONSENT,
                            null,0,0,0);
                    } catch (Exception denied) { status.accept("Friends permission dialog could not open."); }
                } else status.accept("Play Games friends unavailable; sharing still works.");
            });
    }
    void onActivityResult(int code, int result) {
        if (code == FRIENDS_CONSENT) {
            if (result==Activity.RESULT_OK) friends();
            else status.accept("Friends list access declined.");
        }
    }
    private boolean configured() { return !BuildConfig.PLAY_GAMES_PROJECT_ID.isEmpty(); }
}
