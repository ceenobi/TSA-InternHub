// @vitest-environment node
import { describe, it, expect } from "vitest";
import { tryCatchWrapper } from "../tryCatchWrapper";

describe("tryCatchWrapper", () => {
  it("returns the result of a successful operation", async () => {
    const result = await tryCatchWrapper(async () => "success");
    expect(result).toBe("success");
  });

  it("returns a 500 Response when operation throws", async () => {
    const result = await tryCatchWrapper(async () => {
      throw new Error("Something went wrong");
    });

    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(500);

    const body = await result.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("Something went wrong");
  });

  it("uses default error message when error has no message", async () => {
    const result = await tryCatchWrapper(
      async () => {
        throw new Error();
      },
      "Custom error message",
    );

    expect(result).toBeInstanceOf(Response);
    const body = await result.json();
    expect(body.message).toBe("Custom error message");
  });

  it("returns a Response with JSON content-type header on error", async () => {
    const result = await tryCatchWrapper(async () => {
      throw new Error("fail");
    });

    expect(result.headers.get("Content-Type")).toBe("application/json");
  });
});
