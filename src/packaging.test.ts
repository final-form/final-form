import fs from "fs";
import path from "path";

const rootDir = path.resolve(__dirname, "..");

describe("packaging", () => {
  it("does not declare runtime dependencies", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(rootDir, "package.json"), "utf8"),
    );

    expect(pkg.dependencies).toBeUndefined();
    expect(JSON.stringify(pkg)).not.toContain("@babel/runtime");
  });

  it("builds with bundled Babel helpers", () => {
    const rollupConfig = fs.readFileSync(
      path.join(rootDir, "rollup.config.mjs"),
      "utf8",
    );

    expect(rollupConfig).toContain('babelHelpers: "bundled"');
    expect(rollupConfig).not.toContain("@babel/plugin-transform-runtime");
  });
});
