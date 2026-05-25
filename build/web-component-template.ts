import fs from "node:fs";

export function webComponentTemplate() {
  function findMatchingBrace(str: string) {
    let depth = 1;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === "{") depth++;
      else if (str[i] === "}") depth--;
      if (depth === 0) return { content: str.substring(0, i), length: i };
    }
    return { content: "", length: -1 };
  }

  return {
    name: "web-component-template",
    enforce: "pre" as const,
    load(id: string) {
      if (!id.split("?")[0].endsWith(".html")) return;
      if (id.includes("index.html")) return;

      let filePath = id.split("?")[0];
      if (filePath.startsWith("/") && filePath[2] === ":") {
        filePath = filePath.slice(1);
      }

      if (!fs.existsSync(filePath)) {
        console.log(`[Template Plugin] File not found: ${filePath}`);
        return;
      }

      const content = fs.readFileSync(filePath, "utf-8");
      let result = content;

      const forRegex = /@for\s*\(\s*(\w+)\s+of\s+([a-zA-Z0-9_.]+)\s*\)\s*\{/g;
      let match;
      while ((match = forRegex.exec(result)) !== null) {
        const startIndex = match.index;
        const contentStart = startIndex + match[0].length;
        const { content: forContent, length } = findMatchingBrace(result.substring(contentStart));
        if (length !== -1) {
          const replacement = `<for-loop data-list="${match[2]}" data-item="${match[1]}"><template>${forContent}</template></for-loop>`;
          result = result.substring(0, startIndex) + replacement + result.substring(contentStart + length + 1);
          forRegex.lastIndex = 0;
        }
      }

      const ifRegex = /@if\s*\(\s*([\s\S]+?)\s*\)\s*\{/g;
      while ((match = ifRegex.exec(result)) !== null) {
        const startIndex = match.index;
        const condition = match[1];
        const contentStart = startIndex + match[0].length;
        const { content: ifContent, length: ifLength } = findMatchingBrace(result.substring(contentStart));

        if (ifLength !== -1) {
          let totalLength = match[0].length + ifLength + 1;
          let elseContent = "";
          const rest = result.substring(startIndex + totalLength);
          const elseMatch = rest.match(/^\s*@else\s*\{/);

          if (elseMatch) {
            const elseStart = elseMatch[0].length;
            const { content: eContent, length: eLength } = findMatchingBrace(rest.substring(elseStart));
            if (eLength !== -1) {
              elseContent = eContent;
              totalLength += elseStart + eLength + 1;
            }
          }

          const replacement = `<if-block data-cond="${condition.replace(/"/g, '&quot;').trim()}"><template data-type="if">${ifContent}</template>${elseContent ? `<template data-type="else">${elseContent}</template>` : ""}</if-block>`;
          result = result.substring(0, startIndex) + replacement + result.substring(startIndex + totalLength);
          ifRegex.lastIndex = 0;
        }
      }

      console.log(`[Template Plugin] Transformed: ${filePath}`);
      return `export default ${JSON.stringify(result)};`;
    },
  };
}
