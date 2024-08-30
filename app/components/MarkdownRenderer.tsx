import type React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
	content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
	return (
		<ReactMarkdown
			className="text-sm overflow-auto markdown"
			remarkPlugins={[remarkGfm]} // to support GitHub Flavored Markdown
			rehypePlugins={[rehypeRaw]} // to support raw HTML in markdown
		>
			{content}
		</ReactMarkdown>
	);
};

export default MarkdownRenderer;
