import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { trackPhoneClick } from "./utils/adTracking";

const isStaffPath = Boolean((window as Window & { __MG_STAFF_PATH__?: boolean }).__MG_STAFF_PATH__);

if (!isStaffPath) {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const phoneLink = target?.closest<HTMLAnchorElement>('a[href^="tel:"]');
    if (phoneLink) trackPhoneClick();
  }, { capture: true });
}

createRoot(document.getElementById("root")!).render(<App />);
