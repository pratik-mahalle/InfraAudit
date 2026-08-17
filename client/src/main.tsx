import { createRoot } from "react-dom/client";
import "./lib/posthog";
import App from "./App";
import "./index.css";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

createRoot(document.getElementById("root")!).render(
  <App />
);
