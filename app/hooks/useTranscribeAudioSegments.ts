import { useEffect, useMemo, useState } from "react";

type Segment = {
	segment: string;
	text: string;
	percentage: number;
};

export type TranscribeStatus = "started" | "complete" | undefined;

export const useTranscribeAudioSegments = () => {
	const [segments, setSegments] = useState<Array<Segment>>([]);
	const [status, setStatus] = useState<TranscribeStatus>(undefined);
	const [percentage, setPercentage] = useState(0);

	const transcribeAudiSegments = async (filesFromSegments: File[]) => {
		setSegments([]);
		setPercentage(0);
		setStatus("started");
		let i = 0;
		for (const segment of filesFromSegments) {
			const formData = new FormData();
			formData.append("file", segment);

			const response = await fetch("/api/transcribe", {
				method: "POST",
				body: formData,
			});

			const text = await response.json();

			setSegments((prev) => {
				const p = (prev.length + 1) / filesFromSegments.length;

				return [
					...prev,
					{
						segment: segment.name,
						text: text.transcription,
						percentage: p,
					},
				];
			});

			i++;
		}

		setStatus("complete");
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
			const p = Math.round(lastSegment.percentage * 100);
			setPercentage(p);
		}
	}, [segments]);

	return {
		transcribeAudiSegments,
		status,
		transcription,
		percentage,
	};
};
