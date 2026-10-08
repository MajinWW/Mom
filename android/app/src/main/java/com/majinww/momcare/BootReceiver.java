package com.majinww.momcare;
import android.content.*;
public class BootReceiver extends BroadcastReceiver { @Override public void onReceive(Context c,Intent i){Reminders.sync(c);} }
