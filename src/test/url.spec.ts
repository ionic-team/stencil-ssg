import { getPageNavigation, parseTableOfContents, PageNavigationOptions } from '../parse';
import path from 'path';
import os from 'os';

describe(`getPagination`, () => {
  const rootPagesDir = path.join(__dirname, 'fixtures', 'pages');
  const tocFilePath = path.join(rootPagesDir, 'readme.md');
  let opts: PageNavigationOptions;

  beforeEach(async () => {
    opts = {
      tableOfContents: await parseTableOfContents(tocFilePath, rootPagesDir),
    };
  });

  it(`toc last`, async () => {
    const pageFilePath = path.join(rootPagesDir, 'contact.md');
    const r = await getPageNavigation(rootPagesDir, pageFilePath, opts);
    expect(r.current.url).toBe('/contact');
    expect(r.current.title).toBe('Contact');
    expect(r.parent).toBe(null);
    expect(r.previous.url).toBe('/guides/ide');
    expect(r.previous.title).toBe('IDE');
    expect(r.next).toBe(null);
  });

  it(`toc 2nd level w/ non-link parent`, async () => {
    const pageFilePath = path.join(rootPagesDir, 'guides', 'ide.md');
    const r = await getPageNavigation(rootPagesDir, pageFilePath, opts);
    expect(r.current.url).toBe('/guides/ide');
    expect(r.current.title).toBe('IDE');
    expect(r.parent.url).toBe(null);
    expect(r.parent.title).toBe('Guides');
    expect(r.previous.url).toBe('/guides/workflow');
    expect(r.previous.title).toBe('Development Workflow');
    expect(r.next.url).toBe('/contact');
    expect(r.next.title).toBe('Contact');
  });

  it(`toc 2nd level w/ same url as top level`, async () => {
    const pageFilePath = path.join(rootPagesDir, 'docs', 'index.md');
    const r = await getPageNavigation(rootPagesDir, pageFilePath, opts);
    expect(r.current.url).toBe('/docs');
    expect(r.current.title).toBe('Getting Started');
    expect(r.parent.url).toBe('/docs');
    expect(r.parent.title).toBe('Documentation');
    expect(r.previous.url).toBe('/');
    expect(r.previous.title).toBe('Introduction');
    expect(r.next.url).toBe('/docs/installation');
    expect(r.next.title).toBe('Installation');
  });

  it(`toc root, third link, skip non-next toc link`, async () => {
    const pageFilePath = path.join(rootPagesDir, 'about.md');
    const r = await getPageNavigation(rootPagesDir, pageFilePath, opts);
    expect(r.current.url).toBe('/about');
    expect(r.current.title).toBe('About');
    expect(r.parent).toBe(null);
    expect(r.previous.url).toBe('/docs/installation');
    expect(r.previous.title).toBe('Installation');
    expect(r.next.url).toBe('/guides/workflow');
    expect(r.next.title).toBe('Development Workflow');
  });

  it(`toc root`, async () => {
    const pageFilePath = path.join(rootPagesDir, 'index.md');
    const r = await getPageNavigation(rootPagesDir, pageFilePath, opts);
    expect(r.current.url).toBe('/');
    expect(r.current.title).toBe('Introduction');
    expect(r.current.title).toBe('Introduction');
    expect(r.parent).toBe(null);
    expect(r.previous).toBe(null);
    expect(r.next.url).toBe('/docs');
    expect(r.next.title).toBe('Getting Started');
  });

  it(`directory w/ index.md trailing slash`, async () => {
    opts.trailingSlash = true;
    const pageFilePath = path.join(rootPagesDir, 'docs', 'index.md');
    const r = await getPageNavigation(rootPagesDir, pageFilePath, opts);
    expect(r.current.url).toBe('/docs/');
  });

  it(`directory w/ index.md`, async () => {
    const pageFilePath = path.join(rootPagesDir, 'docs', 'index.md');
    const r = await getPageNavigation(rootPagesDir, pageFilePath, opts);
    expect(r.current.url).toBe('/docs');
  });

  it(`directory w/ filename.md`, async () => {
    const pageFilePath = path.join(rootPagesDir, 'docs', 'getting-started.md');
    const r = await getPageNavigation(rootPagesDir, pageFilePath, opts);
    expect(r.current.url).toBe('/docs/getting-started');
  });

  it(`root w/ filename.md`, async () => {
    const pageFilePath = path.join(rootPagesDir, 'about-us.md');
    const r = await getPageNavigation(rootPagesDir, pageFilePath, opts);
    expect(r.current.url).toBe('/about-us');
  });

  it(`root index w/ trailing slash`, async () => {
    opts.trailingSlash = true;
    const pageFilePath = path.join(rootPagesDir, 'index.md');
    const r = await getPageNavigation(rootPagesDir, pageFilePath, opts);
    expect(r.current.url).toBe('/');
  });

  it(`root index`, async () => {
    const pageFilePath = path.join(rootPagesDir, 'index.md');
    const r = await getPageNavigation(rootPagesDir, pageFilePath, opts);
    expect(r.current.url).toBe('/');
  });

  it(`must be descendant`, async () => {
    try {
      const r = await getPageNavigation(rootPagesDir, os.tmpdir(), opts);
    } catch (e) {
      return;
    }
    throw new Error('must be descendant');
  });

  it(`must be a markdown file`, async () => {
    try {
      const pageFilePath = path.join(rootPagesDir, 'index.html');
      const r = await getPageNavigation(rootPagesDir, pageFilePath, opts);
    } catch (e) {
      return;
    }
    throw new Error('must be a markdown file');
  });
});
