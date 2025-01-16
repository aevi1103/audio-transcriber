import React, { useRef } from "react";
import type { TranscribeStatus } from "../hooks/useTranscribeAudioSegments";
import { ChatMemo } from "./Chat";
import { Transcript } from "./Transcript";

export const TranscriptContainer = ({
	transcription,
	status,
	chatId,
}: {
	transcription: string;
	status: TranscribeStatus;
	chatId: string | undefined;
}) => {
	return (
		<div>
			<Transcript transcription={transcription} />

			{/* {transcription && status && (
				<ChatMemo transcriptions={transcription} chatId={chatId} />
			)} */}
		</div>
	);
};
