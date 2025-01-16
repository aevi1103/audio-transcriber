import type React from "react";
import { useCallback, useState } from "react";
import type { TranscribeStatus } from "../hooks/useTranscribeAudioSegments";

export const AudioFileUploadForm = ({
	onTranscribe,
	percentage,
	status,
}: {
	onTranscribe: (file: File) => void;
	percentage: number;
	status: TranscribeStatus;
}) => {
	const [file, setFile] = useState<File | null>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			setFile(e.target.files[0]);
		}
	};

	const handleSubmitSplitThenTranscribeAudio = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			if (!file) {
				alert("Please select a file first!");
				return;
			}

			onTranscribe(file);
		},
		[file, onTranscribe],
	);

	return (
		<form
			onSubmit={handleSubmitSplitThenTranscribeAudio}
			className="flex gap-2 "
		>
			<input
				type="file"
				accept="audio/*"
				onChange={handleFileChange}
				placeholder="audio"
				className="file-input file-input-sm lg:file-input-lg"
			/>

			<button
				type="submit"
				disabled={!file}
				className="btn btn-primary btn-sm lg:btn-lg"
			>
				{status === "started" ? (
					<span>{percentage}% Transcribing...</span>
				) : (
					"Transcribe"
				)}
			</button>
		</form>
	);
};
