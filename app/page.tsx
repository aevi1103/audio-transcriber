"use client";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Chat } from "./components/Chat";
import { set } from "zod";

export default function Home() {
	const [file, setFile] = useState<File | null>(null);
	const [segments, setSegments] = useState<Array<{ segment: string; text: string }>>([]);


	const { mutateAsync: splitThenTranscribeAudio, isPending: scriptThenTranscribeAudioLoading } = useMutation({
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
				let segmentsData: Array<{ segment: string; text: string }> = [];

				while (reader) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					const parsedChunk = JSON.parse(chunk);

					segmentsData.push(parsedChunk);
					setSegments([...segmentsData]); // Update state with new segments

				}

				console.log("Final transcription segments:", segmentsData);
			} catch (error) {
				console.error(error);
				throw error;
			}
		}
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

		const formData = new FormData();
		formData.append("file", file);

		await splitThenTranscribeAudio(formData);
	};

	useEffect(() => {
		console.log({ segments });
	}, [segments]);

	const transcription = useMemo(() => {
		return segments.map((segment) => segment.text).join(" ");
	}, [segments]);

	const handleDownload = () => {
		if (!transcription) {
			alert("No transcription to download");
			return;
		}
		const downloadUrl = `/api/transcribe/download?text=${encodeURIComponent(transcription)}`;
		window.location.href = downloadUrl;
	};

	return (
		<main className="grid grid-rows-[max-content_1fr] gap-5 p-5 h-screen">
			{/* <h4 className="font-sans text-2xl mt-4 text-center text-violet-500 font-bold">
				Simple Audio Transcriber
			</h4> */}

			<div className="flex justify-between align-top">
				<form onSubmit={handleSubmitSplitThenTranscribeAudio} className="flex h-10 align-middle">
					<label className="flex gap-2 align-middle">
						<input
							type="file"
							accept="audio/*"
							onChange={handleFileChange}
							placeholder="audio"
							className="text-sm text-slate-500
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
						disabled={!file || scriptThenTranscribeAudioLoading}
						className="px-2 bg-violet-700 text-white rounded disabled:bg-violet-300 mr-2"
					>
						{scriptThenTranscribeAudioLoading ? "Transcribing..." : "Transcribe"}
					</button>


					<button disabled={!transcription} className="px-2 bg-violet-700 text-white rounded disabled:bg-violet-300" onClick={handleDownload}>Download</button>


				</form>

				<div className="font-sans text-2xl text-center text-violet-500 font-bold">
					Simple Audio Transcriber
				</div>
			</div>

			<div className={`grid ${transcription && "grid-cols-2"} gap-5 h-[90vh]`}>
				<div className="bg-gray-50 p-4 rounded shadow-md border overflow-auto border-violet-300">
					<p className="font-bold mb-2">Transcription:</p>
					<div className="text-sm overflow-auto">{transcription}</div>
				</div>

				{transcription && <Chat transcriptions={transcription} />}
			</div>
		</main>
	);
}
