import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MarkdownRenderer = ({ content }) => {
  if (!content || !content.trim()) {
    return (
      <p className="italic text-neutral-400">
        Nothing to preview yet. Start writing your story...
      </p>
    );
  }

  return (
    <div className="markdown-body text-base leading-8 text-neutral-700 sm:text-lg sm:leading-9">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-8 text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-7 border-b border-neutral-100 pb-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-6 text-xl font-bold text-neutral-900 sm:text-2xl">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-5 whitespace-pre-wrap break-words leading-8 text-neutral-700">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-5 list-disc space-y-2 pl-6 text-neutral-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-5 list-decimal space-y-2 pl-6 text-neutral-700">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-7">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-6 rounded-r-2xl border-l-4 border-violet-500 bg-violet-50/50 px-5 py-3 italic text-neutral-700">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");
            const isBlock = Boolean(match) || codeString.includes("\n");

            if (isBlock) {
              return (
                <div className="my-6 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 text-neutral-100 shadow-sm">
                  {match && (
                    <div className="border-b border-neutral-800 bg-neutral-900 px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-neutral-400">
                      {match[1]}
                    </div>
                  )}
                  <pre className="overflow-x-auto p-4 font-mono text-sm leading-6">
                    <code className={className} {...props}>
                      {codeString}
                    </code>
                  </pre>
                </div>
              );
            }

            return (
              <code
                className="rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-sm font-medium text-violet-700"
                {...props}
              >
                {children}
              </code>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-violet-600 underline underline-offset-4 transition hover:text-violet-800"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-8 border-neutral-200" />,
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || "Blog image"}
              className="my-6 max-h-[480px] w-full rounded-2xl border border-neutral-200 object-cover"
            />
          ),
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-neutral-200">
              <table className="w-full border-collapse text-left text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-neutral-200 bg-neutral-100 px-4 py-2.5 font-semibold text-neutral-900">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-neutral-100 px-4 py-2.5 text-neutral-700">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
