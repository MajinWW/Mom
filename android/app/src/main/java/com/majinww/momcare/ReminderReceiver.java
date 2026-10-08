package com.majinww.momcare;
import android.content.*;
import org.json.JSONObject;
public class ReminderReceiver extends BroadcastReceiver {
 @Override public void onReceive(Context c,Intent intent){if(!Reminders.prefs(c).getBoolean("enabled",false))return;JSONObject task=Reminders.find(c,intent.getStringExtra("id"));if(task!=null){Reminders.notifyTask(c,task);Reminders.schedule(c,task);}}
}
