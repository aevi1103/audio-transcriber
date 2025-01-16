import React from "react";
import { ThemeController } from "./ThemeController";

export const Header = () => {
	return (
		<div className="pt-2 md:pt-2 lg:pt-10 flex flex-row justify-between align-middle">
			<div className="font-sans text-2xl lg:text-4xl font-bold">
				AI Audio Transcriber
			</div>

			<div className="hidden md:flex place-self-center">
				<ThemeController />
			</div>
		</div>
	);
};
