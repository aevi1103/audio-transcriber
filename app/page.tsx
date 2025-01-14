"use client";
import Home from "./Home";
import NoSSRWrapper from "./NoSSRWrapper";

export default function Pagw() {
	return (
		<NoSSRWrapper>
			<Home />
		</NoSSRWrapper>
	);
}
