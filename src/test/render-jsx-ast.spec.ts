import { parseMarkdownContent } from '../parse';
import { RenderJsxAst } from '../index';
import type { RenderJsxProps, ParseMarkdownOptions } from '../types';

describe(`RenderJsxAst`, () => {
  let opts: ParseMarkdownOptions;

  beforeEach(() => {
    opts = {};
  });

  it(`parse/serialize, elementProps`, async () => {
    const r = await parseMarkdownContent(
      md(`
        Save the [clock](/clock) [tower](/tower)!
      `),
      opts,
    );

    const href = (url: string) => {
      return {
        href: url,
        onClick: () => console.log('clicked href'),
      };
    };

    const props: RenderJsxProps = {
      ast: r.ast,
      elementProps: (tagName, orgProps) => {
        const newProps = { ...orgProps };
        if (tagName === 'p') {
          return {
            ...orgProps,
            class: 'paragraph',
          };
        } else if (tagName === 'a') {
          return {
            ...orgProps,
            ...href(orgProps.href + '?custom'),
          };
        }
        return orgProps;
      },
    };
    const vdom = RenderJsxAst(props);

    const p = vdom[0];
    expect(p.$tag$).toBe('p');
    expect(p.$attrs$.class).toBe('paragraph');
    expect(p.$children$[0].$text$).toBe('Save the ');

    expect(p.$children$[1].$tag$).toBe('a');
    expect(p.$children$[1].$attrs$.href).toBe('/clock?custom');
    expect(p.$children$[1].$attrs$.onClick).toBeDefined();
  });

  it(`parse/serialize`, async () => {
    opts.headingAnchors = false;
    const r = await parseMarkdownContent(
      md(`
        # Hill Valley

        Save the [clock](/clock) [tower](/tower)!
      `),
      opts,
    );
    const props: RenderJsxProps = { ast: r.ast };
    const vdom = RenderJsxAst(props);
    expect(vdom).toHaveLength(2);
    const h1 = vdom[0];
    expect(h1.$tag$).toBe('h1');
    expect(h1.$text$).toBe(null);
    expect(h1.$children$[0].$text$).toBe('Hill Valley');
    expect(h1.$children$[0].$children$).toBe(null);

    const p = vdom[1];
    expect(p.$tag$).toBe('p');
    expect(p.$text$).toBe(null);
    expect(p.$children$[0].$text$).toBe('Save the ');

    expect(p.$children$[1].$tag$).toBe('a');
    expect(p.$children$[1].$text$).toBe(null);
    expect(p.$children$[1].$children$[0].$text$).toBe('clock');

    expect(p.$children$[2].$text$).toBe(' ');

    expect(p.$children$[3].$tag$).toBe('a');
    expect(p.$children$[3].$text$).toBe(null);
    expect(p.$children$[3].$children$[0].$text$).toBe('tower');
  });
});

function md(txt: string) {
  const lines = txt.split('\n');
  return lines
    .map(l => l.trimLeft())
    .join('\n')
    .trim();
}
