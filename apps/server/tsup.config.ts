import { defineConfig } from "tsup";

// The two process entry points, each bundled with the code it imports (the generated Prisma client included).
// Dependencies stay external and load from node_modules.
export default defineConfig({
  entry: ["src/server.ts", "src/worker.ts"],
  format: ["esm"],
  target: "node24",
  clean: true,
  sourcemap: true,
});
