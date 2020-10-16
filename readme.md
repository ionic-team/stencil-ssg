# Stencil Static Site Generation Utilities 🏎💨

Utility functions and helpers for building static sites with [Stencil](https://stenciljs.com/):

- Parse Markdown
- Parse HTML
- Parse Yaml Front Matter
- Code Syntax Highlighting with [Prism](https://prismjs.com/)
- Generate site table of contents
- Convert Markdown/HTML into serializable JSX
- Functional Component to render serialized JSX with minimal runtime
- Slugify text

## Syntax Highlighting 

Uses [Prism](https://prismjs.com/) at build-time for code block syntax highlighting. 
Prism JavaScript is not needed at run-time, however the Prism CSS must be provided by the site.

### Setting Code Language

    ```typescript
    const mph: number = 88;
    ```

### Adding Code Diffs

    ```diff-typescript
    - const mph: number = 88;
    + let year = 85;
    ```
