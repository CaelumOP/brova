import { test } from "node:test";
import assert from "node:assert/strict";
import { tokenize } from "../js/syntax.js";

const colored = (code, language) => tokenize(code, language).filter((t) => t.type !== "plain").map((t) => `${t.type}:${t.text}`);

test("joining the tokens gives back the exact input", () => {
  const samples = [
    "iptables -A INPUT -j DROP", "a\n\n\tb", 'echo "unclosed', "", "x='a b' # c\n  y",
    "cat <<EOF | grep -v '#' && ls>out", "SELECT * FROM t WHERE id = 1; -- note",
  ];
  for (const code of samples) {
    for (const language of ["shell", "python", undefined]) {
      assert.equal(tokenize(code, language).map((t) => t.text).join(""), code);
    }
  }
});

test("shell: commands, flags, values, numbers", () => {
  assert.deepEqual(colored("iptables -A INPUT -p tcp --dport 22 -j DROP", "shell"), [
    "command:iptables", "flag:-A", "value:INPUT", "flag:-p", "value:tcp", "flag:--dport", "number:22", "flag:-j", "value:DROP",
  ]);
});

test("shell: a flag after a flag stays a flag; strings win over values", () => {
  assert.deepEqual(colored('grep -r -i "admin" /etc/passwd', "shell"), [
    "command:grep", "flag:-r", "flag:-i", 'string:"admin"',
  ]);
});

test("shell: a comment ignores quotes inside it", () => {
  assert.deepEqual(tokenize("# don't allow root", "shell"), [{ type: "comment", text: "# don't allow root" }]);
  assert.deepEqual(colored("echo a#b", "shell"), ["command:echo"]);
});

test("shell: commands after |, &&, ;, sudo, and a new line", () => {
  assert.deepEqual(colored("sudo nmap -sS 10.0.0.1 | tee out && wc -l\nls", "shell"), [
    "command:sudo", "command:nmap", "flag:-sS", "number:10.0.0.1", "command:tee", "command:wc", "flag:-l", "command:ls",
  ]);
});

test("other languages and no language color only strings and numbers", () => {
  const code = 'if (x > 10) { print("hi -v") }';
  for (const language of ["python", "javascript", undefined, "unknown"]) {
    assert.deepEqual(colored(code, language), ["number:10", 'string:"hi -v"']);
  }
});
