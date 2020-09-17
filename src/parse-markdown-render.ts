import type { ParseMarkdownOptions } from './types';
import marked, { MarkedOptions, Renderer } from 'marked';
import { slugify } from './slugify';

const Prism = require('prismjs');
const loadLanguages = require('prismjs/components/');

export function parseMarkdownRenderer(
  markdown: string,
  markedOpts: MarkedOptions,
) {
  return new Promise<string>((resolve, reject) => {
    marked(markdown, markedOpts, (err, html) => {
      if (err) {
        reject(err);
      } else {
        resolve(html);
      }
    });
  });
}

class MarkedRenderer extends Renderer {
  constructor(private opts: ParseMarkdownOptions) {
    super(opts);
  }

  code(code: string, infostring: any, escaped: boolean) {
    if (this.opts.codeSyntaxHighlighting === false) {
      return super.code(code, infostring, escaped);
    }

    const lang = (infostring || '').match(/\S*/)[0];
    const hcl: number[] = [];
    code = code
      .split('\n')
      .map((line, index) => {
        if (line.charAt(0) === '|') {
          hcl.push(index + 1);
          return line.substring(1);
        }
        return line;
      })
      .join('\n');

    if (typeof lang === 'string' && lang.length > 0) {
      if (
        !loadedPrismLangs.includes(lang) ||
        !Object.keys(Prism.languages).includes(lang)
      ) {
        loadedPrismLangs.push(lang);
        loadLanguages(loadedPrismLangs);
      }
      const primsLang = Prism.languages[lang];
      if (primsLang) {
        const prismCode = Prism.highlight(code, Prism.languages[lang], lang);
        if (typeof prismCode === 'string') {
          const langCss =
            (this.opts.langPrefix || 'language-') + escape(lang, true);
          const preAttr = `class="${langCss}"${
            hcl.length > 0 ? ` data-highlighted-lines="${hcl.join(',')}"` : ``
          }`;
          return `<pre ${preAttr}><code>${prismCode}</code></pre>\n`;
        }
      }
    }

    return `<pre><code>${escaped ? code : escape(code, true)}</code></pre>\n`;
  }

  heading(text: string, level: number, raw: string) {
    if (this.opts.headingIds !== false) {
      const id = (this.opts.headingIdPrefix || '') + slugify(raw);

      if (this.opts.headingAnchors && level > 1) {
        // <h2 id="my-id"><a href="#my-id" class="heading-anchor" aria-hidden="true"></a>Text</h2>
        const cssClass = this.opts.headingAnchorClassName
          ? ` class="${this.opts.headingAnchorClassName}"`
          : ``;
        const anchor = `<a href="#${id}"${cssClass} aria-hidden="true"></a>`;
        return `<h${level} id="${id}">${anchor}${text}</h${level}>`;
      }

      return `<h${level} id="${id}">${text}</h${level}>`;
    }

    return `<h${level}>${text}</h${level}>`;
  }
}

export function getMarkedOptions(opts: ParseMarkdownOptions) {
  opts = {
    ...defaultMarkedOpts,
    ...defaultParseMarkdownOpts,
    ...opts,
  };

  const renderer = new MarkedRenderer(opts);
  opts.renderer = renderer;
  return opts;
}

const defaultMarkedOpts: MarkedOptions = {
  silent: false,
  smartLists: true,
  smartypants: true,
};

const defaultParseMarkdownOpts: ParseMarkdownOptions = {
  breaks: true,
  codeSyntaxHighlighting: true,
  gfm: true,
  headingAnchorClassName: `heading-anchor`,
  headingIds: true,
};

const loadedPrismLangs: string[] = [];

const escapeTest = /[&<>"']/;
const escapeReplace = /[&<>"']/g;
const escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
const escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;
const escapeReplacements: any = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const getEscapeReplacement = (ch: string) => escapeReplacements[ch];

function escape(html: string, encode: boolean) {
  if (encode) {
    if (escapeTest.test(html)) {
      return html.replace(escapeReplace, getEscapeReplacement);
    }
  } else {
    if (escapeTestNoEncode.test(html)) {
      return html.replace(escapeReplaceNoEncode, getEscapeReplacement);
    }
  }

  return html;
}
