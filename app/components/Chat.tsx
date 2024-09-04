import { richTextFromMarkdown } from "@contentful/rich-text-from-markdown";
import { useChat } from "ai/react";

import { useCallback, useEffect, useRef } from "react";
import { FaCopy } from "react-icons/fa";
import { useToast } from "../hooks/useToast";
import MarkdownRenderer from "./MarkdownRenderer";

export function Chat({
	transcriptions,
}: { transcriptions: string | undefined }) {
	const { addToast } = useToast();
	const { messages, input, setInput, handleInputChange, handleSubmit } =
		useChat();
	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	const scrollToBottom = useCallback(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, []);

	useEffect(() => {
		if (transcriptions && messages.length === 0) {
			const contextMessage = `You are an experienced nurse. I will provide you with meeting transcription, and I need your assistance in analyzing it. Please hold off on responding until I give you further instructions.
    Here is the data you will be analyzing, respond with markdown formatted text to the following questions: 
    
      [${transcriptions}]
      `;

			setInput(contextMessage);
			handleSubmit();
		}
	}, [handleSubmit, messages.length, setInput, transcriptions]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom]);

	const handleCopyToClipboard = async (markdownText: string) => {
		if (markdownText) {
			// const document = await richTextFromMarkdown(markdownText); // Convert markdown to plain text

			// Function to extract plain text from rich text document
			// const extractPlainText = (node: any): string => {
			// 	let text = "";
			// 	if (node.nodeType === "text") {
			// 		text += node.value;
			// 	} else if (node.content) {
			// 		for (const childNode of node.content) {
			// 			text += extractPlainText(childNode);
			// 		}
			// 	}
			// 	return text;
			// };

			// const plainText = extractPlainText(document);

			navigator.clipboard.writeText(markdownText).then(() => {
				addToast("success", "Copied to clipboard");
			});
		}
	};

	return (
		<div className="border-[var(--b1)] h-[90vh] flex flex-col  p-4 rounded shadow-md border">
			<div className="flex-1 overflow-auto flex flex-col gap-5">
				{messages.map((m) => {
					const isUser = m.role === "user";

					return (
						<div
							key={m.id}
							className={`flex flex-col 
                gap-2 shadow-lg rounded border p-4 border-${isUser ? "primary" : "secondary"}
                ${isUser ? "bg-outline-secondary" : "bg-outline-primary"}`}
						>
							<div>
								<span
									className={`text-sm font-semibold border-2
                    ${isUser ? "text-primary" : "text-secondary"} border-${isUser ? "primary" : "secondary"}
                    rounded-full p-1 px-2`}
								>
									{m.role}
								</span>

								<div
									className="tooltip tooltip-bottom"
									data-tip="Copy transcription "
								>
									<button
										onClick={() => handleCopyToClipboard(m.content)}
										className="ml-2 text-gray-400 hover:text-gray-800"
										aria-label="Copy transcription to clipboard"
										type="button"
									>
										<FaCopy />
									</button>
								</div>
							</div>

							<div className="prose lg:prose-xl">
								<MarkdownRenderer content={m.content} />
							</div>
						</div>
					);
				})}
				<div ref={messagesEndRef} />
			</div>

			<form onSubmit={handleSubmit} className="mt-2">
				<input
					className="input input-bordered w-full  shadow-xl"
					value={input}
					placeholder="Say something..."
					onChange={handleInputChange}
				/>
			</form>
		</div>
	);
}
