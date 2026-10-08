package com.majinww.momcare;
import android.app.*;
import android.content.*;
import android.net.Uri;
import android.os.Build;
import org.json.*;
import java.util.*;
import java.text.SimpleDateFormat;

public final class Reminders {
 static final String CHANNEL="momcare_routine";
 static android.content.SharedPreferences prefs(Context c){return c.getSharedPreferences("reminders",0);}
 static void channel(Context c){NotificationManager n=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);NotificationChannel ch=new NotificationChannel(CHANNEL,"Rotina MomCare",NotificationManager.IMPORTANCE_DEFAULT);ch.setDescription("Lembretes das suas atividades");n.createNotificationChannel(ch);}
 static PendingIntent pending(Context c,String id){Intent i=new Intent(c,ReminderReceiver.class);i.setData(Uri.parse("momcare://task/"+Uri.encode(id)));i.putExtra("id",id);return PendingIntent.getBroadcast(c,0,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
 static void sync(Context c){
  AlarmManager manager=(AlarmManager)c.getSystemService(Context.ALARM_SERVICE);
  Set<String> previous=prefs(c).getStringSet("scheduled",new HashSet<>());
  for(String id:previous)manager.cancel(pending(c,id));
  Set<String> ids=new HashSet<>();
  if(prefs(c).getBoolean("enabled",false))try{JSONArray tasks=new JSONArray(prefs(c).getString("tasks","[]"));for(int i=0;i<tasks.length();i++){JSONObject t=tasks.getJSONObject(i);schedule(c,t);ids.add(t.getString("id"));}}catch(Exception ignored){}
  prefs(c).edit().putStringSet("scheduled",ids).apply();
 }
 static String date(Calendar cal){return new SimpleDateFormat("yyyy-MM-dd",Locale.US).format(cal.getTime());}
 static long next(JSONObject t,long now) throws Exception {
  String start=t.getString("date");SimpleDateFormat fmt=new SimpleDateFormat("yyyy-MM-dd",Locale.US);fmt.setLenient(false);
  Calendar cal=Calendar.getInstance();cal.setTimeInMillis(now);String today=date(cal);
  if(start.compareTo(today)>0)cal.setTime(fmt.parse(start));
  String[] time=t.getString("time").split(":");JSONArray days=t.getJSONArray("days"),done=t.getJSONArray("doneDates");
  for(int i=0;i<8;i++){
   cal.set(Calendar.HOUR_OF_DAY,Integer.parseInt(time[0]));cal.set(Calendar.MINUTE,Integer.parseInt(time[1]));cal.set(Calendar.SECOND,0);cal.set(Calendar.MILLISECOND,0);
   String d=date(cal);boolean occurrence=days.length()==0?d.equals(start):false;
   for(int j=0;j<days.length();j++)if(days.getInt(j)==cal.get(Calendar.DAY_OF_WEEK)-1)occurrence=true;
   for(int j=0;j<done.length();j++)if(done.getString(j).equals(d))occurrence=false;
   if(occurrence&&d.compareTo(start)>=0&&cal.getTimeInMillis()>now)return cal.getTimeInMillis();
   cal.add(Calendar.DAY_OF_MONTH,1);
  }return -1;
 }
 static void schedule(Context c,JSONObject t){try{long at=next(t,System.currentTimeMillis()+1000);if(at>0)((AlarmManager)c.getSystemService(Context.ALARM_SERVICE)).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pending(c,t.getString("id")));}catch(Exception ignored){}}
 static JSONObject find(Context c,String id){try{JSONArray tasks=new JSONArray(prefs(c).getString("tasks","[]"));for(int i=0;i<tasks.length();i++){JSONObject t=tasks.getJSONObject(i);if(id.equals(t.getString("id")))return t;}}catch(Exception ignored){}return null;}
 static void notifyTask(Context c,JSONObject t){
  if(Build.VERSION.SDK_INT>=33&&c.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED)return;
  try{channel(c);Intent open=new Intent(c,MainActivity.class);open.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);PendingIntent pi=PendingIntent.getActivity(c,0,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);Notification n=new Notification.Builder(c,CHANNEL).setSmallIcon(com.majinww.momcare.R.drawable.ic_notification).setContentTitle("MomCare · sua rotina").setContentText(t.getString("title")).setContentIntent(pi).setAutoCancel(true).setVisibility(Notification.VISIBILITY_PRIVATE).build();((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).notify(t.getString("id"),0,n);}catch(Exception ignored){}
 }
}
