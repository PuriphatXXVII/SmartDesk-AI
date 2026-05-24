import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts",
  output: {
    file: "dist/smartdesk.js",
    format: "iife",
    name: "SmartDesk",
    sourcemap: true,
  },
  plugins: [resolve(), typescript({ tsconfig: "./tsconfig.json" }), terser()],
};
