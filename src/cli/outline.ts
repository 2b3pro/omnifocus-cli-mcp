import { BatchCreateTaskItem } from "../types/omnifocus.js";

export interface OutlineItem extends BatchCreateTaskItem {
  level: number;
  line: number;
}

export function parseOutline(input: string): OutlineItem[] {
  const lines = input.split("\n");
  const result: OutlineItem[] = [];
  const stack: OutlineItem[] = [];

  let indentChar: string | null = null;
  let indentSize = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine.trim() || rawLine.trim().startsWith("#")) {
      continue;
    }

    const match = rawLine.match(/^(\s*)([-*])\s+(.+)$/);
    if (!match) {
      throw new Error(`Invalid line at ${i + 1}: ${rawLine}`);
    }

    const [, indent, , content] = match;
    
    // Detect indent style from first indented line
    if (indent.length > 0 && indentChar === null) {
      indentChar = indent[0];
      indentSize = indent.length;
    }

    const currentLevel = indent.length === 0 ? 0 : indent.length / indentSize;
    if (indent.length > 0 && indent.length % indentSize !== 0) {
      throw new Error(`Inconsistent indentation at line ${i + 1}`);
    }

    const { name, tags, due, defer } = parseContent(content);

    const item: OutlineItem = {
      name,
      tags,
      dueDate: due,
      deferDate: defer,
      level: currentLevel,
      line: i + 1,
      children: [],
    };

    if (currentLevel === 0) {
      result.push(item);
      stack[0] = item;
    } else {
      if (!stack[currentLevel - 1]) {
        throw new Error(`Indentation jump at line ${i + 1}`);
      }
      stack[currentLevel - 1].children!.push(item);
      stack[currentLevel] = item;
    }
  }

  return result;
}

function parseContent(content: string) {
  // Simple parser for "Name #tag1 #tag2 due:date defer:date"
  let name = content;
  const tags: string[] = [];
  let due: string | undefined;
  let defer: string | undefined;

  const tagMatches = name.matchAll(/ #([A-Za-z0-9_-]+)/g);
  for (const m of tagMatches) {
    tags.push(m[1]);
  }
  name = name.replace(/ #[A-Za-z0-9_-]+/g, "").trim();

  const dueMatch = name.match(/ due:(\S+)/);
  if (dueMatch) {
    due = dueMatch[1];
    name = name.replace(/ due:\S+/, "").trim();
  }

  const deferMatch = name.match(/ defer:(\S+)/);
  if (deferMatch) {
    defer = deferMatch[1];
    name = name.replace(/ defer:\S+/, "").trim();
  }

  return { name, tags, due, defer };
}
