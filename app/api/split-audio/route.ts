import fs from "node:fs";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import { NextResponse } from "next/server";
import { v4 as uuidV4 } from "uuid";

export async function POST(req: Request) {
	try {
		const data = await req.formData();
		const file = data.get("file") as Blob | null;

		if (!file) {
			return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
		}

		const fileName = file instanceof File ? file.name : "audio";
		const fileExtension = fileName.split(".").pop() || "mp3"; // Default to mp3 if no extension
		const fileNameOnly = fileName.replace(/\.[^/.]+$/, "");
		const mimeType = file.type || `audio/${fileExtension}`;

		// Convert Blob to buffer
		const fileBuffer = Buffer.from(await file.arrayBuffer());

		// Define the directory path and ensure it exists
		const inputDirectoryPath = path.join(process.cwd(), "public", "input");
		if (!fs.existsSync(inputDirectoryPath)) {
			fs.mkdirSync(inputDirectoryPath, { recursive: true });
		}

		const id = uuidV4();
		const newFileName = `${fileNameOnly}_${id}`;

		// Define the file path
		const inputTempFilePath = path.join(
			inputDirectoryPath,
			`${newFileName}.${fileExtension}`,
		);

		// Write the file
		await fs.promises.writeFile(inputTempFilePath, fileBuffer);

		// Get the duration of the audio file in seconds
		const durationSeconds = await new Promise<number>((resolve, reject) => {
			ffmpeg.ffprobe(inputTempFilePath, (err, metadata) => {
				if (err) return reject(err);
				resolve(metadata.format.duration || 0);
			});
		});

		// Define paths for processing
		const outputDir = path.join(process.cwd(), "public", "output");
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		const outputFileName = newFileName.replace(/\.[^/.]+$/, "");
		const outputPattern = path.join(
			outputDir,
			`${outputFileName}_%03d.${fileExtension}`,
		);

		const splitAudio = async () => {
			return new Promise<{ segmentCount: number; segmentPaths: string[] }>(
				(resolve, reject) => {
					ffmpeg(inputTempFilePath)
						.format("mp3") // Adjust format as needed
						.outputOptions(["-f segment", "-segment_time 300", "-c copy"])
						.output(outputPattern)
						.on("end", () => {
							// Get the list of segment files
							const segmentFiles = fs
								.readdirSync(outputDir)
								.filter(
									(file) =>
										file.startsWith(outputFileName) &&
										file.endsWith(`.${fileExtension}`),
								);

							// Generate paths for segment files
							const segmentPaths = segmentFiles.map((file) =>
								path.join(outputDir, file),
							);

							// Count the number of segments created
							const segmentCount = segmentFiles.length;

							// Clean up the temporary file
							fs.unlinkSync(inputTempFilePath);

							resolve({ segmentCount, segmentPaths });
						})
						.on("error", (err) => {
							fs.unlinkSync(inputTempFilePath);
							reject(err);
						})
						.run();
				},
			);
		};

		// Use fluent-ffmpeg to process the file
		const { segmentCount, segmentPaths } = await splitAudio();

		return NextResponse.json({
			duration: durationSeconds * 1000,
			segmentCount,
			segmentPaths,
		});
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to process the audio file" },
			{ status: 500 },
		);
	}
}
