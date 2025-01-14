import dynamic from "next/dynamic";
import React from "react";
interface NoSSRWrapperProps {
	children: React.ReactNode;
}

const NoSSRWrapper: React.FC<NoSSRWrapperProps> = (props) => (
	// biome-ignore lint/complexity/noUselessFragments: <explanation>
	<React.Fragment>{props.children}</React.Fragment>
);
export default dynamic(() => Promise.resolve(NoSSRWrapper), {
	ssr: false,
});
