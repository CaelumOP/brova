// Code tokenizer for code blocks (brova.md, Phase 5, item 29). Pure: no DOM.
// Shell gets full coloring; every other language, and code with no language,
// colors only quoted text and numbers.
//
// One left-to-right pass. At each position the first match wins: a shell
// comment, a quoted string, a line break, spaces, an operator, then a word.
// Joining the tokens' text always gives back the exact input.

const STRING = /^"(?:\\.|[^"\\\n])*"?|^'[^'\n]*'?/; // an unclosed quote runs to the end of the line
const COMMENT = /^#[^\n]*/;
const SPACES = /^[^\S\n]+/;
const OPERATOR = /^(?:\|\||&&|\||;|>>|>|<|&)/;
const WORD = /^[^\s"'|&;<>]+/;
const NUMBER = /^\d+(?:\.\d+)*$/; // 22, 1.5, 192.168.1.10
const STARTS_COMMAND = new Set(["|", "||", "&&", ";"]);

export function tokenize(code, language) {
  const shell = language === "shell";
  const tokens = [];
  const push = (type, text) => {
    const last = tokens.at(-1);
    if (last && last.type === type && type === "plain") last.text += text;
    else tokens.push({ type, text });
  };

  let i = 0;
  let atCommand = true; // the next word starts a command (line start, after |, &&, ;, or sudo)
  let afterFlag = false; // the previous word was a flag
  while (i < code.length) {
    const rest = code.slice(i);
    const wordStart = i === 0 || /\s/.test(code[i - 1]);
    let m;
    if (shell && wordStart && (m = COMMENT.exec(rest))) {
      push("comment", m[0]);
    } else if ((m = STRING.exec(rest))) {
      push("string", m[0]);
      atCommand = false;
      afterFlag = false;
    } else if (rest[0] === "\n") {
      m = ["\n"];
      push("plain", "\n");
      atCommand = true;
      afterFlag = false;
    } else if ((m = SPACES.exec(rest))) {
      push("plain", m[0]);
    } else if ((m = OPERATOR.exec(rest))) {
      push("plain", m[0]);
      atCommand = STARTS_COMMAND.has(m[0]);
      afterFlag = false;
    } else if (!shell) {
      // Outside shell, numbers can touch punctuation, as in f(10); x1 stays plain.
      const number = /[\w.$]/.test(code[i - 1] ?? "") ? null : /^\d+(?:\.\d+)*/.exec(rest);
      m = number ?? /^[A-Za-z_$][\w$]*/.exec(rest) ?? [rest[0]];
      push(number ? "number" : "plain", m[0]);
    } else {
      m = WORD.exec(rest) ?? [rest[0]];
      const word = m[0];
      if (atCommand) {
        push("command", word);
        atCommand = word === "sudo";
        afterFlag = false;
      } else if (word.startsWith("-")) {
        push("flag", word);
        afterFlag = true;
      } else {
        push(NUMBER.test(word) ? "number" : afterFlag ? "value" : "plain", word);
        afterFlag = false;
      }
    }
    i += m[0].length;
  }
  return tokens;
}
