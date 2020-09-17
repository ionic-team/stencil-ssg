import type { AnchorData, HeadingData, HtmlResults, ImgData } from './types';
import type { DefaultTreeTextNode, DefaultTreeElement } from 'parse5';
import { parseFragment } from 'parse5';
import { readFile } from './parse-utils';

export async function parseHtml(filePath: string) {
  const content = await readFile(filePath, 'utf8');
  return parseHtmlContent(content);
}

export async function parseHtmlContent(content: string): Promise<HtmlResults> {
  const frag: any = parseFragment(content);

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
  node: any,
  anchors: AnchorData[],
  headings: HeadingData[],
  imgs: ImgData[],
  tagNames: string[],
): any {
  if (node) {
    if (node.nodeName === '#text') {
      // text node
      return (node as DefaultTreeTextNode).value;
    }

    if (node.nodeName === '#document-fragment') {
      // fragment
      const data: any[] = [];
      for (let i = 0, l = node.childNodes.length; i < l; i++) {
        const n = parsedNodeToJsxAst(
          node.childNodes[i] as any,
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

    const elm = node as DefaultTreeElement;
    if (typeof elm.tagName === 'string') {
      // element
      const data: any[] = [];
      const attrs: { [tag: string]: string | null } = {};
      let tag = elm.tagName.toLowerCase();

      if (tagBlacklist[tag]) {
        tag = 'template';
      }

      if (!tagNames.includes(tag)) {
        tagNames.push(tag);
      }

      data.push(tag);

      if (elm.attrs.length > 0) {
        for (let j = 0, k = elm.attrs.length; j < k; j++) {
          const attr = elm.attrs[j];
          if (attr) {
            if (attr.name === 'style') {
              attrs.style = convertStyleAttrToObj(attr.value);
            } else {
              attrs[attr.name] = attr.value;
            }
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
              text: getTextContent(elm),
              href: attrs.href,
            });
          }
          break;
        }
        case 'h1': {
          headings.push({
            text: getTextContent(elm),
            id: attrs.id,
            level: 1,
          });
          break;
        }
        case 'h2': {
          headings.push({
            text: getTextContent(elm),
            id: attrs.id,
            level: 2,
          });
          break;
        }
        case 'h3': {
          headings.push({
            text: getTextContent(elm),
            id: attrs.id,
            level: 3,
          });
          break;
        }
        case 'h4': {
          headings.push({
            text: getTextContent(elm),
            id: attrs.id,
            level: 4,
          });
          break;
        }
        case 'h5': {
          headings.push({
            text: getTextContent(elm),
            id: attrs.id,
            level: 5,
          });
          break;
        }
        case 'h6': {
          headings.push({
            text: getTextContent(elm),
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
        styleObj[prop] = value;
      }
      return styleObj;
    }, {} as any);
  }
  return null;
}

function getTextContent(elm: DefaultTreeElement) {
  const out: string[] = [];
  getChildTextContent(elm, out);
  return out.join('').trim();
}

function getChildTextContent(
  node: DefaultTreeElement | DefaultTreeTextNode,
  out: string[],
) {
  if (node) {
    if (node.nodeName === '#text') {
      out.push((node as DefaultTreeTextNode).value);
    } else {
      const childNodes = (node as DefaultTreeElement).childNodes;
      if (childNodes) {
        for (let i = 0, l = childNodes.length; i < l; i++) {
          getChildTextContent(childNodes[i] as any, out);
        }
      }
    }
  }
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
