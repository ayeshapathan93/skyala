
  import { createRoot } from "react-dom/client";
  import { registerSW } from 'virtual:pwa-register';
  import App from "./app/App.tsx";
  import "./styles/index.css";

  const updateSW = registerSW({
    onOfflineReady() {
      console.log('SKYLA is ready to work offline.');
    },
    onNeedRefresh() {
      console.log('New version available. Refresh to update.');
    },
  });

  createRoot(document.getElementById("root")!).render(<App />);
  