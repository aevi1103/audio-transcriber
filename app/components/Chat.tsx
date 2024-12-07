import { useChat } from "ai/react";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import React from "react";
import { FaCopy } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "../hooks/useToast";
import MarkdownRenderer from "./MarkdownRenderer";

export function Chat({
	transcriptions,
	chatId,
}: { transcriptions: string | undefined; chatId: string | undefined }) {
	const { addToast } = useToast();
	const { messages, input, setInput, handleInputChange, handleSubmit } =
		useChat({
			id: chatId ?? uuidv4(),
		});
	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	const scrollToBottom = useCallback(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, []);

	const contextMessage = useMemo(
		() => `You are a nursing student analyzing a meeting transcription. I will provide you with the transcription data and need your help with the analysis.

Please wait for further instructions before starting. Once you receive the instructions, analyze the data and respond using markdown-formatted text to the following questions:
    
      [${transcriptions}]
      `,
		[transcriptions],
	);

	const handleInitialMessage = useCallback(() => {
		if (transcriptions && messages.length === 0) {
			setInput(contextMessage);
			handleSubmit();
		}
	}, [contextMessage, handleSubmit, messages.length, setInput, transcriptions]);

	useEffect(() => {
		console.log({ messages });

		handleInitialMessage();
	}, [handleInitialMessage, messages]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom]);

	const handleCopyToClipboard = async (markdownText: string) => {
		if (markdownText) {
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
									data-tip="Copy to clipboard"
								>
									<button
										onClick={() => handleCopyToClipboard(m.content)}
										className="ml-2 text-gray-400 hover:text-gray-800"
										aria-label="Copy to clipboard"
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

export const ChatMemo = React.memo(Chat);
