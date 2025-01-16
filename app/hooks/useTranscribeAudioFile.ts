import { useSplitAudio } from "./useSplitAudio";
import { useTranscribeAudioSegments } from "./useTranscribeAudioSegments";

export const useTranscribeAudioFile = () => {
	const { splitAudio, convertBlobToFile, loaded } = useSplitAudio();
	const { status, transcribeAudiSegments, transcription, percentage } =
		useTranscribeAudioSegments();

	const transcribe = async (file: File | null) => {
		if (!file) {
			throw new Error("Please select a file first!");
		}

		if (!loaded) {
			throw new Error("FFmpeg not loaded!");
		}

		const audioSegments = await splitAudio(file);
		const filesFromSegments = convertBlobToFile(audioSegments);
		await transcribeAudiSegments(filesFromSegments);
	};

	return {
		transcription,
		percentage,
		status,
		transcribe,
	};
};
