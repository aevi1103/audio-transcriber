import type React from "react";

export const Transcript = ({
	transcription,
}: {
	transcription: string;
}) => {
	return (
		<div
			className="prose w-full max-w-none p-4 lg:p-10 rounded-xl
		 text-white bg-neutral overflow-auto min-h-[30svh]"
		>
			<h3 className="flex items-center text-primary">Transcription:</h3>
			<article className="h-full">{transcription}</article>
		</div>
	);
};
