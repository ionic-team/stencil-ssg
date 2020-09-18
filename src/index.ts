import { h } from '@stencil/core';
import type { RenderJsxProps, JsxAstNode } from './types';

/**
 * Functional component that renders markdown and html content that
 * has already been converted into a serializable JSX AST format.
 */
export const RenderJsxAst = (props: RenderJsxProps) => (Array.isArray(props.ast) ? props.ast.map(toHypertext) : null);

/**
 * Converts an nested array shaped like hypertext
 * arguments and applies them on `h()`.
 * `['div', { id: 'my-id' }, 'text']`
 * becomes
 * `h('div', { id: 'my-id' }, 'text')`
 */
const toHypertext = (node: JsxAstNode[]) => {
  if (!Array.isArray(node) || node.length < 2) {
    return null;
  }

  const args = [];
  let i: number;
  let l: number;
  let arg: any;
  let attrs: any;
  let k: string;

  for (i = 0, l = node.length; i < l; i++) {
    arg = node[i];
    if (
      i === 0 &&
      typeof arg === 'string' &&
      tagBlacklist[arg.toLowerCase().trim()]
    ) {
      arg = 'template';
    } else if (i === 1 && arg) {
      attrs = {};
      Object.keys(arg).forEach(key => {
        k = key.toLowerCase();
        if (!k.startsWith('on') && k !== 'innerhtml') {
          attrs[key] = arg[key];
        }
      });
      arg = attrs;
    } else if (i > 1) {
      if (Array.isArray(arg)) {
        arg = toHypertext(arg);
      }
    }
    args.push(arg);
  }

  return (h as any).apply(null, args);
};

const tagBlacklist: { [key: string]: true } = {
  script: true,
  link: true,
  meta: true,
  object: true,
  head: true,
  html: true,
  body: true,
};

export type {
  AnchorData,
  HeadingData,
  HtmlResults,
  ImgData,
  JsxAstNode,
  MarkdownResults,
  PageNavigation,
  PageNavigationData,
  PageNavigationOptions,
  RenderJsxProps,
  SlugifyOptions,
  TableOfContents,
  TableOfContentsNode,
} from './types';

export { slugify } from './slugify';
