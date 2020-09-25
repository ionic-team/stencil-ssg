import type {
  AnchorData,
  HeadingData,
  HtmlResults,
  ImgData,
  ParseHtmlOptions,
} from './types';
import { createFragment, serializeNodeToHtml } from '@stencil/core/mock-doc';
import { readFile } from './parse-utils';
import { slugify } from './slugify';

export async function parseHtml(filePath: string, opts?: ParseHtmlOptions) {
  const content = await readFile(filePath, 'utf8');
  return parseHtmlContent(content, opts);
}

export async function parseHtmlContent(
  html: string,
  opts?: ParseHtmlOptions,
): Promise<HtmlResults> {
  opts = getHtmlOptions(opts);
  const frag = createFragment(html);
  const doc = frag.ownerDocument;

  if (typeof opts.beforeSerialize === 'function') {
    await opts.beforeSerialize(frag);
  }

  const headingElms = frag.querySelectorAll('h1,h2,h3,h4,h5,h6');
  const headings = Array.from(headingElms).map(headingElm => {
    const headingData: HeadingData = {
      text: headingElm.textContent!,
      level: (headingLevels as any)[headingElm.tagName],
      id: null,
    };

    if (opts?.headingIds) {
      headingData.id = (opts.headingIdPrefix || '') + slugify(headingData.text);
      headingElm.setAttribute('id', headingData.id);
    } else {
      headingData.id = headingElm.getAttribute('id');
    }

    if (
      opts?.headingAnchors &&
      typeof headingData.id === 'string' &&
      headingData.id.length > 0
    ) {
      // <h2 id="my-id"><a href="#my-id" class="heading-anchor" aria-hidden="true"></a>Text</h2>
      const anchor = doc.createElement('a');
      anchor.setAttribute(`href`, `#${headingData.id}`);
      if (typeof opts.headingAnchorClassName === 'string') {
        anchor.className = opts.headingAnchorClassName;
      }
      anchor.setAttribute(`aria-hidden`, `true`);
      headingElm.insertBefore(anchor, headingElm.firstChild);
    }

    return headingData;
  });

  if (
    typeof opts.paragraphIntroClassName === 'string' &&
    opts.paragraphIntroClassName.length > 0
  ) {
    const rootElements = Array.from(frag.children);
    const hasSubHeadings = rootElements.find(isSubHeading);
    if (hasSubHeadings) {
      // add paragraph intro class to every <p> until the first heading
      for (const elm of rootElements) {
        if (isSubHeading(elm)) {
          break;
        }
        if (elm.tagName === 'P') {
          elm.classList.add(opts.paragraphIntroClassName);
        }
      }
    } else {
      // no sub headings, so only add the class to the first paragraph
      for (const elm of rootElements) {
        if (elm.tagName === 'P') {
          elm.classList.add(opts.paragraphIntroClassName);
          break;
        }
      }
    }
  }
  const anchors: AnchorData[] = [];
  const imgs: ImgData[] = [];
  const tagNames: string[] = [];

  const ast = parsedNodeToJsxAst(frag, anchors, imgs, tagNames);

  return {
    ast,
    anchors,
    headings,
    imgs,
    tagNames,
    html: serializeNodeToHtml(frag),
  };
}

const headingLevels = { H1: 1, H2: 2, H3: 3, H4: 4, H5: 5, H6: 6 };

function isSubHeading(elm: Element) {
  if (elm) {
    const tagName = elm.tagName;
    return (
      tagName === 'H2' ||
      tagName === 'H3' ||
      tagName === 'H4' ||
      tagName === 'H5' ||
      tagName === 'H6'
    );
  }
  return false;
}

function getHtmlOptions(opts?: ParseHtmlOptions) {
  return {
    ...defaultParseHtmlOpts,
    ...opts,
  };
}

const defaultParseHtmlOpts: ParseHtmlOptions = {
  headingAnchorClassName: `heading-anchor`,
  headingIds: true,
  paragraphIntroClassName: `paragraph-intro`,
};

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
      const childNodes = node.childNodes;
      for (let i = 0, l = childNodes.length; i < l; i++) {
        const n = parsedNodeToJsxAst(childNodes[i], anchors, imgs, tagNames);
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
          const href = attrs.href;
          if (typeof href === 'string' && !href.startsWith('#')) {
            anchors.push({
              text: elm.textContent!,
              href,
            });
          }
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

      const childNodes = elm.childNodes;
      for (let i = 0, l = childNodes.length; i < l; i++) {
        data.push(parsedNodeToJsxAst(childNodes[i], anchors, imgs, tagNames));
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
