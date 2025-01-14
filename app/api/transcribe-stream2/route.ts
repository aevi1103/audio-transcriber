import { initDB } from "@/app/lib/indexedDb";
import { init } from "next/dist/compiled/webpack/webpack";
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
		const fileNameOnly = fileName.replace(/\.[^/.]+$/, "");
		const mimeType = file.type || `audio/${fileExtension}`;

		return NextResponse.json({ message: "File uploaded successfully" });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to upload file" },
			{ status: 500 },
		);
	}
}
