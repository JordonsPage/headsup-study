const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const source = ts.transpileModule(
  fs.readFileSync(
    require("node:path").join(__dirname, "../lib/cards.ts"),
    "utf8",
  ),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const moduleUnderTest = { exports: {} };
new Function("exports", "module", source)(
  moduleUnderTest.exports,
  moduleUnderTest,
);
const { parseCards, shuffleCards, readSettings } = moduleUnderTest.exports;
assert.deepEqual(parseCards("bad json"), []);
assert.deepEqual(parseCards('{"length":1}'), []);
assert.deepEqual(
  parseCards(
    '[null,{}, {"term":"a","definition":"b"}, {"term":" ","definition":"b"}]',
  ),
  [{ term: "a", definition: "b" }],
);
assert.deepEqual(readSettings({ timerDuration: -1, numberOfCards: "10" }), {
  timerDuration: 60,
  numberOfCards: 0,
});
assert.deepEqual(readSettings({ timerDuration: 90, numberOfCards: 10 }), {
  timerDuration: 90,
  numberOfCards: 10,
});
const cards = [
  { term: "a", definition: "a" },
  { term: "b", definition: "b" },
  { term: "c", definition: "c" },
];
const result = shuffleCards(cards, () => 0);
assert.equal(cards[0].term, "a");
assert.deepEqual(
  result.map((c) => c.term),
  ["b", "c", "a"],
);
assert.deepEqual(new Set(result), new Set(cards));
console.log(
  "Card validation, settings normalization, and non-mutating shuffle passed.",
);
