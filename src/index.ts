import { h } from '@stencil/core';
import type { RenderJsxProps, JsxAstNode, ElementPropsHook } from './types';

/**
 * Functional component that renders markdown and html content that
 * has already been converted into a serializable JSX AST format.
 */
export const RenderJsxAst = (props: RenderJsxProps) => {
  if (props && Array.isArray(props.ast)) {
    const elementProps =
      typeof props.elementProps === 'function' ? props.elementProps : undefined;

    return props.ast.map(node => toHypertext(elementProps, node));
  }
  return null;
};

/**
 * Converts an nested array shaped like hypertext
 * arguments and applies them on `h()`.
 * `['div', { id: 'my-id' }, 'text']`
 * becomes
 * `h('div', { id: 'my-id' }, 'text')`
 */
const toHypertext = (
  elementProps: ElementPropsHook | undefined,
  node: JsxAstNode[],
) => {
  if (!Array.isArray(node) || node.length < 2) {
    return null;
  }

  const args = [];
  const tagName = typeof node[0] === 'string' ? node[0].toLowerCase() : '';

  let i: number;
  let l: number;
  let arg: any;

  for (i = 0, l = node.length; i < l; i++) {
    arg = node[i];

    if (i === 1) {
      if (elementProps && tagName) {
        arg = elementProps(tagName, arg);
      }
    } else if (i > 1) {
      if (Array.isArray(arg)) {
        arg = toHypertext(elementProps, arg);
      }
    }
    args.push(arg);
  }

  return (h as any).apply(null, args);
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
