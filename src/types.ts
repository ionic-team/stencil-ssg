export interface ParseHtmlOptions {
  /**
   * Hook that can be used to modify the HTML content before it is parsed
   * into a `document`. Should return the updated HTML as a string.
   */
  beforeHtmlParse?(htmlContent: string): string | Promise<string>;
  /**
   * Hook that can be used to modify the document fragment before it is
   * serialized into an HTML string. The fragment is a standards based
   * DOM object and common web APIs such as setAttribute and querySelector
   * can be used. The `document` can be accessed at `frag.ownerDocument`.
   * To create an element, use `frag.ownerDocument.createElement('div')`.
   * The frag is updated in place.
   * @param frag DOM document fragment of the parsed content.
   */
  beforeHtmlSerialize?(frag: DocumentFragment): void | Promise<void>;
  /**
   * Include an id attribute in h1-h6 heading tags.
   * @default true
   */
  headingIds?: boolean;
  /**
   * Set the prefix for heading tag ids.
   */
  headingIdPrefix?: string;
  /**
   * Include anchors within h2-h6 tags using their heading id as the href hash.
   * This is useful so h2-h6 headings can be linked to using a hash in the url.
   * Additionally, `headingIds` must be `true` for heading anchors. It's recommended
   * to also set the anchor's CSS on a heading hover.
   *
   * `<h2 id="my-id"><a href="#my-id" class="heading-anchor" aria-hidden="true"></a>Text</h2>`
   * @default true
   */
  headingAnchors?: boolean;
  /**
   * The CSS classname to add to heading anchor elements.
   * @default "heading-anchor"
   */
  headingAnchorClassName?: string;
  /**
   * CSS classname to be added to the first paragraphs found within the content.
   * Intro paragraphs are the first paragraphs before the first subheading. For
   * example, all the paragraphs between the `h1` and `h2` headings will get the
   * paragraph intro CSS classname, but all paragraphs after the `h2` will
   * not receive the classname. If there are no subheadings, then only the first
   * paragraph will receive the classname.
   * @default "paragraph-intro"
   */
  paragraphIntroClassName?: string;
}

export interface ParseMarkdownContentOptions extends ParseHtmlOptions {
  /**
   * Whether to use [safeload](https://github.com/nodeca/js-yaml#safeload-string---options-)
   * @default true
   */
  allowUnsafe?: boolean;
  /**
   * A prefix URL for any relative link.
   */
  baseUrl?: string;
  /**
   * Hook that can be used to modify the markdown content before it is converted
   * into HTML. This happens after the markdown file's front matter has been parsed
   * and the front matter attributes are available as the second param. Should return
   * the updated markdown content.
   * @param markdownContent The markdown content.
   * @param frontMatterAttributes The front matter attributes already parsed from the markdown content
   */
  beforeMarkdownToHtml?(
    markdownContent: string,
    frontMatterAttributes: any,
  ): string | Promise<string>;
  /**
   * Enable GFM line breaks. This option requires the gfm option to be true.
   * @default false
   */
  breaks?: boolean;
  /**
   * Add syntax highlighting to code blocks. Uses [PrismJS](https://prismjs.com/)
   * at build time. The correct prism language css styles should also be added
   * to the pages rendering the code blocks.
   * @default true
   */
  codeSyntaxHighlighting?: boolean;
  /**
   * Enable GitHub flavored markdown.
   * @default true
   */
  gfm?: boolean;
  /**
   * Set the prefix for code block classes.
   * @default "language-"
   */
  langPrefix?: string;
}

export interface ParseMarkdownOptions extends ParseMarkdownContentOptions {
  /**
   * Will resolve the markdown file path given an id, much like how nodejs would
   * resolve a `.js` file. By default, if the given id does not have an `.md`
   * file extension, it will first check for the markdown file by adding `.md`.
   * If that file does not exist, it will check if the id is a directory, and look
   * for `index.md` inside of the directory. Unlike nodejs resolving, the default markdown
   * file path resolving will not move up a directory and try again. The default
   * will also only look using the `.md` extension.
   *
   * Given the id `pages/my-file`, without an `.md` extension, the default resolution
   * will attempt to find the markdown file in this order:
   *
   * 1. `pages/my-file.md`
   * 2. `pages/my-file/index.md`
   *
   * If the given id is `pages/my-file.md`, which has the `.md` extension, it will
   * attempt find this exact file path.
   *
   * @default true
   */
  resolveMarkdownPath?: (id: string) => Promise<string>;
}

