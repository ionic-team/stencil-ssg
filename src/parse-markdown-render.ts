import type { ParseMarkdownOptions } from './types';
import marked, { MarkedOptions, Renderer } from 'marked';

const Prism = require('prismjs');
const loadLanguages = require('prismjs/components/');

export function parseMarkdownRenderer(
  markdown: string,
  markedOpts: ParseMarkdownOptions,
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

  html(html: string): any {    
    const regEx = /<(?<identifier>[a-z]+(?:-[a-z]+)+)(?<props>[^>]*)(?:\/>)/m;
    const match = html.match(regEx);

    type groupProps = { identifier: string, props?: string };
    if (match) {
      const { identifier, props } = match.groups as groupProps;

      return `<${identifier}${props ? props : ''}></${identifier}>\n`;
    }

    return html; 
  }

  paragraph(text: string) {
    const match = text.match(/<[a-z]+(-[a-z]+)+[^>]*>.*<\/\s*[a-z]+(-[a-z]+)+>/m);
    if (match) return `${text}\n`;

    return `<p>${text}</p>\n`;    
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

  heading(text: string, level: number) {
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
  (opts as MarkedOptions).renderer = renderer;
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
