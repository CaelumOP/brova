// Code tokenizer. First version: the whole code is one plain token, so pages can
// render code blocks now. Phase 5 adds the coloring rules (brova.md, item 29).

export function tokenize(code, language) {
  return [{ type: "plain", text: code }];
}
