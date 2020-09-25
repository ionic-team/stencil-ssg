import { parseMarkdownContent } from '../parse';
import type { ParseMarkdownOptions } from '../types';

describe(`parseMarkdownContent`, () => {
  let opts: ParseMarkdownOptions;

  beforeEach(() => {
    opts = {};
  });

  it(`before serialize`, async () => {
    opts.beforeSerialize = frag => {
      const h1 = frag.querySelector('h1');
      h1.textContent = `Updated Heading`;
      const div = frag.ownerDocument.createElement('div');
      div.innerHTML = `<img src="/logo.png">`;
      frag.appendChild(div);
    };
    const r = await parseMarkdownContent(
      md(`
        # Heading

        Paragraph
      `),
      opts,
    );

    expect(r.headings[0].level).toBe(1);
    expect(r.headings[0].text).toBe(`Updated Heading`);
    expect(r.headings[0].id).toBe(`updated-heading`);
    expect(r.html).toBe(
      `<h1 id="updated-heading">Updated Heading</h1><p class="paragraph-intro">Paragraph</p><div><img src="/logo.png"></div>`,
    );
  });

  it(`anchor links`, async () => {
    opts.headingAnchors = true;
    const r = await parseMarkdownContent(md(`# Heading`), opts);

    expect(r.html).toBe(
      `<h1 id="heading"><a href="#heading" class="heading-anchor" aria-hidden="true"></a>Heading</h1>`,
    );
  });

  it(`paragraph intro with no sub headings`, async () => {
    const r = await parseMarkdownContent(
      md(`
        # Heading1

        Paragraph 1

        Paragraph 2
      `),
      opts,
    );

    expect(r.html).toBe(
      `<h1 id="heading1">Heading1</h1><p class="paragraph-intro">Paragraph 1</p> <p>Paragraph 2</p>`,
    );
  });

  it(`paragraph intro with sub headings`, async () => {
    const r = await parseMarkdownContent(
      md(`
        # Heading1

        Paragraph 1

        Paragraph 2

        ## Header2

        Paragraph 3
      `),
      opts,
    );

    expect(r.html).toBe(
      `<h1 id="heading1">Heading1</h1><p class="paragraph-intro">Paragraph 1</p> <p class="paragraph-intro">Paragraph 2</p> <h2 id="header2">Header2</h2><p>Paragraph 3</p>`,
    );
  });

  it(`code block`, async () => {
    const c: string[] = [];
    c.push('```typescript');
    c.push('function mph() {');
    c.push('       return 88;');
    c.push('}');
    c.push('```');
    const r = await parseMarkdownContent(c.join('\n'), opts);
    expect(r.html).toContain('<pre class="language-typescript"><code>');
  });

  it(`images and inlined styles`, async () => {
    const r = await parseMarkdownContent(
      md(`
        <img alt="save the clock tower" src="clock-tower.png" style="max-height: 360px;width:240px" class="marty mcfly" />
      `),
      opts,
    );
    expect(r.imgs).toHaveLength(1);
    expect(r.imgs[0].text).toBe(`save the clock tower`);
    expect(r.imgs[0].src).toBe(`clock-tower.png`);

    const imgAst = r.ast[0];
    expect(imgAst).toHaveLength(2);
    expect(imgAst[0]).toBe('img');
    expect(imgAst[1].alt).toBe('save the clock tower');
    expect(imgAst[1].src).toBe('clock-tower.png');
    expect(imgAst[1].style).toEqual({ 'max-height': '360px', width: '240px' });
    expect(imgAst[1].class).toBe('marty mcfly');
  });

  it(`anchors`, async () => {
    const r = await parseMarkdownContent(
      md(`
        # Hill Valley

        Save the [clock](/clock) [tower](/tower)!
      `),
      opts,
    );
    expect(r.anchors).toHaveLength(2);
    expect(r.anchors[0].text).toBe(`clock`);
    expect(r.anchors[0].href).toBe(`/clock`);
    expect(r.anchors[1].text).toBe(`tower`);
    expect(r.anchors[1].href).toBe(`/tower`);
  });

  it(`headings`, async () => {
    const r = await parseMarkdownContent(
      md(`
        # Heading1

        Contenta

        ## Heading2a

        Contentb

        ### Heading3a

        Contentc

        ## Heading 2b [link](/link)
      `),
      opts,
    );
    expect(r.headings).toHaveLength(4);
    expect(r.headings[0].text).toBe(`Heading1`);
    expect(r.headings[0].id).toBe(`heading1`);
    expect(r.headings[0].level).toBe(1);
    expect(r.headings[1].text).toBe(`Heading2a`);
    expect(r.headings[1].id).toBe(`heading2a`);
    expect(r.headings[1].level).toBe(2);
    expect(r.headings[2].text).toBe(`Heading3a`);
    expect(r.headings[2].id).toBe(`heading3a`);
    expect(r.headings[2].level).toBe(3);
    expect(r.headings[3].text).toBe(`Heading 2b link`);
    expect(r.headings[3].id).toBe(`heading-2b-link`);
    expect(r.headings[3].level).toBe(2);
  });

  it(`anchors`, async () => {
    const r = await parseMarkdownContent(
      md(`
        # Hill Valley

        Save the ![clock tower](/clock-tower.png)
      `),
      opts,
    );
    expect(r.imgs).toHaveLength(1);
    expect(r.imgs[0].text).toBe(`clock tower`);
    expect(r.imgs[0].src).toBe(`/clock-tower.png`);
  });

  it(`attributes`, async () => {
    const r = await parseMarkdownContent(
      md(`
        ---
        title: StencilJS
        description: Markdown parser
        ---

        # Heading1
      `),
      opts,
    );
    expect(r.attributes.title).toBe(`StencilJS`);
    expect(r.attributes.description).toBe(`Markdown parser`);
  });
});

function md(txt: string) {
  const lines = txt.split('\n');
  return lines
    .map(l => l.trimLeft())
    .join('\n')
    .trim();
}