export interface HtmlResults {
  /**
   * Anchor (link) data and in order found in the document. Does not include
   * anchors without `href` attributes or href's that start with `#`.
   */
  anchors: AnchorData[];
  /**
   * Results of parsing the html into a JSON serializable format which can
   * be later used to generate JSX/hypertext, both serverside and clientside.
   */
  ast: JsxAstNode[];
  /**
   * Heading data and in order found in the document.
   */
  headings: HeadingData[];
  /**
   * Images in order found in the document.
   */
  imgs: ImgData[];
  /**
   * All the HTML tags found, but no duplicates.
   */
  tagNames: string[];
  /**
   * The resulting HTML, which may be different from the passed in
   * HTML due to any changes that could have happened within the
   * `beforeHtmlSerialize(frag)` option.
   */
  html: string;
}

export interface MarkdownResults<T = { [key: string]: string }>
  extends HtmlResults {
  /**
   * Contains extracted yaml attributes.
   */
  attributes: T;
  /**
   * The description from the front matter attributes.
   */
  description?: string;
  /**
   * The resolved file path of the markdown file.
   */
  filePath?: string;
  /**
   * Results from parsing the markdown into html.
   */
  html: string;
  /**
   * Slugified title from the filename provided in the parse options. This can be
   * overridden by adding a `slug` front matter attribute.
   */
  slug?: string;
  /**
   * The title from the front matter attributes.
   */
  title?: string;
}

export interface PageUrlOptions {
  /**
   * If the url should always end with a `/` or not. Default is to not end with a trailing `/`.
   * @default false
   */
  trailingSlash?: boolean;
}

export interface PageNavigationOptions extends PageUrlOptions {
  /**
   * The table of contents which can be used to calculate the previous and next pages.
   */
  tableOfContents?: TableOfContents;
}

export interface PageNavigation {
  current: PageNavigationData | null;
  parent: PageNavigationData | null;
  next: PageNavigationData | null;
  previous: PageNavigationData | null;
}

export interface PageNavigationData {
  title: string | null;
  url: string | null;
}

export interface AnchorData {
  href: string | null;
  text: string;
}

export interface HeadingData {
  text: string;
  level: number;
  id: string | null;
}

export interface ImgData {
  text: string | null;
  src: string | null;
}

export type JsxAstNode = any;

export interface RenderJsxProps {
  ast: JsxAstNode[];
  /**
   * A hook called for every element, passing the tag name
   * and its props to the function. The returned props is
   * what will get used when rendering. This is useful for adding
   * listeners which cannot be serialized, and/or updating element
   * props.
   */
  elementProps?: ElementPropsHook;
}

export type ElementPropsHook = (
  tagName: string,
  props: RenderAstJsxProps,
) => RenderAstJsxProps;

export type RenderAstJsxProps = { [key: string]: any } | null;

export interface SlugifyOptions {
  /**
   * Replace spaces with replacement character.
   * @default `-`
   */
  replacement?: string;
  /**
   * Remove characters that match regex.
   * @default undefined
   */
  remove?: RegExp;
  /**
   * Convert to lower case.
   * @default `true`
   */
  lower?: boolean;
  /**
   * Strip special characters except replacement.
   * @default `true`
   */
  strict?: boolean;
  /**
   * Language code of the locale to use.
   */
  locale?: string;
  /**
   * Remove common file extensions if the string ends with one of these:
   * `.md`, `.markdown`, `.txt`, `.html`, `.htm`, `.jpeg`, `.jpg`, `.png`
   * @default `true`
   */
  removeFileExtension?: boolean;
  /**
   * Trim the replacement character from the start and end of the slug.
   * For example, if the slug ends up being `--my-slug---` the output
   * will be `my-slug`
   * @default `true`
   */
  trimReplacement?: boolean;
}

export interface ParseTableOfContentsOptions extends PageUrlOptions {}

export interface TableOfContents {
  tocFilePath: string;
  tocDirPath: string;
  rootPagesDir: string;
  root: TableOfContentsNode[];
}

export interface TableOfContentsNode {
  text?: string;
  url?: string;
  file?: string;
  hasParent?: boolean;
  children?: TableOfContentsNode[];
  depth: number;
}
