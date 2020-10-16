import type { ParseMarkdownOptions } from './types';
import marked, { MarkedOptions, Renderer } from 'marked';
import type PrismGlobal from 'prismjs';

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
    const regEx = /<(?<identifier>[a-z]+(?:-[a-z]+)+)(?<props>[\s\S]*)(?:\/>)/m;
    const match = html.match(regEx);

    type groupProps = { identifier: string, props?: string };
    if (match) {
      const { identifier, props } = match.groups as groupProps;

      return `<${identifier}${props ? props : ''}></${identifier}>\n`;
    }

    return html; 
  }

  paragraph(text: string) {
    const match = text.match(/<[a-z]+(-[a-z]+)+[^>]*>.*<\/[a-z]+(-[a-z]+)+>/m);
    if (match) return `${text}\n`;

    return `<p>${text}</p>\n`;    
  }

  code(code: string, infostring: any, escaped: boolean) {
    if (this.opts.codeSyntaxHighlighting === false) {
      return super.code(code, infostring, escaped);
    }

    const info = getCodeBlockInfo(infostring, this.opts.langPrefix); 
    if (info) {
      const grammar = Prism.languages[info.grammar];
      if (grammar) {
        const prismCode = Prism.highlight(code, grammar, info.language);
        if (typeof prismCode === 'string') {
          return `<pre class="${info.cssClass}"><code>${prismCode}</code></pre>\n`;
        }
      }
    }

    return `<pre><code>${escaped ? code : escape(code, true)}</code></pre>\n`;
  }

  heading(text: string, level: number) {
    return `<h${level}>${text}</h${level}>`;
  }
}

function getCodeBlockInfo(infostring: string, langPrefix?: string) {
  if (typeof infostring === 'string') {
    infostring = infostring.trim().toLowerCase();
    if (infostring.length > 0) {
      infostring = escape(infostring, true);
      langPrefix = (langPrefix || 'language-');

      const info = {
        grammar: infostring,
        language: infostring,
        cssClass: langPrefix + infostring,
      };

      if (infostring.startsWith('diff')) {
        // https://prismjs.com/plugins/diff-highlight/
        info.grammar = 'diff';
        info.cssClass += ` diff-highlight`;
      }

      return info;
    }
  }
  return null;
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

declare const Prism: typeof PrismGlobal;