import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Amplify } from "aws-amplify";

import "./index.css";
import App from "./App.tsx";
import awsConfig from "./aws-exports";

Amplify.configure(awsConfig);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
