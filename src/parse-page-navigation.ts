import type { PageNavigation, PageNavigationOptions } from './types';
import {
  findBestMatch,
  getTableOfContentsData,
} from './parse-table-of-contents';
import path from 'path';

/**
 * Figure out the current url path relative from the root pages directory to the file path.
 * Will create a url path always starting with `/`. Any index file name, such as `index.md` will
 * be dropped. For example, `/info/about/index.md` will become `/info/about`. By passing the
 * `tocFilePath` table of contents file path option, it will use the table of contents to figure
 * out the previous page, next page, and parent page.
 * @param rootPagesDir The directory path representing the root of the website.
 * @param pageFilePath The absolute path of the file, which should be a descendant of the `rootPagesDir`.
 */
export async function getPageNavigation(
  rootPagesDir: string,
  pageFilePath: string,
  opts?: PageNavigationOptions,
) {
  opts = opts || {};

  const results: PageNavigation = {
    current: {
      url: getUrl(rootPagesDir, pageFilePath, opts),
      title: null,
    },
    parent: null,
    previous: null,
    next: null,
  };

  if (opts.tableOfContents) {
    const r = getTableOfContentsData(opts.tableOfContents);

    let currentIndex = -1;
    for (let i = r.length - 1; i >= 0; i--) {
      if (r[i].file === pageFilePath) {
        currentIndex = i;
        break;
      }
    }

    if (currentIndex > -1) {
      const current = r[currentIndex];
      results.current!.title = current.title;

      const prevTocs = r.slice(0, currentIndex).reverse();
      const prev = findBestMatch(current.file, prevTocs);
      if (prev) {
        results.previous = {
          url: getUrl(rootPagesDir, prev.file, opts),
          title: prev.title,
        };
      }

      const nextTocs = r.slice(currentIndex + 1);
      const next = findBestMatch(current.file, nextTocs);
      if (next) {
        results.next = {
          url: getUrl(rootPagesDir, next.file, opts),
          title: next.title,
        };
      }

      const parent = findBestMatch(
        current.file,
        current.ancestorFiles?.reverse(),
      );
      if (parent) {
        results.parent = {
          url: getUrl(rootPagesDir, parent.file, opts),
          title: parent.title,
        };
      }
    }
  }

  return results;
}

export function getUrl(
  rootPagesDir: string,
  pageFilePath: string,
  opts: PageNavigationOptions,
) {
  if (typeof pageFilePath !== 'string' || pageFilePath === '') {
    return null;
  }

  rootPagesDir = path.normalize(rootPagesDir);
  pageFilePath = path.normalize(pageFilePath);

  if (!pageFilePath.startsWith(rootPagesDir)) {
    throw new Error(
      `page file "${pageFilePath}" must be a descendant of the root directory "${rootPagesDir}"`,
    );
  }

  let url = path.relative(rootPagesDir, pageFilePath);

  const basename = path.basename(url).toLowerCase();
  const ext = path.extname(basename);

  if (ext !== '.md') {
    throw new Error(`file must have a ".md" extension`);
  }

  if (basename === 'index.md') {
    url = path.dirname(url);
  }

  if (url === '.') {
    url = '/';
  } else {
    if (url.endsWith('.md')) {
      url = url.substr(0, url.length - 3);
    }
    if (!url.startsWith('/')) {
      url = '/' + url;
    }
    if (opts.trailingSlash && !url.endsWith('/')) {
      url += '/';
    }
  }

  return url;
}

// async function getTitle
