import openai from "@/app/lib/openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	const data = await req.formData();
	const file = data.get("file") as Blob | null;

	if (!file) {
		return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
	}

	try {
		const fileName = file instanceof File ? file.name : "audio";
		const fileExtension = fileName.split(".").pop() || "mp3"; // Default to mp3 if no extension
		const mimeType = file.type || `audio/${fileExtension}`;

		const fileBuffer = Buffer.from(await file.arrayBuffer());

		const transcribeFile = new File([fileBuffer], `audio.${fileExtension}`, {
			type: mimeType,
		});

		const response = await openai.audio.transcriptions.create({
			file: transcribeFile,
			model: "whisper-1",
		});

		return NextResponse.json({ transcription: response.text });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to transcribe audio" },
			{ status: 500 },
		);
	}
}
