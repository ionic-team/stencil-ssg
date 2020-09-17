export interface ParseMarkdownContentOptions {
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
   * Enable GFM line breaks. This option requires the gfm option to be true.
   * @default true
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
   * @default false
   */
  headingAnchors?: boolean;
  /**
   * The CSS classname to add to heading anchor elements.
   * @default "heading-anchor"
   */
  headingAnchorClassName?: string;
  /**
   * Set the prefix for code block classes.
   * @default "language-"
   */
  langPrefix?: string;
  /**
   * Type: object Default: new Renderer()
   *
   * An object containing functions to render tokens to HTML.
   */
  renderer?: any;
  /**
   * Sanitize the output. Ignore any HTML that has been input.
   */
  sanitize?: boolean;
  /**
   * Optionally sanitize found HTML with a sanitizer function.
   */
  sanitizer?(html: string): string;
}

export interface ParseCacheOptions {
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
  /**
   * If the parse command should read and write cache files.
   * @default true
   */
  useCache?: boolean;
  /**
   * Cache buster number to create new cache file names. A cache buster
   * number is required if any of the options provided are functions.
   */
  cacheBuster?: number;
  /**
   * Cache directory.
   * @default `os.tmpdir()`.
   */
  cacheDir?: string;
}

export interface ParseMarkdownOptions extends ParseMarkdownContentOptions, ParseCacheOptions {}

export type ParseCache = (content: string, opts: ParseMarkdownOptions) => ParseCacheApi;

export interface ParseCacheApi {
  get(): Promise<MarkdownResults | null>;
  put(results: MarkdownResults<any>): Promise<void>;
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
}

export interface MarkdownResults<T = { [key: string]: string }> extends HtmlResults {
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
}

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
