import openai from "@/app/lib/openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	const body = await req.json();

	const stream = openai.beta.chat.completions.stream({
		model: process.env.OPENAI_MODEL || "gpt-4o-mini",
		stream: true,
		messages: [
			{
				role: "system",
				content: "You are a helpful assistant.",
			},
			...body,
		],
	});

	const readableStream = stream.toReadableStream();

	return NextResponse.json(readableStream, {
		headers: {
			"Content-Type": "application/json",
		},
	});
}
