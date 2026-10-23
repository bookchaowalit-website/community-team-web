import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/mcp/route";

function rpc(body: unknown) {
  return POST(new Request("http://localhost/api/mcp", { method: "POST", body: JSON.stringify(body) }));
}

describe("MCP route", () => {
  it("echoes the JSON-RPC request id on initialize", async () => {
    const res = await rpc({ jsonrpc: "2.0", id: 7, method: "initialize" });
    const body = await res.json();
    expect(body.id).toBe(7);
    expect(body.result.serverInfo.name).toBe("Team Crew");
  });

  it("lists no tools, because the roster lives only in the visitor's browser", async () => {
    const res = await rpc({ jsonrpc: "2.0", id: "a", method: "tools/list" });
    const body = await res.json();
    expect(body.id).toBe("a");
    expect(body.result.tools).toEqual([]);
  });

  it("refuses a tool call instead of pretending to run it", async () => {
    const res = await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_data" } });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.id).toBe(3);
    expect(body.result).toBeUndefined();
    expect(body.error.code).toBe(-32602);
  });

  it("answers an unknown method with method-not-found", async () => {
    const res = await rpc({ jsonrpc: "2.0", id: 4, method: "resources/list" });
    expect((await res.json()).error.code).toBe(-32601);
  });

  it("answers malformed JSON with a parse error", async () => {
    const res = await POST(new Request("http://localhost/api/mcp", { method: "POST", body: "{not json" }));
    const body = await res.json();
    expect(body.error.code).toBe(-32700);
    expect(body.id).toBeNull();
  });
});
