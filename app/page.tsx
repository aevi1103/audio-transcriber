"use client";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
	const [file, setFile] = useState<File | null>(null);

	const {
		mutateAsync,
		isPending,
		data: transcription,
	} = useMutation({
		mutationFn: async (formData: FormData) => {
			try {
				const response = await fetch("/api/transcribe", {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					throw new Error("Failed to transcribe audio");
				}

				const data = await response.json();
				return data.transcription as string;
			} catch (error) {
				console.error(error);
				throw error;
			}
		},
	});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			setFile(e.target.files[0]);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!file) {
			alert("Please select a file first!");
			return;
		}

		const formData = new FormData();
		formData.append("file", file);
		await mutateAsync(formData);
	};

	return (
		<main className="container mx-auto ">
			<div className="min-h-dvh bg-violet-100 p-5 shadow-lg shadow-violet-500/50 border-r border-l border-violet-200 flex flex-col gap-5">
				<form onSubmit={handleSubmit} className="flex gap-2">
					<label className="block">
						<span className="block text-sm font-medium text-slate-700 mb-2">
							Select Audio
						</span>
						<input
							type="file"
							accept="audio/*"
							onChange={handleFileChange}
							placeholder="audio"
							className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-violet-50 file:text-violet-700
                hover:file:bg-violet-100
              "
						/>
					</label>
					<button
						type="submit"
						disabled={!file || isPending}
						className="px-2 bg-violet-700 text-white rounded disabled:bg-violet-300"
					>
						{isPending ? "Transcribing..." : "Transcribe"}
					</button>
				</form>

				<div className="min-h-full rounded-md grid grid-cols-2 gap-5">
					<div className="min-h-full bg-gray-50 p-4 rounded shadow-md border">
						<p className="font-bold mb-2">Transcription:</p>
						<p className="text-sm">{transcription}</p>
					</div>

					<Chat transcriptions={transcription} />
				</div>
			</div>
		</main>
	);
}

type Conversation = {
	role: string;
	content: string;
	id: string;
	isContext?: boolean;
};

function Chat({ transcriptions }: { transcriptions: string | undefined }) {
	const [conversation, setConversation] = useState<Conversation[]>([]);
	const [message, setMessage] = useState("");

	const { mutateAsync, isPending } = useMutation({
		mutationFn: async (body: string) => {
			try {
				const res = await fetch("/api/chat", {
					method: "POST",
					body: JSON.stringify([
						...conversation,
						{ role: "user", content: body },
					]),
				});

				const reader = res.body?.getReader();
				if (!reader) {
					throw new Error("Failed to get reader from response body");
				}

				const decoder = new TextDecoder("utf-8");

				let chatResponse = "";
				let done = false;

				const id = uuidv4();

				setConversation((prev) => [
					...prev,
					{ id, role: "assistant", content: chatResponse },
				]);

				while (!done) {
					const { value, done: readerDone } = await reader.read();
					done = readerDone;
					const chunk = decoder.decode(value, { stream: !readerDone });
					const lines = chunk.split("\n");
					for (const line of lines) {
						if (line.trim()) {
							try {
								const parsed = JSON.parse(line);
								const content = parsed.choices[0]?.delta?.content;
								if (content) {
									chatResponse += content;

									setConversation((prev) => {
										const currentConversation = prev.map((item) => {
											if (item.id === id) {
												return { ...item, content: chatResponse };
											}

											return item;
										});

										return currentConversation;
									});
								}
							} catch (error) {
								console.error("Error parsing line", error);
							}
						}
					}
				}

				return chatResponse;
			} catch (error) {
				console.error(error);
				throw error;
			}
		},
	});

	const contextMessage = useMemo(() => {
		return `You are an experienced nurse. I will provide you with a transcriptions, and I need your assistance in analyzing it. Please hold off on responding until I give you further instructions.
    Here is the data you will be analyzing:
		
    \`\`\`
    ${transcriptions}
    \`\`\``;
	}, [transcriptions]);

	return (
		<div className="min-h-full bg-gray-50 p-4 rounded shadow-md border flex flex-col gap-2">
			{!transcriptions ? (
				<span className="text-violet-500">Missing transcription</span>
			) : (
				<form className="flex gap-3">
					<textarea
						name="message"
						placeholder="Ask any question..."
						className="w-full border p-2 rounded-md"
						onChange={(e) => setMessage(e.target.value)}
					/>

					<button
						type="submit"
						className="bg-violet-700 text-white rounded disabled:bg-violet-300 p-2 w-20"
						disabled={isPending || !message}
						onClick={async (e) => {
							e.preventDefault();
							await mutateAsync(message);
						}}
					>
						Ask
					</button>
				</form>
			)}

			{conversation.map((item) => (
				<div
					key={item.id}
					className={`p-2 ${item.role === "assistant" ? "bg-violet-100" : "bg-gray-100"} rounded-md`}
				>
					<p className="text-sm">{item.content}</p>
				</div>
			))}
		</div>
	);
}
