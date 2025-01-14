"use client";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaCopy } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import NoSSRWrapper from "./NoSSRWrapper";
import { ChatMemo } from "./components/Chat";
import { ThemeController } from "./components/ThemeController";
import { ToastContainerMemo } from "./components/ToastContainer";
import { useToast } from "./hooks/useToast";

export default function Home() {
	const [file, setFile] = useState<File | null>(null);
	const [chatId, setChatId] = useState<string | undefined>(uuidv4());
	const [segments, setSegments] = useState<
		Array<{ segment: string; text: string; percentage: number }>
	>([]);
	const [transcribeStatus, setTranscribeStatus] = useState<
		"started" | "complete" | undefined
	>(undefined);
	const { addToast } = useToast();

	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	const scrollToBottom = useCallback(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, []);

	const [loaded, setLoaded] = useState(false);
	const ffmpegRef = useRef(new FFmpeg());

	const load = useCallback(async () => {
		const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
		const ffmpeg = ffmpegRef.current;
		ffmpeg.on("log", ({ message }) => {
			console.log("ffmpeg", message);
		});
		// toBlobURL is used to bypass CORS issue, urls with the same
		// domain can be used directly.
		await ffmpeg.load({
			coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
			wasmURL: await toBlobURL(
				`${baseURL}/ffmpeg-core.wasm`,
				"application/wasm",
			),
		});

		console.log("ffmpeg loaded");
		setLoaded(true);
	}, []);

	useEffect(() => {
		const loadFFmpeg = async () => {
			await load();
		};

		loadFFmpeg();
	}, [load]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			setFile(e.target.files[0]);
		}
	};

	const splitAudio = useCallback(async (file: File) => {
		const ffmpeg = ffmpegRef.current;
		await ffmpeg.writeFile("input.mp3", await fetchFile(file));

		await ffmpeg.exec([
			"-i",
			"input.mp3",
			"-f",
			"segment",
			"-segment_time",
			"60",
			"-c",
			"copy",
			"output%03d.mp3",
		]);

		// Collect all output files
		const files = [];
		let index = 0;
		while (true) {
			try {
				const segment = await ffmpeg.readFile(
					`output${String(index).padStart(3, "0")}.mp3`,
				);
				files.push(new Blob([segment], { type: "audio/mp3" }));
				index++;
			} catch (e) {
				// Break when no more files are found
				break;
			}
		}

		console.log("split audios", files);
		return files;
	}, []);

	const handleSubmitSplitThenTranscribeAudio = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			if (!file) {
				alert("Please select a file first!");
				return;
			}

			setSegments([]); // Reset segments
			setChatId(uuidv4()); // Reset chat ID

			const audioSegments = await splitAudio(file);
			const filesFromSegments = audioSegments.map((segment) => {
				return new File([segment], `${uuidv4()}.mp3`, { type: "audio/mp3" });
			});

			setTranscribeStatus("started");
			let i = 0;
			for (const segment of filesFromSegments) {
				const formData = new FormData();
				formData.append("file", segment);

				const response = await fetch("/api/transcribe", {
					method: "POST",
					body: formData,
				});

				const text = await response.json();

				console.log("transcription", {
					len: `${i}/${filesFromSegments.length}`,
					text: text.transcription,
				});

				setSegments((prev) => {
					return [
						...prev,
						{
							segment: segment.name,
							text: text.transcription,
							percentage: prev.length / filesFromSegments.length,
						},
					];
				});

				i++;
			}

			setTranscribeStatus("complete");
		},
		[file, splitAudio],
	);

	const [percentage, setPercentage] = useState(0);

	const transcription = useMemo(() => {
		return segments.map((segment) => segment.text).join(" ");
	}, [segments]);

	useEffect(() => {
		if (segments.length === 0) {
			return;
		}

		const lastSegment = segments[segments.length - 1];
		if (lastSegment) {
			const p = lastSegment.percentage * 100;
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
		<NoSSRWrapper>
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
							disabled={!file || !loaded}
							className="btn btn-primary w-24"
						>
							{transcribeStatus === "started" ? (
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

				{transcribeStatus === "started" && segments.length > 0 && (
					<progress className="progress w-full" value={percentage} max="100" />
				)}

				<div
					className={`grid ${transcription && transcribeStatus && "grid-cols-2"} gap-5 h-[90vh]`}
				>
					<div className="prose w-full max-w-none p-4 rounded shadow-md border border-[var(--b1)] overflow-auto">
						<h3 className="flex items-center">
							Transcription:
							{transcription && (
								<div
									className="tooltip tooltip-bottom"
									data-tip="Copy to clipboard"
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

					{transcription && transcribeStatus && (
						<ChatMemo transcriptions={transcription} chatId={chatId} />
					)}
				</div>
				<ToastContainerMemo />
			</main>
		</NoSSRWrapper>
	);
}
