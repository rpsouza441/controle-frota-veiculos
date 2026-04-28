import { createApp } from "./app.js";
import { port, warnUnsafeConfig } from "./config.js";

warnUnsafeConfig();

const app = createApp();

app.listen(port, () => {
  console.log(`Fleet API listening on http://127.0.0.1:${port}`);
});
