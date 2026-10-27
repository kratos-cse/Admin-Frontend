const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Exercise the actual TypeScript API client without adding a second test toolchain.
function loadModules(fetch) {
  const modules = new Map();
  const storage = new Map([["kratos_admin_access_token", "test-user-jwt"]]);
  function load(filename) {
    filename = path.resolve(__dirname, "..", filename);
    if (modules.has(filename)) return modules.get(filename);
    const module = { exports: {} };
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    });
    const context = vm.createContext({
      module, exports: module.exports, fetch, URLSearchParams, AbortController, Error,
      window: { localStorage: { getItem: (key) => storage.get(key) ?? null } },
      require: (specifier) => load(path.relative(path.resolve(__dirname, ".."), path.resolve(path.dirname(filename), `${specifier}.ts`))),
    });
    vm.runInContext(outputText, context, { filename });
    modules.set(filename, module.exports);
    return module.exports;
  }
  return { api: load("lib/api/leaderboard.ts"), helpers: load("lib/leaderboard.ts"), client: load("lib/api/client.ts") };
}

function response(data, status = 200) {
  return new Response(JSON.stringify(status === 200 ? { status: "success", data } : data), { status });
}

test("reads use the authenticated API, no-store and encoded event/history filters", async () => {
  const requests = [];
  const { api } = loadModules(async (url, options) => { requests.push({ url, options }); return response([]); });
  await api.getLeaderboard();
  await api.getLeaderboard("event & one");
  await api.listLeaderboardEvents();
  await api.listLeaderboardColleges();
  await api.listPointAwards("event & one", "college/one");
  assert.equal(requests[0].url, "/api/v1/admin/leaderboard");
  assert.equal(new URL(requests[1].url, "https://admin.test").searchParams.get("event_id"), "event & one");
  const history = new URL(requests[4].url, "https://admin.test");
  assert.equal(history.searchParams.get("college_id"), "college/one");
  assert.equal(history.searchParams.get("limit"), "500");
  for (const { url, options } of requests) {
    assert.ok(url.startsWith("/api/v1/admin/leaderboard"));
    assert.equal(options.headers.Authorization, "Bearer test-user-jwt");
    assert.equal(options.cache, "no-store");
  }
});

test("saving replaces points via PUT, clearing uses DELETE, and neither operation supplies an actor", async () => {
  const requests = [];
  const { api } = loadModules(async (url, options) => { requests.push({ url, options }); return response({ rows: [] }); });
  await api.awardPoints("event/one", "college?one", 0, "Correction");
  await api.voidPoints("event/one", "college?one");
  assert.equal(requests[0].url, "/api/v1/admin/leaderboard/events/event%2Fone/colleges/college%3Fone/award");
  assert.equal(requests[0].options.method, "PUT");
  assert.deepEqual(JSON.parse(requests[0].options.body), { points: 0, note: "Correction" });
  assert.equal(requests[1].options.method, "DELETE");
  assert.equal(requests[1].options.body, undefined);
  assert.ok(requests.every(({ options }) => options.headers.Authorization === "Bearer test-user-jwt"));
});

test("college create and live-profile import are authenticated mutations", async () => {
  const requests = [];
  const { api } = loadModules(async (url, options) => { requests.push({ url, options }); return response({}); });
  await api.createLeaderboardCollege("Easwari Engineering College");
  await api.importLeaderboardColleges();
  assert.deepEqual(JSON.parse(requests[0].options.body), { name: "Easwari Engineering College" });
  assert.equal(requests[1].url, "/api/v1/admin/leaderboard/colleges/import");
  assert.ok(requests.every(({ options }) => options.method === "POST" && options.headers.Authorization === "Bearer test-user-jwt"));
});

test("API conflicts retain their status and explain review/retry", async () => {
  const { api, helpers, client } = loadModules(async () => response({ error: { code: "CONFLICT", message: "Someone else changed this award." } }, 409));
  await assert.rejects(api.awardPoints("e", "c", 10, null), (error) => {
    assert.ok(error instanceof client.ApiError);
    assert.equal(error.status, 409);
    assert.match(helpers.leaderboardError(error), /Review them before retrying/);
    return true;
  });
});

test("expired auth and missing backend are explained without a demo fallback", async () => {
  for (const [status, message] of [[401, /session has expired/], [403, /no longer have permission/], [404, /backend leaderboard release/]]) {
    const { api, helpers } = loadModules(async () => response({}, status));
    await assert.rejects(api.getLeaderboard(), (error) => { assert.match(helpers.leaderboardError(error), message); return true; });
  }
});

test("cancellation reaches fetch and preserves the abort rather than reporting a network failure", async () => {
  const controller = new AbortController();
  const aborted = new Error("Request aborted");
  const { api } = loadModules(async (_url, options) => {
    assert.equal(options.signal, controller.signal);
    controller.abort();
    throw aborted;
  });
  await assert.rejects(api.getLeaderboard("event", controller.signal), (error) => error === aborted);
});

test("points validation accepts zero and the maximum; rejects missing, fractional, negative and nonfinite scores", () => {
  const { helpers } = loadModules(() => {});
  for (const [input, expected] of [["0", 0], ["100000", 100000], [" 42 ", 42]]) assert.equal(helpers.parsePoints(input), expected);
  for (const input of ["", " ", "-1", "1.5", "100001", "NaN", "Infinity", "abc"]) assert.equal(helpers.parsePoints(input), null);
  for (const [rank, label] of [[1, "1st"], [2, "2nd"], [3, "3rd"], [11, "11th"], [12, "12th"], [13, "13th"], [21, "21st"]]) assert.equal(helpers.ordinal(rank), label);
});
