package io.github.mrcalzon02.nutbuster;

import android.app.Activity;
import com.google.android.gms.games.PlayGames;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;

/** Optional pseudonymous PGS account proof. OAuth codes and signed sessions never enter the WebView. */
final class PlayAccountCoordinator {
    private final Activity activity;
    private final Consumer<String> web;
    private final PlayIntegrityGate integrity;
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private volatile String session;
    private volatile long validUntilMillis;
    PlayAccountCoordinator(Activity activity, Consumer<String> web) {
        this.activity=activity;
        this.web=web;
        integrity=new PlayIntegrityGate(activity);
    }
    String activeSession() {
        return session!=null && System.currentTimeMillis()<validUntilMillis ? session : null;
    }
    void link() {
        if (BuildConfig.PLAY_GAMES_SERVER_CLIENT_ID.isEmpty() ||
            BuildConfig.PLAY_INTEGRITY_PROJECT_NUMBER.isEmpty() ||
            BuildConfig.PLAY_VERIFICATION_ENDPOINT.isEmpty()) {
            status("Account verification is not yet configured in Google Play.");
            return;
        }
        PlayGames.getGamesSignInClient(activity)
            .requestServerSideAccess(BuildConfig.PLAY_GAMES_SERVER_CLIENT_ID, false)
            .addOnSuccessListener(code -> {
                if (code==null || code.isEmpty()) {
                    status("Account verification declined or unavailable."); return;
                }
                final String installId=activity.getSharedPreferences("nutbuster.play.receipts",0)
                    .getString("installId","");
                final String attempt=UUID.randomUUID().toString();
                if (!installId.matches("[0-9a-f-]{36}")) {
                    status("Open the Nut Emporium first to initialize secure verification.");return;
                }
                try {
                    String message="nutbuster-play-account-v1\n"+activity.getPackageName()+"\n"+
                        code+"\n"+installId+"\n"+attempt;
                    byte[] hash=MessageDigest.getInstance("SHA-256")
                        .digest(message.getBytes(StandardCharsets.UTF_8));
                    StringBuilder sb=new StringBuilder();
                    for(byte value:hash)sb.append(String.format(Locale.ROOT,"%02x",value&0xff));
                    integrity.attest(sb.toString(),token ->
                        io.execute(() -> exchange(code,installId,attempt,token)),
                        () -> status("Account attestation failed. No identity was shared."));
                } catch(Exception failure) { status("Account verification unavailable."); }
            })
            .addOnFailureListener(error -> status("Play Games sign-in unavailable. Offline play continues."));
    }
    private void exchange(String authCode,String install,String attempt,String token) {
        HttpURLConnection c=null;
        try {
            String url=BuildConfig.PLAY_VERIFICATION_ENDPOINT;
            if(!url.endsWith("/verify"))throw new SecurityException("Account endpoint mismatch");
            URL endpoint=new URL(url.substring(0,url.length()-"/verify".length())+"/account/link");
            if(!"https".equalsIgnoreCase(endpoint.getProtocol()))throw new SecurityException("HTTPS required");
            c=(HttpURLConnection)endpoint.openConnection();
            c.setInstanceFollowRedirects(false);
            c.setConnectTimeout(12000);c.setReadTimeout(12000);
            c.setRequestMethod("POST");c.setDoOutput(true);
            c.setRequestProperty("Content-Type","application/json");
            byte[] request=new JSONObject().put("packageName",activity.getPackageName())
                .put("authCode",authCode).put("installId",install).put("attemptId",attempt)
                .put("integrityToken",token).toString().getBytes(StandardCharsets.UTF_8);
            try(OutputStream o=c.getOutputStream()){o.write(request);}
            if(c.getResponseCode()!=200)throw new SecurityException("Unverified player");
            byte[] response;
            try(InputStream in=c.getInputStream()){
                java.io.ByteArrayOutputStream buffer=new java.io.ByteArrayOutputStream();
                byte[] chunk=new byte[1024];int n;
                while((n=in.read(chunk))!=-1){
                    if(buffer.size()+n>2048)throw new SecurityException("Oversized account response");
                    buffer.write(chunk,0,n);
                }
                response=buffer.toByteArray();
            }
            JSONObject reply=new JSONObject(new String(response,StandardCharsets.UTF_8));
            String verified=reply.optString("accountSession","");
            int seconds=reply.optInt("expiresInSeconds",0);
            if(!reply.optBoolean("verified")||seconds<30||seconds>900||
                !verified.matches("[a-zA-Z0-9._-]{80,1024}"))
                throw new SecurityException("Invalid signed account session");
            session=verified;
            validUntilMillis=System.currentTimeMillis()+seconds*1000L-5000L;
            status("Play Games account verified privately for this session.");
        }catch(Exception e){
            session=null;validUntilMillis=0;
            status("Private account verification incomplete. Gameplay stays offline.");
        }finally{if(c!=null)c.disconnect();}
    }
    void unlink(){
        session=null;validUntilMillis=0;
        status("Linked account session cleared from memory.");
    }
    private void status(String message){
        web.accept("window.NutbusterPlay && NutbusterPlay.status("+JSONObject.quote(message)+")");
    }
    void close(){unlink();io.shutdown();}
}
