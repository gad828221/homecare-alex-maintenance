import type { ReactNode } from "react";
import { EnhancedNotificationProvider } from "./EnhancedNotificationSystem";
import PresenceManager from "./PresenceManager";

export default function StaffRuntime({ children }: { children: ReactNode }) {
  return (
    <EnhancedNotificationProvider>
      {children}
      <PresenceManager />
    </EnhancedNotificationProvider>
  );
}
