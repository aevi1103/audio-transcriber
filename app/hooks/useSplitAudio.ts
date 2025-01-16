import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export const useSplitAudio = () => {
	const [loaded, setLoaded] = useState(false);
	const ffmpegRef = useRef(new FFmpeg());

	const load = useCallback(async () => {
		const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
		const ffmpeg = ffmpegRef.current;
		ffmpeg.on("log", ({ message }) => {
			console.log("ffmpeg", message);
		});
		// toBlobURL is used to bypass CORS issue, urls with the same
		// domain can be used directly.
		await ffmpeg.load({
			coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
			wasmURL: await toBlobURL(
				`${baseURL}/ffmpeg-core.wasm`,
				"application/wasm",
			),
		});

		console.log("ffmpeg loaded");
		setLoaded(true);
	}, []);

	useEffect(() => {
		const loadFFmpeg = async () => {
			await load();
		};

		loadFFmpeg();
	}, [load]);

	const splitAudio = useCallback(async (file: File) => {
		const ffmpeg = ffmpegRef.current;
		await ffmpeg.writeFile("input.mp3", await fetchFile(file));

		await ffmpeg.exec([
			"-i",
			"input.mp3",
			"-f",
			"segment",
			"-segment_time",
			"60",
			"-c",
			"copy",
			"output%03d.mp3",
		]);

		// Collect all output files
		const files = [];
		let index = 0;
		while (true) {
			try {
				const segment = await ffmpeg.readFile(
					`output${String(index).padStart(3, "0")}.mp3`,
				);
				files.push(new Blob([segment], { type: "audio/mp3" }));
				index++;
			} catch (e) {
				// Break when no more files are found
				break;
			}
		}

		return files;
	}, []);

	const convertBlobToFile = (audioSegments: Blob[]) => {
		const filesFromSegments = audioSegments.map((segment) => {
			return new File([segment], `${uuidv4()}.mp3`, { type: "audio/mp3" });
		});

		return filesFromSegments;
	};

	return { splitAudio, loaded, convertBlobToFile };
};
