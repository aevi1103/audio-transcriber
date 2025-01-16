"use client";
import { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { AudioFileUploadForm } from "./components/AudioFileUploadForm";
import { Header } from "./components/Header";
import { TranscriptContainer } from "./components/TranscriptContainer";
import { useTranscribeAudioFile } from "./hooks/useTranscribeAudioFile";

export default function Home() {
	const [chatId, setChatId] = useState<string | undefined>(uuidv4());

	const { transcription, status, transcribe, percentage } =
		useTranscribeAudioFile();

	const onTranscribe = useCallback(
		async (file: File) => {
			setChatId(uuidv4()); // Reset chat ID
			await transcribe(file);
		},
		[transcribe],
	);

	return (
		<main className="container mx-auto p-3 min-h-screen">
			<Header />

			<div className="grid gap-2 mt-4 md:mt-5 lg:mt-10 ">
				<AudioFileUploadForm
					onTranscribe={onTranscribe}
					percentage={percentage}
					status={status}
				/>

				<TranscriptContainer
					transcription={transcription}
					status={status}
					chatId={chatId}
				/>
			</div>
		</main>
	);
}
