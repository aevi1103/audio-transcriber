"use client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Chat } from "./components/Chat";

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
		<main className="grid grid-rows-[max-content_1fr] gap-5 p-5 h-screen">
			{/* <h4 className="font-sans text-2xl mt-4 text-center text-violet-500 font-bold">
				Simple Audio Transcriber
			</h4> */}

			<div className="flex justify-between align-top">
				<form onSubmit={handleSubmit} className="flex h-10 align-middle">
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
						disabled={!file || isPending}
						className="px-2 bg-violet-700 text-white rounded disabled:bg-violet-300"
					>
						{isPending ? "Transcribing..." : "Transcribe"}
					</button>
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
