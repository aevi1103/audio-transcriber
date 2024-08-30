import { useChat } from "ai/react";
import { useCallback, useEffect, useRef } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

export function Chat({
	transcriptions,
}: { transcriptions: string | undefined }) {
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

	return (
		<div className="border-violet-300 h-[90vh] flex flex-col bg-gray-50 p-4 rounded shadow-md border">
			<div className="flex-1 overflow-auto flex flex-col gap-2">
				{messages.map((m) => {
					const isUser = m.role === "user";

					return (
						<div
							key={m.id}
							className={`flex flex-col 
                gap-2 shadow-sm rounded border p-4 
                ${isUser ? "bg-blue-50" : "bg-violet-50"}`}
						>
							<div>
								<span
									className={`text-sm font-semibold border-2
                    bg-violet-100 text-violet-700 border-violet-600
                    rounded-full p-1 px-2`}
								>
									{m.role}
								</span>
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
					className="p-2 w-full border border-gray-300 rounded shadow-xl"
					value={input}
					placeholder="Say something..."
					onChange={handleInputChange}
				/>
			</form>
		</div>
	);
}
