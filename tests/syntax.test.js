import { test } from "node:test";
import assert from "node:assert/strict";
import { tokenize } from "../js/syntax.js";

test("joining the tokens gives back the exact input", () => {
  for (const code of ["iptables -A INPUT -j DROP", "a\n\n\tb", 'echo "unclosed', ""]) {
    assert.equal(tokenize(code, "shell").map((t) => t.text).join(""), code);
  }
});
