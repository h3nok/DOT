import { describe, expect, it } from "vitest";
import { resolveSupportMethods, type DirectSupportConfig } from "./supportMethods.js";

const empty = (): DirectSupportConfig => ({ preferredMethod: "zelle", zelle: { recipient: "", recipientName: "" }, cashApp: { url: "" } });

describe("public direct support destinations", () => {
  it("publishes no recipient until one is supplied", () => {
    expect(resolveSupportMethods(empty())).toEqual([]);
  });
  it("requires both the enrolled Zelle destination and its recipient name", () => {
    const config = empty();
    config.zelle.recipient = "author@example.com";
    expect(() => resolveSupportMethods(config)).toThrow(/recipient name/);
    config.zelle.recipientName = "Example Author";
    expect(resolveSupportMethods(config)[0]).toMatchObject({ id: "zelle", recipient: "author@example.com", recipientName: "Example Author" });
    config.zelle.recipient = "+1 (303) 555-0123";
    expect(resolveSupportMethods(config)[0].id).toBe("zelle");
  });
  it.each(["javascript:alert(1)", "http://cash.app/$example", "https://cash.app.evil.example/$example", "https://cash.app@evil.example/$example", "https://cash.app/", "https://name:password@cash.app/$example"])("refuses an unsafe or incomplete Cash App destination: %s", url => {
    expect(() => resolveSupportMethods({ ...empty(), cashApp: { url } })).toThrow();
  });
  it.each(["++13035550123", "+3035550123", "not-a-recipient"])("refuses a malformed Zelle destination: %s", recipient => {
    expect(() => resolveSupportMethods({ ...empty(), zelle: { recipient, recipientName: "Example Author" } })).toThrow();
  });
  it("keeps the preferred confirmed method first", () => {
    expect(resolveSupportMethods({ preferredMethod: "cashapp", zelle: { recipient: "author@example.com", recipientName: "Example Author" }, cashApp: { url: "https://cash.app/$example" } }).map(method => method.id)).toEqual(["cashapp", "zelle"]);
  });
});
