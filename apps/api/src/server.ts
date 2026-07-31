import fs from "node:fs";
import { loadEnv } from "./config/env.js";
import { createApp } from "./app.js";

const env = loadEnv();
fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
fs.mkdirSync(env.EXPORT_DIR, { recursive: true });

const app = createApp();
app.listen(env.API_PORT, () => {
  console.log(`ProductStudio API listening on :${env.API_PORT}`);
});
