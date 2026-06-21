import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  PDFDocument,
  StandardFonts,
  rgb
} = require('/Users/jeffrytorres/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pdf-lib/cjs/index.js');

const cwd = process.cwd();
const sourcePath = path.join(cwd, 'june7-lesson-outline.md');
const outputPath = path.join(cwd, 'june7-lesson-outline.pdf');

const markdown = await fs.readFile(sourcePath, 'utf8');
const pdf = await PDFDocument.create();
const regular = await pdf.embedFont(StandardFonts.Helvetica);
const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

const pageWidth = 612;
const pageHeight = 792;
const margin = 48;
const contentWidth = pageWidth - margin * 2;
const colors = {
  title: rgb(0.31, 0.28, 0.9),
  heading: rgb(0.2, 0.25, 0.35),
  accent: rgb(0.5, 0.55, 0.95),
  text: rgb(0.12, 0.16, 0.22)
};

let page;
let y;
let pageNumber = 0;

function addPage() {
  page = pdf.addPage([pageWidth, pageHeight]);
  pageNumber += 1;
  y = pageHeight - margin;
  if (pageNumber > 1) {
    drawFooter();
  }
}

function drawFooter() {
  page.drawText(`June 7 Lesson Outline | ${pageNumber}`, {
    x: margin,
    y: 26,
    size: 8,
    font: regular,
    color: rgb(0.45, 0.48, 0.55)
  });
}

function ensureSpace(height) {
  if (y - height < margin) {
    addPage();
  }
}

function stripMarkdown(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}

function wrapText(text, font, size, maxWidth) {
  const words = stripMarkdown(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(testLine, size) <= maxWidth) {
      line = testLine;
      continue;
    }

    if (line) {
      lines.push(line);
      line = word;
    } else {
      lines.push(word);
    }
  }

  if (line) {
    lines.push(line);
  }

  return lines;
}

function drawWrapped(text, options = {}) {
  const {
    font = regular,
    size = 10.5,
    color = colors.text,
    x = margin,
    width = contentWidth,
    lineHeight = size * 1.32,
    before = 0,
    after = 5,
    bullet = false
  } = options;

  const bulletOffset = bullet ? 14 : 0;
  const lines = wrapText(text, font, size, width - bulletOffset);
  ensureSpace(before + lines.length * lineHeight + after);
  y -= before;

  lines.forEach((line, index) => {
    if (bullet && index === 0) {
      page.drawText('-', {
        x,
        y,
        size,
        font,
        color
      });
    }
    page.drawText(line, {
      x: x + bulletOffset,
      y,
      size,
      font,
      color
    });
    y -= lineHeight;
  });

  y -= after;
}

function drawHeading(text, level) {
  const clean = stripMarkdown(text);

  if (level === 1) {
    const size = 22;
    const lines = wrapText(clean, bold, size, contentWidth);
    ensureSpace(lines.length * 28 + 12);
    for (const line of lines) {
      const textWidth = bold.widthOfTextAtSize(line, size);
      page.drawText(line, {
        x: (pageWidth - textWidth) / 2,
        y,
        size,
        font: bold,
        color: colors.title
      });
      y -= 28;
    }
    y -= 8;
    return;
  }

  const size = level === 2 ? 15 : 12;
  const font = bold;
  const before = level === 2 ? 14 : 8;
  const after = level === 2 ? 8 : 5;
  const lines = wrapText(clean, font, size, contentWidth);
  ensureSpace(before + lines.length * (size * 1.25) + after + 4);
  y -= before;

  for (const line of lines) {
    page.drawText(line, {
      x: margin,
      y,
      size,
      font,
      color: level === 2 ? colors.heading : colors.title
    });
    y -= size * 1.25;
  }

  if (level === 2) {
    page.drawLine({
      start: { x: margin, y: y + 2 },
      end: { x: pageWidth - margin, y: y + 2 },
      thickness: 0.8,
      color: colors.accent
    });
    y -= 4;
  }

  y -= after;
}

addPage();

for (const rawLine of markdown.split(/\r?\n/)) {
  const line = rawLine.trim();

  if (!line) {
    y -= 3;
    continue;
  }

  if (line.startsWith('# ')) {
    drawHeading(line.slice(2), 1);
  } else if (line.startsWith('## ')) {
    drawHeading(line.slice(3), 2);
  } else if (line.startsWith('### ')) {
    drawHeading(line.slice(4), 3);
  } else if (line.startsWith('- ')) {
    drawWrapped(line.slice(2), { bullet: true, x: margin + 8, width: contentWidth - 8, after: 2 });
  } else {
    const isLabel = /^\*\*[^*]+:\*\*/.test(line) || /^\*\*[^*]+\*\*$/.test(line);
    drawWrapped(line, {
      font: isLabel ? bold : regular,
      size: isLabel ? 10.8 : 10.5,
      after: isLabel ? 4 : 5
    });
  }
}

drawFooter();
const bytes = await pdf.save();
await fs.writeFile(outputPath, bytes);
console.log(`Created ${outputPath} (${bytes.length} bytes)`);
