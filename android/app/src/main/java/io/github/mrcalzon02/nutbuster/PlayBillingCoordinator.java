package io.github.mrcalzon02.nutbuster;

import android.app.Activity;
import com.android.billingclient.api.*;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;

/** Play Billing 9.1; never fulfills locally before backend receipt verification. */
final class PlayBillingCoordinator implements PurchasesUpdatedListener {
    private static final String[] SKUS = {
        "nutbuster_gigantic_nuts", "nutbuster_premium_gems", "nutbuster_royal_bundle",
        "nutbuster_century_chest", "nutbuster_lifetime_vip", "nutbuster_booster_crate",
        null, null, "nutbuster_royal_manor"
    };
    private final Activity activity;
    private final Consumer<String> toWeb;
    private final BillingClient client;
    private final PlayIntegrityGate integrity;
    private PlayAccountCoordinator account;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final Map<String, ProductDetails> catalog = new HashMap<>();
    private final Map<String, Purchase> fulfillable = new HashMap<>();
    private boolean connected;

    PlayBillingCoordinator(Activity activity, Consumer<String> toWeb) {
        this.activity = activity; this.toWeb = toWeb;
        integrity = new PlayIntegrityGate(activity);
        client = BillingClient.newBuilder(activity).setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection().build();
        client.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    connected = true; refreshCatalog(); restorePurchases();
                } else status("Google Play Billing unavailable: " + result.getDebugMessage());
            }
            @Override public void onBillingServiceDisconnected() {
                connected = false;
                status("Google Play Billing connection interrupted. No order was charged by NUTBUSTER.");
            }
        });
    }
    void setAccountCoordinator(PlayAccountCoordinator account) { this.account=account; }
    private void status(String message) {
        toWeb.accept("window.NutbusterPlay && NutbusterPlay.status(" + JSONObject.quote(message) + ")");
    }
    static String skuFor(int index) { return index >= 0 && index < SKUS.length ? SKUS[index] : null; }
    private static int indexFor(String sku) {
        for (int i=0; i<SKUS.length; i++) if (sku != null && sku.equals(SKUS[i])) return i;
        return -1;
    }
    void refreshCatalog() {
        if (!connected) return;
        if (BuildConfig.PLAY_VERIFICATION_ENDPOINT.isEmpty()) {
            // Even an approved Google catalog is not an actionable store without receipt validation.
            status("Google Play products are disabled until receipt verification is configured.");
            return;
        }
        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        for (String sku : SKUS) if (sku != null)
            products.add(QueryProductDetailsParams.Product.newBuilder()
                .setProductId(sku).setProductType(BillingClient.ProductType.INAPP).build());
        client.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(products).build(),
            (result, details) -> {
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    status("Play catalog unavailable; paid orders are disabled."); return;
                }
                JSONObject prices = new JSONObject();
                catalog.clear();
                try {
                    for (ProductDetails detail : details.getProductDetailsList()) {
                        int i = indexFor(detail.getProductId());
                        if (i < 0) continue;
                        List<ProductDetails.OneTimePurchaseOfferDetails> options = detail.getOneTimePurchaseOfferDetailsList();
                        if (options == null || options.isEmpty()) continue;
                        catalog.put(detail.getProductId(), detail);
                        prices.put(Integer.toString(i), options.get(0).getFormattedPrice());
                    }
                } catch (Exception invalid) { status("Play catalog invalid."); return; }
                toWeb.accept("window.NutbusterPlay && NutbusterPlay.catalog(" + prices.toString() + ")");
            });
    }
    void purchase(int index) {
        activity.runOnUiThread(() -> {
            final String sku = skuFor(index);
            if (sku == null) { status("This item is not a paid Play product."); return; }
            if (BuildConfig.PLAY_VERIFICATION_ENDPOINT.isEmpty()) {
                status("Purchases unavailable until receipt-verification service is configured."); return;
            }
            ProductDetails details = catalog.get(sku);
            if (!connected || details == null) { status("Product not available on Google Play."); refreshCatalog(); return; }
            List<ProductDetails.OneTimePurchaseOfferDetails> offers = details.getOneTimePurchaseOfferDetailsList();
            if (offers == null || offers.isEmpty()) { status("No eligible purchase offer."); return; }
            BillingFlowParams.ProductDetailsParams item = BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(details).setOfferToken(offers.get(0).getOfferToken()).build();
            BillingResult response = client.launchBillingFlow(activity,
                BillingFlowParams.newBuilder().setProductDetailsParamsList(Collections.singletonList(item)).build());
            if (response.getResponseCode() != BillingClient.BillingResponseCode.OK)
                status("Play checkout unavailable: " + response.getDebugMessage());
        });
    }
    @Override public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        if (result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            status("Purchase canceled; no rewards were granted."); return;
        }
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            status("Purchase was not completed: " + result.getDebugMessage()); return;
        }
        if (purchases != null) for (Purchase purchase : purchases) process(purchase);
    }
    void restorePurchases() {
        if (!connected) return;
        client.queryPurchasesAsync(QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.INAPP).build(), (result, purchases) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                status("Could not restore existing Play purchases."); return;
            }
            for (Purchase purchase : purchases) process(purchase);
        });
    }
    private void process(Purchase purchase) {
        if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
            status("Payment pending. Items will arrive only after Google Play confirms payment."); return;
        }
        if (purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) return;
        if (purchase.getProducts().size() != 1) { status("Unexpected multi-product order."); return; }
        String sku = purchase.getProducts().get(0);
        int index = indexFor(sku);
        if (index < 0 || BuildConfig.PLAY_VERIFICATION_ENDPOINT.isEmpty() ||
            BuildConfig.PLAY_INTEGRITY_PROJECT_NUMBER.isEmpty()) return;
        // Fresh token per financial event; never send a purchase token to the WebView.
        final String install = installId(), attempt = UUID.randomUUID().toString();
        try {
            String hash = hashRequest(activity.getPackageName(), sku,
                purchase.getPurchaseToken(), install, attempt);
            integrity.attest(hash, integrityToken ->
                io.execute(() -> verify(purchase, sku, index, install, attempt, integrityToken)),
                () -> status("Google Play could not attest this purchase. Retry restore later."));
        } catch (Exception error) {
            status("Purchase verification unavailable; no payment data was exposed.");
        }
    }
    private static String hashRequest(String pkg, String sku, String token,
                                     String install, String attempt) throws Exception {
        String message = "nutbuster-play-integrity-v1\n" + pkg + "\n" + sku + "\n" +
            token + "\n" + install + "\n" + attempt;
        byte[] digest=java.security.MessageDigest.getInstance("SHA-256")
            .digest(message.getBytes(StandardCharsets.UTF_8));
        StringBuilder out=new StringBuilder(64);
        for(byte value : digest)out.append(String.format(java.util.Locale.ROOT,"%02x", value & 0xff));
        return out.toString();
    }
    private void verify(Purchase purchase, String sku, int index, String install,
                        String attempt, String integrityToken) {
        HttpURLConnection connection = null;
        try {
            URL url = new URL(BuildConfig.PLAY_VERIFICATION_ENDPOINT);
            if (!"https".equalsIgnoreCase(url.getProtocol()))
                throw new SecurityException("Receipt verifier must use HTTPS.");
            connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(12000); connection.setReadTimeout(12000);
            connection.setInstanceFollowRedirects(false);
            connection.setRequestMethod("POST"); connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json");
            JSONObject request = new JSONObject().put("packageName", activity.getPackageName())
                .put("productId", sku).put("purchaseToken", purchase.getPurchaseToken())
                .put("installId", install).put("attemptId", attempt)
                .put("integrityToken", integrityToken);
            String session=account==null?null:account.activeSession();
            if (session!=null)request.put("accountSession",session);
            try (OutputStream out = connection.getOutputStream()) {
                out.write(request.toString().getBytes(StandardCharsets.UTF_8));
            }
            if (connection.getResponseCode() != 200) throw new SecurityException("Receipt not verified.");
            byte[] bytes;
            try (InputStream in = connection.getInputStream()) { bytes = readLimited(in, 4096); }
            JSONObject reply = new JSONObject(new String(bytes, StandardCharsets.UTF_8));
            String receiptId = reply.optString("receiptId", "");
            if (!reply.optBoolean("verified") || !sku.equals(reply.optString("productId"))
                || !receiptId.matches("[a-zA-Z0-9:_-]{12,160}"))
                throw new SecurityException("Invalid backend purchase verdict.");
            synchronized (fulfillable) { fulfillable.put(receiptId, purchase); }
            toWeb.accept("window.NutbusterApp && NutbusterApp.receiveVerifiedPurchase("
                + index + "," + JSONObject.quote(receiptId) + ")");
        } catch (Exception e) { status("Receipt validation incomplete. Your order will be checked again; no duplicate reward will be issued."); }
        finally { if (connection != null) connection.disconnect(); }
    }
    /** Stable per-install pseudonym, not an advertising ID or account identifier. */
    private String installId() {
        android.content.SharedPreferences store = activity.getSharedPreferences("nutbuster.play.receipts", 0);
        String id = store.getString("installId", "");
        if (id.matches("[0-9a-f-]{36}")) return id;
        id = UUID.randomUUID().toString();
        store.edit().putString("installId", id).apply();
        return id;
    }
    private static byte[] readLimited(InputStream in, int limit) throws Exception {
        java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
        byte[] buffer = new byte[1024]; int count;
        while ((count = in.read(buffer)) != -1) {
            if (output.size() + count > limit) throw new SecurityException("Oversized verifier reply");
            output.write(buffer, 0, count);
        }
        return output.toByteArray();
    }
    /** Called only AFTER the web save has durably recorded this verified receipt. */
    void confirmFulfillment(String receiptId) {
        Purchase purchase;
        synchronized (fulfillable) { purchase = fulfillable.get(receiptId); }
        if (purchase == null) return;
        String sku = purchase.getProducts().get(0);
        if (indexFor(sku) == 4 || indexFor(sku) == 8) {
            if (purchase.isAcknowledged()) { synchronized (fulfillable) { fulfillable.remove(receiptId); } return; }
            client.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchase.getPurchaseToken()).build(), result -> {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK)
                    synchronized (fulfillable) { fulfillable.remove(receiptId); }
                else status("Play purchase confirmation pending. Restore purchases to retry.");
            });
        } else {
            client.consumeAsync(ConsumeParams.newBuilder()
                .setPurchaseToken(purchase.getPurchaseToken()).build(), (result, token) -> {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK)
                    synchronized (fulfillable) { fulfillable.remove(receiptId); }
                else status("Play consumable confirmation pending. Restore purchases to retry.");
            });
        }
    }
    void close() { client.endConnection(); io.shutdown(); }
}
