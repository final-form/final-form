const packageJson = require("../package.json");

describe("package scripts", () => {
  test("does not define lifecycle install scripts", () => {
    expect(packageJson.scripts).not.toHaveProperty("preinstall");
    expect(packageJson.scripts).not.toHaveProperty("install");
    expect(packageJson.scripts).not.toHaveProperty("postinstall");
  });
});
