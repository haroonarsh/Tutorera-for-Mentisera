import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root, Paragraph, Heading, PhrasingContent, Text } from "mdast";
import type { Root as HastRoot, Element as HastElement, Text as HastText } from "hast";

// TutorEra's blog body content uses a non-standard convention: a section
// heading is written as a standalone paragraph containing nothing but a
// single bold run (e.g. "**Check what has actually been verified**"),
// rather than a "#"/"##" markdown header. This is NOT something
// remark/rehype support out of the box - it needs this small custom plugin.
//
// The detection is deliberately narrow: a paragraph only becomes a heading
// when its ENTIRE content is one `strong` node containing only plain text.
// A paragraph that merely starts or ends with inline **bold** (used inside
// a normal sentence) has other sibling nodes/text and is left untouched -
// this is what distinguishes a heading line from ordinary inline emphasis.
//
// Headings whose text ends in "?" become h3 (FAQ-style sub-questions);
// everything else becomes h2 (top-level sections).
function isBoldOnlyParagraph(node: Paragraph): string | null {
  if (node.children.length !== 1) return null;
  const only = node.children[0];
  if (only.type !== "strong") return null;
  if (!only.children.every((child): child is Text => child.type === "text")) return null;
  return only.children.map((child) => child.value).join("");
}

function remarkBoldHeadings() {
  return (tree: Root) => {
    tree.children = tree.children.map((node): Root["children"][number] => {
      if (node.type !== "paragraph") return node;
      const text = isBoldOnlyParagraph(node);
      if (text === null) return node;
      const heading: Heading = {
        type: "heading",
        depth: text.trim().endsWith("?") ? 3 : 2,
        children: [{ type: "text", value: text } as PhrasingContent],
      };
      return heading;
    });
  };
}

// A separate processor that stops right after rehype-slug (no stringify),
// so extractHeadings() below reads the exact same hast tree - and therefore
// the exact same generated `id` attributes - that renderBlogContent()
// eventually serializes to HTML. Running two independently-configured
// pipelines risks the ids silently drifting apart (e.g. a slug library
// version bump), which would break every TOC anchor link at once.
const headingProcessor = unified().use(remarkParse).use(remarkBoldHeadings).use(remarkRehype).use(rehypeSlug);
const processor = headingProcessor().use(rehypeStringify);

export function renderBlogContent(markdown: string): string {
  return String(processor.processSync(markdown));
}

export interface BlogHeading {
  id: string;
  text: string;
  depth: 2 | 3;
}

function textContent(node: HastElement): string {
  let text = "";
  visit(node, "text", (textNode: HastText) => { text += textNode.value; });
  return text;
}

// Powers the post page's table of contents - only top-level sections (h2)
// are listed, since h3 is reserved for FAQ sub-questions (already surfaced
// in their own "Frequently asked questions" block) rather than TOC-worthy
// structural sections.
export function extractHeadings(markdown: string): BlogHeading[] {
  const hast = headingProcessor().runSync(headingProcessor().parse(markdown)) as HastRoot;
  const headings: BlogHeading[] = [];
  visit(hast, "element", (node: HastElement) => {
    if (node.tagName !== "h2") return;
    const id = typeof node.properties?.id === "string" ? node.properties.id : "";
    const text = textContent(node);
    if (id && text) headings.push({ id, text, depth: 2 });
  });
  return headings;
}

export interface FaqPair {
  question: string;
  answer: string;
}

// Scans for the same bold-only-heading-ending-in-"?" convention, paired with
// the plain paragraph immediately following it, to auto-generate FAQPage
// JSON-LD without requiring a specific "Frequently asked questions" heading
// to gate it - any such Q&A-shaped pair in the document qualifies.
export function extractFaqPairs(markdown: string): FaqPair[] {
  const tree = unified().use(remarkParse).parse(markdown) as Root;
  const pairs: FaqPair[] = [];

  for (let i = 0; i < tree.children.length - 1; i++) {
    const node = tree.children[i];
    if (node.type !== "paragraph") continue;
    const text = isBoldOnlyParagraph(node);
    if (text === null || !text.trim().endsWith("?")) continue;

    const next = tree.children[i + 1];
    if (next.type !== "paragraph" || isBoldOnlyParagraph(next) !== null) continue;
    const answer = next.children
      .filter((child): child is Text => child.type === "text")
      .map((child) => child.value)
      .join("")
      .trim();
    if (!answer) continue;

    pairs.push({ question: text.trim(), answer });
  }

  return pairs;
}

const WORDS_PER_MINUTE = 200;
export function estimateReadingTime(markdown: string): string {
  const wordCount = markdown.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE))} min read`;
}
