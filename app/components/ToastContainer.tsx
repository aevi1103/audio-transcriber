import React, { useCallback, useMemo } from "react";
import { type Toast, useToastStore } from "../hooks/useToast";

export function ToastContainer() {
	const toasts = useToastStore((state) => state.toasts);
	const removeToast = useToastStore((state) => state.removeToast);

	const getStatus = useCallback((type: Toast["type"]) => {
		switch (type) {
			case "info":
				return "alert-info";
			case "success":
				return "alert-success";
			case "warning":
				return "alert-warning";
			case "error":
				return "alert-error";
			default:
				return "";
		}
	}, []);

	return (
		<div className="toast toast-top toast-center z-50">
			{toasts.map((toast) => (
				<div key={toast.id} className={`alert ${getStatus(toast.type)}`}>
					<span>{toast.message}</span>
					<button
						className="btn btn-square btn-sm ml-2"
						onClick={() => removeToast(toast.id)}
						type="button"
					>
						✕
					</button>
				</div>
			))}
		</div>
	);
}

export const ToastContainerMemo = React.memo(ToastContainer);
