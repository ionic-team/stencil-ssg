import type {
  ParseMarkdownOptions,
  ParseMarkdownContentOptions,
  MarkdownResults,
} from './types';
import frontMatter, { FrontMatterOptions } from 'front-matter';
import { parseHtmlContent } from './parse-html';
import {
  parseMarkdownRenderer,
  getMarkedOptions,
} from './parse-markdown-render';
import { readFile } from './parse-utils';
import { slugify } from './slugify';
import path from 'path';

/**
 * Inputs markdown file path and reads the file and parses the yaml front matter data into
 * `attributes`, and the body of the markdown content is parsed into `html`. The
 * `html` is also parsed into a serializable `ast` format which can be used later
 * on the client-side togenerate JSX. Providing a `cache` argument will speed up builds.
 * @param id The mardown file path or id to be resolved. See the `resolveMarkdownPath` option for more info.
 * The file's content should include yaml front matter metadata and markdown in the body..
 * @param opts Yaml, markdown, html and caching parsing options.
 */
export async function parseMarkdown(id: string, opts?: ParseMarkdownOptions) {
  opts = opts || {};

  let content: string;
  let filePath: string;
  if (typeof opts.resolveMarkdownPath === 'function') {
    // user provided a custom markdown path resolver
    filePath = await opts.resolveMarkdownPath(id);
    content = await readFile(filePath, 'utf8');
  } else {
    const readResults = await readMarkdownContent(id);
    content = readResults.content;
    filePath = readResults.filePath;
  }

  const results: MarkdownResults = await parseMarkdownContent(content, opts);

  if (typeof results.slug !== 'string') {
    let basename = path.basename(filePath);
    if (basename.toLowerCase() === 'index.md') {
      basename = path.basename(path.dirname(filePath));
    }
    results.slug = slugify(basename!);
  }
  results.filePath = filePath;

  return results;
}

async function readMarkdownContent(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  const results = {
    content: '',
    filePath,
  };

  if (ext === '.markdown') {
    throw new Error(
      `@stencil/markdown will only use ".md" markdown extensions: ${filePath}`,
    );
  }

  if (ext === '.md') {
    // always do a direct read if it ends with .md or .markdown
    // don't try resolving if that doesn't work
    results.content = await readFile(filePath, 'utf8');
  } else {
    // with file path of `pages/my-file`, will attempt:
    // 1. `pages/my-file.md`
    // 2. `pages/my-file/index.md`
    const mdFilePath = filePath + '.md';
    const indexMdFilePath = path.join(filePath, 'index.md');
    try {
      results.content = await readFile(mdFilePath, 'utf8');
      results.filePath = mdFilePath;
    } catch {
      try {
        results.content = await readFile(indexMdFilePath, 'utf8');
        results.filePath = indexMdFilePath;
      } catch {
        throw new Error(
          `Unable to read: "${filePath}". Attempted: "${mdFilePath}", "${indexMdFilePath}"`,
        );
      }
    }
  }

  return results;
}

/**
 * Inputs markdown content as a string and parses the yaml front matter data into
 * `attributes`, and the body of the markdown content is parsed into `html`. The
 * `html` is also parsed into a serializable `ast` format which can be used later
 * on the client-side togenerate JSX. Providing a `cache` argument will speed up builds.
 * @param content The mardown content, to include yaml front matter metadata.
 * @param opts Yaml, markdown, html and caching parsing options.
 */
export async function parseMarkdownContent<T = { [key: string]: string }>(
  content: string,
  opts?: ParseMarkdownContentOptions,
) {
  if (typeof content !== 'string') {
    throw new Error(`content must be a string`);
  }
  content = content.trim();

  opts = opts || {};
  const fsOpts = getFrontMatterOptions(opts);
  const markedOpts = getMarkedOptions(opts);

  const fmResults = frontMatter(content, fsOpts);
  const html = await parseMarkdownRenderer(fmResults.body, markedOpts);

  const htmlResults = await parseHtmlContent(html);

  const attributes = { ...(fmResults.attributes as any) };

  const results: MarkdownResults<T> = {
    attributes,
    html,
    ast: htmlResults.ast,
    anchors: htmlResults.anchors,
    headings: htmlResults.headings,
    imgs: htmlResults.imgs,
    tagNames: htmlResults.tagNames,
  };

  if (typeof attributes.title === 'string') {
    results.title = attributes.title;
  }
  if (typeof attributes.description === 'string') {
    results.description = attributes.description;
  }
  if (typeof attributes.slug === 'string') {
    results.slug = attributes.slug;
  }

  return results;
}

function getFrontMatterOptions(opts: ParseMarkdownOptions) {
  const fsOpts: FrontMatterOptions = {
    allowUnsafe: opts.allowUnsafe !== false,
  };
  return fsOpts;
}
