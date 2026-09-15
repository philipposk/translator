import { describe, expect, it } from "vitest";
import { capabilitySchemaProblems } from "@page-assistant/core";
import { clientCapabilities } from "./capabilities-client";
import { serverCapabilities } from "./capabilities-server";

// The SDK validates every capability schema at startup and refuses to start on a problem;
// catch it here instead of in the browser.
describe("assistant capabilities pass the SDK schema check", () => {
  it("browser capabilities", () => {
    expect(capabilitySchemaProblems(clientCapabilities())).toEqual([]);
  });
  it("server capabilities", () => {
    expect(capabilitySchemaProblems(serverCapabilities())).toEqual([]);
  });
});
