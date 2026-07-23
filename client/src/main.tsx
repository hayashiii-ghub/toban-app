import { createRoot } from "react-dom/client";
import { initSentry } from "./lib/sentry";
import { applySavedFont } from "./fonts";
import App from "./App";
import "./index.css";

initSentry();
applySavedFont();

createRoot(document.getElementById("root")!).render(<App />);
