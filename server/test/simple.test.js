import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { expect } = require("chai");

describe("Simple Test", () => {
  it("should pass a simple test", () => {
    expect(1 + 1).to.equal(2);
  });
});

