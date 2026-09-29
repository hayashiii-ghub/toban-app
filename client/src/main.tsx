import { createRoot } from "react-dom/client";
import { applySavedFont } from "./fonts";
import App from "./App";
import "./index.css";

applySavedFont();

createRoot(document.getElementById("root")!).render(<App />);
