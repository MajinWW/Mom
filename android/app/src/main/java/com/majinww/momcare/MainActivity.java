package com.majinww.momcare;
import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.graphics.Color;
import android.webkit.*;
import android.view.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

public class MainActivity extends Activity {
 private WebView web;
 private String pendingBackup;
 private android.content.SharedPreferences reminderPrefs;
 private static final String ORIGIN="https://app.momcare.local/";
 @Override public void onCreate(Bundle b){
  super.onCreate(b);
  reminderPrefs=getSharedPreferences("reminders",0);
  Reminders.channel(this);
  getWindow().setStatusBarColor(Color.rgb(252,248,244));
  getWindow().setNavigationBarColor(Color.WHITE);
  getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
  web=new WebView(this);
  web.setBackgroundColor(Color.rgb(252,248,244));
  web.setPadding(0,0,0,0);
  web.setOnApplyWindowInsetsListener((v,insets)->{v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets.consumeSystemWindowInsets();});
  setContentView(web);
  web.getSettings().setJavaScriptEnabled(true);
  web.getSettings().setDomStorageEnabled(true);
  web.getSettings().setAllowFileAccess(false);
  web.getSettings().setAllowContentAccess(false);
  web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  web.addJavascriptInterface(new BackupBridge(),"Android");
  web.setWebChromeClient(new WebChromeClient());
  web.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return !r.getUrl().toString().startsWith(ORIGIN);}
   @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){
    String url=r.getUrl().toString();
    if(url.startsWith(ORIGIN)){
     String path=r.getUrl().getPath().substring(1);if(path.isEmpty())path="index.html";
     if(!path.equals("index.html")&&!path.equals("style.css")&&!path.equals("core.js")&&!path.equals("script.js")&&!path.equals("manifest.json")&&!path.equals("icon.svg"))return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));
     try{return new WebResourceResponse(path.endsWith("svg")?"image/svg+xml":path.endsWith("json")?"application/json":path.endsWith("css")?"text/css":path.endsWith("js")?"application/javascript":"text/html","UTF-8",getAssets().open(path));}catch(IOException e){return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));}
    }
    return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));
   }
  });
  web.loadUrl(ORIGIN+"index.html");
  if(b!=null)pendingBackup=b.getString("backup");
 }
 @Override protected void onSaveInstanceState(Bundle b){super.onSaveInstanceState(b);b.putString("backup",pendingBackup);}
 public class BackupBridge {
  @JavascriptInterface public void syncReminders(String text){if(text.length()>5000000)return;runOnUiThread(()->{try{new org.json.JSONArray(text);reminderPrefs.edit().putString("tasks",text).apply();Reminders.sync(MainActivity.this);}catch(Exception e){notice("Não foi possível atualizar os lembretes");}});}
  @JavascriptInterface public void reminderStatus(){runOnUiThread(()->showReminderStatus());}
  @JavascriptInterface public void toggleReminders(){runOnUiThread(()->{
   if(reminderPrefs.getBoolean("enabled",false)){reminderPrefs.edit().putBoolean("enabled",false).apply();Reminders.sync(MainActivity.this);showReminderStatus();return;}
   if(android.os.Build.VERSION.SDK_INT>=33&&checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED){requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS},51);}else enableReminders();
  });}

  @JavascriptInterface public void saveBackup(String text){if(text.length()>5000000)return;runOnUiThread(()->{pendingBackup=text;Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.setType("application/json");i.addCategory(Intent.CATEGORY_OPENABLE);i.putExtra(Intent.EXTRA_TITLE,"MomCare-backup.json");startActivityForResult(i,1);});}
  @JavascriptInterface public void openBackup(){runOnUiThread(()->{Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.setType("*/*");i.addCategory(Intent.CATEGORY_OPENABLE);startActivityForResult(i,2);});}
 }
 private void notice(String text){web.evaluateJavascript("window.momNotice("+JSONObject.quote(text)+")",null);}
 @Override protected void onActivityResult(int req,int result,Intent data){super.onActivityResult(req,result,data);if(result!=RESULT_OK||data==null||data.getData()==null)return;Uri uri=data.getData();try{
  if(req==1&&pendingBackup!=null){try(OutputStream out=getContentResolver().openOutputStream(uri)){if(out==null)throw new IOException();out.write(pendingBackup.getBytes(StandardCharsets.UTF_8));}pendingBackup=null;notice("Backup salvo");}
  if(req==2){ByteArrayOutputStream out=new ByteArrayOutputStream();try(InputStream in=getContentResolver().openInputStream(uri)){if(in==null)throw new IOException();byte[] buf=new byte[8192];int n;while((n=in.read(buf))!=-1){out.write(buf,0,n);if(out.size()>5000000)throw new IOException();}}String text=out.toString("UTF-8");web.evaluateJavascript("window.momImport("+JSONObject.quote(text)+")",null);}
 }catch(Exception e){notice("Não foi possível abrir ou salvar o backup");}}
 private void showReminderStatus(){boolean enabled=reminderPrefs.getBoolean("enabled",false);web.evaluateJavascript("window.momReminderStatus("+enabled+")",null);}
 private void enableReminders(){reminderPrefs.edit().putBoolean("enabled",true).apply();Reminders.sync(this);showReminderStatus();notice("Lembretes ativados");}
 @Override public void onRequestPermissionsResult(int req,String[] permissions,int[] results){super.onRequestPermissionsResult(req,permissions,results);if(req==51){if(results.length>0&&results[0]==android.content.pm.PackageManager.PERMISSION_GRANTED)enableReminders();else notice("Notificações não autorizadas");}}
 @Override public void onBackPressed(){web.evaluateJavascript("(()=>{let d=document.querySelector('dialog[open]');if(d){d.close();return true;}if(!document.getElementById('home').classList.contains('active')){document.querySelector('nav [data-tab=home]').click();return true;}return false;})()",r->{if("false".equals(r))finish();});}
 @Override protected void onDestroy(){web.removeJavascriptInterface("Android");web.destroy();super.onDestroy();}
}
