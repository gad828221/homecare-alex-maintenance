import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface OnlineUser {
  user_id: string;
  name: string;
  role: string;
  online_at: string;
}

export default function PresenceManager() {
  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const currentUserStr = localStorage.getItem("currentUser");
    
    if (!userRole || !currentUserStr) return;
    
    const currentUser = JSON.parse(currentUserStr);
    const userName = currentUser.name || currentUser.techName || currentUser.username || "مستخدم";
    const userId = currentUser.id || userName;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        // console.log('Presence sync', channel.presenceState());
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // console.log('User joined', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // console.log('User left', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            name: userName,
            role: userRole,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return null; // مكون وظيفي فقط
}
