import type { AnchorData, HeadingData, HtmlResults, ImgData } from './types';
import { createFragment } from '@stencil/core/mock-doc';
import { readFile } from './parse-utils';

export async function parseHtml(filePath: string) {
  const content = await readFile(filePath, 'utf8');
  return parseHtmlContent(content);
}

export async function parseHtmlContent(content: string): Promise<HtmlResults> {
  const frag = createFragment(content);

  const anchors: AnchorData[] = [];
  const headings: HeadingData[] = [];
  const imgs: ImgData[] = [];
  const tagNames: string[] = [];

  const ast = parsedNodeToJsxAst(frag, anchors, headings, imgs, tagNames);

  return {
    ast,
    anchors,
    headings,
    imgs,
    tagNames,
  };
}

/**
 * Converts parse5's html node format into a serialiable JSX AST format.
 * <div id="foo">bar</div>
 * becomes
 * ['div', { id: "foo" }, "bar"]
 * This AST can then be quickly converted into JSX vdom at runtime
 */
function parsedNodeToJsxAst(
  node: Node,
  anchors: AnchorData[],
  headings: HeadingData[],
  imgs: ImgData[],
  tagNames: string[],
): any {
  if (node) {
    if (node.nodeName === '#text') {
      // text node
      return (node as Text).nodeValue;
    }

    if (node.nodeName === '#document-fragment') {
      // fragment
      const data: any[] = [];
      for (let i = 0, l = node.childNodes.length; i < l; i++) {
        const n = parsedNodeToJsxAst(
          node.childNodes[i],
          anchors,
          headings,
          imgs,
          tagNames,
        );
        if (typeof n === 'string') {
          // fragment top level white space we can probably ignore
          if (n.trim() !== '') {
            const span = ['span', null, n];
            data.push(span);
          }
        } else {
          data.push(n);
        }
      }
      return data;
    }

    const elm = node as HTMLElement;
    if (typeof elm.tagName === 'string') {
      // element
      const data: any[] = [];
      const attrs: { [tag: string]: any } = {};
      let tag = elm.tagName.toLowerCase();

      if (tagBlacklist[tag]) {
        tag = 'template';
      }

      if (!tagNames.includes(tag)) {
        tagNames.push(tag);
      }

      data.push(tag);

      const elmAttributes = elm.attributes;
      const styleStr = elm.getAttribute('style');

      if (elmAttributes.length > 0 || styleStr) {
        for (let j = 0, k = elmAttributes.length; j < k; j++) {
          const attr = elmAttributes[j];
          if (attr) {
            attrs[attr.name] = attr.value;
          }
        }
        if (styleStr) {
          const style = convertStyleAttrToObj(styleStr);
          if (style && Object.keys(style).length > 0) {
            attrs.style = style;
          }
        }
        data.push(attrs);
      } else {
        data.push(null);
      }

      switch (tag) {
        case 'a': {
          if (typeof attrs.href === 'string' && !attrs.href.startsWith('#')) {
            anchors.push({
              text: elm.textContent!,
              href: attrs.href,
            });
          }
          break;
        }
        case 'h1': {
          headings.push({
            text: elm.textContent!,
            id: attrs.id,
            level: 1,
          });
          break;
        }
        case 'h2': {
          headings.push({
            text: elm.textContent!,
            id: attrs.id,
            level: 2,
          });
          break;
        }
        case 'h3': {
          headings.push({
            text: elm.textContent!,
            id: attrs.id,
            level: 3,
          });
          break;
        }
        case 'h4': {
          headings.push({
            text: elm.textContent!,
            id: attrs.id,
            level: 4,
          });
          break;
        }
        case 'h5': {
          headings.push({
            text: elm.textContent!,
            id: attrs.id,
            level: 5,
          });
          break;
        }
        case 'h6': {
          headings.push({
            text: elm.textContent!,
            id: attrs.id,
            level: 6,
          });
          break;
        }
        case 'img': {
          imgs.push({
            text: attrs.alt,
            src: attrs.src,
          });
          break;
        }
      }

      for (let i = 0, l = elm.childNodes.length; i < l; i++) {
        data.push(
          parsedNodeToJsxAst(
            elm.childNodes[i] as any,
            anchors,
            headings,
            imgs,
            tagNames,
          ),
        );
      }

      return data;
    }
  }

  return '';
}

function convertStyleAttrToObj(styleStr: string) {
  if (typeof styleStr === 'string' && styleStr.trim() !== '') {
    return styleStr.split(';').reduce((styleObj, style) => {
      const splt = style.split(':');
      if (splt.length === 2) {
        const prop = splt[0].trim();
        const value = splt[1].trim();
        if (prop !== '') {
          styleObj[prop] = value;
        }
      }
      return styleObj;
    }, {} as any);
  }
  return null;
}

const tagBlacklist: { [key: string]: true } = {
  script: true,
  link: true,
  meta: true,
  object: true,
  head: true,
  html: true,
  body: true,
};
