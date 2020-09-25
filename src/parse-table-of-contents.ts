import type {
  TableOfContentsNode,
  ParseTableOfContentsOptions,
  TableOfContents,
} from './types';
import { createFragment } from '@stencil/core/mock-doc';
import {
  getMarkedOptions,
  parseMarkdownRenderer,
} from './parse-markdown-render';
import { getUrl } from './parse-page-navigation';
import { readFile } from './parse-utils';
import path from 'path';

const tocCache = new Map<string, TableOfContents>();

/**
 * Parses a markdown file with a list of markdown files and their title. This table of contents can be
 * used to create a site menu, such as a webpage's left menu, and it is used to figure out the
 * "next" and "previous" page links.
 * @param tocMarkdownFilePath The absolute file path of the table of contents markdown file to parse.
 * Each link's path to its markdown file will be relative to the table of contents file path.
 * @param rootPagesDir The directory path representing the root of the website. Each link's url will
 * be relative to the root pages directory.
 */
export async function parseTableOfContents(
  tocMarkdownFilePath: string,
  rootPagesDir: string,
  opts?: ParseTableOfContentsOptions,
) {
  opts = opts || {};
  const content = await readFile(tocMarkdownFilePath, 'utf8');

  const cacheKey = content + tocMarkdownFilePath + rootPagesDir;
  const cachedToc = tocCache.get(cacheKey);
  if (cachedToc) {
    if (tocCache.size > 500) {
      // not sure how this would happen, but just in case
      tocCache.clear();
    }
    return cachedToc;
  }

  const html = await parseMarkdownRenderer(content, getMarkedOptions({}));

  const frag = createFragment(html);
  const ulElm = frag.querySelector('ul');

  const tocs: TableOfContents = {
    tocFilePath: tocMarkdownFilePath,
    tocDirPath: path.dirname(tocMarkdownFilePath),
    rootPagesDir,
    root: [],
  };
  parseTableOfContentsItem(
    0,
    tocs.tocDirPath,
    rootPagesDir,
    ulElm,
    false,
    tocs.root,
    opts,
  );

  tocCache.set(cacheKey, tocs);

  return tocs;
}

function parseTableOfContentsItem(
  depth: number,
  tocDirPath: string,
  rootPagesDir: string,
  ulElm: HTMLElement | null,
  hasParent: boolean,
  tocs: TableOfContentsNode[],
  opts: ParseTableOfContentsOptions,
) {
  if (ulElm) {
    const liElms = Array.from(ulElm.children).filter(n => n.nodeName === 'LI');

    for (const liElm of liElms) {
      const tocNode: TableOfContentsNode = { depth };
      const childNodes = Array.from(liElm.childNodes);

      let addNode = false;
      for (const n of childNodes) {
        if (n.nodeName === '#text') {
          const text = (n as Text).textContent;
          if (typeof text === 'string' && text.trim() !== '') {
            tocNode.text = text;
            addNode = true;
          }
        } else if (typeof (n as HTMLElement).tagName === 'string') {
          const elm = n as HTMLElement;
          if (elm.tagName === 'A') {
            const text = elm.textContent;
            if (typeof text === 'string' && text.trim() !== '') {
              tocNode.text = text;
            }

            const hrefValue = elm.getAttribute('href');
            if (typeof hrefValue === 'string' && hrefValue.trim().length > 0) {
              const href = hrefValue.split('#')[0].split('?')[0];
              tocNode.url = href;

              if (!href.toLowerCase().startsWith('http')) {
                const markdownFilePath = path.join(tocDirPath, href);
                const ext = path.extname(markdownFilePath).toLowerCase();

                if (path.isAbsolute(markdownFilePath) && ext === '.md') {
                  const url = getUrl(rootPagesDir, markdownFilePath, opts);
                  if (url) {
                    tocNode.url = url;
                  }
                  tocNode.file = path.relative(tocDirPath, markdownFilePath);
                }
              }
            }
            addNode = true;
          } else if (elm.tagName === 'UL') {
            const tocsChildren: TableOfContentsNode[] = [];
            parseTableOfContentsItem(
              depth + 1,
              tocDirPath,
              rootPagesDir,
              n as any,
              true,
              tocsChildren,
              opts,
            );
            if (tocsChildren.length > 0) {
              addNode = true;
              tocNode.children = tocsChildren;
            }
          }
        }
      }

      if (addNode) {
        if (hasParent) {
          tocNode.hasParent = true;
        }
        tocs.push(tocNode);
      }
    }
  }
}

export function getTableOfContentsData(toc: TableOfContents) {
  const r: WalkResult[] = [];
  findPath([], toc.root, toc.tocDirPath, r);
  return r;
}

function findPath(
  ancestorFiles: WalkResult[],
  toc: TableOfContentsNode[],
  tocDir: string,
  r: WalkResult[],
) {
  if (Array.isArray(toc)) {
    for (const t of toc) {
      let filePath = t.file ? path.join(tocDir, t.file) : '';

      r.push({
        file: filePath,
        title: t.text!,
        ancestorFiles,
        depth: t.depth,
      });

      const af = [
        ...ancestorFiles.map(a => {
          return {
            file: a.file,
            title: a.title,
            depth: a.depth,
          };
        }),
        {
          file: filePath,
          title: t.text!,
          depth: t.depth,
        },
      ];

      findPath(af, t.children!, tocDir, r);
    }
  }
}

export function findBestMatch(
  currentFile: string,
  r: WalkResult[] | undefined,
) {
  if (Array.isArray(r)) {
    let a = r.filter(t => t.file && t.file !== currentFile && t.title);
    if (a.length > 0) {
      const f = a[0].file;
      a = a.filter(b => b.file === f);
      return a[a.length - 1];
    }
    const b = r.find(t => t.file && t.file !== currentFile);

    if (b) {
      return b;
    }
    return r[r.length - 1];
  }
  return null;
}

interface WalkResult {
  title: string;
  file: string;
  depth: number;
  ancestorFiles?: WalkResult[];
}
