import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children: label }) => {
          const external = Boolean(href && /^https?:/.test(href));
          return (
            <a href={href} rel={external ? "noopener noreferrer" : undefined} target={external ? "_blank" : undefined}>
              {label}
            </a>
          );
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
