import { Code } from "bright";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Code blocks follow the site theme. next-themes puts "light" or "dark" on
// <html>, and bright shows the light theme under this selector.
const CODE_THEME = {
  light: "github-light",
  dark: "github-dark",
  lightSelector: "html.light",
} as const;

const components: Components = {
  // A ```js fence arrives as <pre><code class="language-js">; bright reads
  // the language from that class
  pre: ({ children }) => (
    <Code
      theme={CODE_THEME}
      lineNumbers
      className="shadow-light-200 dark:shadow-dark-200"
    >
      {children}
    </Code>
  ),
  // Links are written by users: don't pass them our ranking or our tab.
  // A link whose URL was dropped (javascript:) is just its text.
  a: ({ href, title, children }) =>
    href ? (
      <a href={href} title={title} rel="nofollow ugc noopener noreferrer">
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
};

// Renders a question or answer body. It's plain Markdown (what the editor
// saves) plus GitHub extras like tables. Raw HTML in it is shown as text,
// never rendered, and javascript: links are dropped, so users can't inject
// tags or scripts into the page.
const Preview = ({ content }: { content: string }) => (
  <section className="markdown grid wrap-break-word">
    <Markdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </Markdown>
  </section>
);

export default Preview;
