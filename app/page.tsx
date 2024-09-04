"use client";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaCopy } from "react-icons/fa"; // Import the copy icon
import { set } from "zod";
import { Chat } from "./components/Chat";
import { ThemeController } from "./components/ThemeController";
import {
	ToastContainer,
	ToastContainerMemo,
} from "./components/ToastContainer";
import { useToast } from "./hooks/useToast";

export default function Home() {
	const [file, setFile] = useState<File | null>(null);
	const [segments, setSegments] = useState<
		Array<{ segment: string; text: string; percentage: number }>
	>([]);
	const [percentage, setPercentage] = useState(0);
	const [isTranscribingComplete, setIsTranscribingComplete] = useState(false);
	const { addToast } = useToast();

	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	const scrollToBottom = useCallback(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, []);

	const {
		mutateAsync: splitThenTranscribeAudio,
		isPending: scriptThenTranscribeAudioLoading,
	} = useMutation({
		mutationFn: async (formData: FormData) => {
			try {
				const response = await fetch("/api/transcribe-stream", {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					throw new Error("Failed to transcribe audio");
				}

				const reader = response.body?.getReader();
				const decoder = new TextDecoder("utf-8");
				const segmentsData: Array<{
					segment: string;
					text: string;
					percentage: number;
				}> = [];

				setIsTranscribingComplete(false);

				while (reader) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					const parsedChunk = JSON.parse(chunk);

					segmentsData.push(parsedChunk);
					setSegments([...segmentsData]); // Update state with new segments
				}

				setIsTranscribingComplete(true);
				console.log("Final transcription segments:", segmentsData);
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

	const handleSubmitSplitThenTranscribeAudio = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!file) {
			alert("Please select a file first!");
			return;
		}

		setSegments([]); // Reset segments

		const formData = new FormData();
		formData.append("file", file);

		await splitThenTranscribeAudio(formData);
	};

	const transcription = useMemo(() => {
		return segments.map((segment) => segment.text).join(" ");
	}, [segments]);

	useEffect(() => {
		if (segments.length === 0) {
			return;
		}

		const lastSegment = segments[segments.length - 1];
		if (lastSegment) {
			const p = lastSegment.percentage;
			console.log("Updating percentage:", p);
			setPercentage(p);
		}
	}, [segments]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		scrollToBottom();
	}, [segments, scrollToBottom]);

	const handleCopyToClipboard = () => {
		if (transcription) {
			navigator.clipboard.writeText(transcription).then(() => {
				addToast("success", "Transcription copied to clipboard");
			});
		}
	};

	return (
		<main className="grid grid-rows-[max-content_1fr] gap-5 p-5 h-screen">
			<div className="flex justify-between align-top">
				<form
					onSubmit={handleSubmitSplitThenTranscribeAudio}
					className="flex h-10 align-middle"
				>
					<label className="flex gap-2 align-middle">
						<input
							type="file"
							accept="audio/*"
							onChange={handleFileChange}
							placeholder="audio"
							className="file-input w-full max-w-xs
              "
						/>
					</label>

					<button
						type="submit"
						disabled={!file || scriptThenTranscribeAudioLoading}
						className="btn btn-primary w-24"
					>
						{scriptThenTranscribeAudioLoading ? (
							<span className="loading loading-dots loading-xs " />
						) : (
							"Transcribe"
						)}
					</button>
				</form>

				<div className="flex gap-5 items-center">
					<div className="font-sans text-2xl font-bold">
						Simple Audio Transcriber
					</div>

					<ThemeController />
				</div>
			</div>

			{!isTranscribingComplete && segments.length > 0 && (
				<progress className="progress w-full" value={percentage} max="100" />
			)}

			<div
				className={`grid ${transcription && isTranscribingComplete && "grid-cols-2"} gap-5 h-[90vh]`}
			>
				<div className="prose w-full max-w-none p-4 rounded shadow-md border border-[var(--b1)] overflow-auto">
					<h3 className="flex items-center">
						Transcription:
						{transcription && (
							<div
								className="tooltip tooltip-bottom"
								data-tip="Copy transcription "
							>
								<button
									onClick={handleCopyToClipboard}
									className="ml-2 text-gray-400 hover:text-gray-800"
									aria-label="Copy transcription to clipboard"
									type="button"
								>
									<FaCopy />
								</button>
							</div>
						)}
					</h3>
					<article>{transcription}</article>
					<div ref={messagesEndRef} />
				</div>

				{transcription && isTranscribingComplete && (
					<Chat transcriptions={transcription} />
				)}
			</div>
			<ToastContainerMemo />
		</main>
	);
}
