import { useCallback, useEffect, useState } from "react";
import { create } from "zustand";

export interface Toast {
	id: number;
	type: "info" | "success" | "warning" | "error";
	message: string;
	duration?: number; // Optional duration in milliseconds
}

let toastId = 0;

export type ToastStore = {
	toasts: Toast[];
	addToast: (type: Toast["type"], message: string) => void;
	removeToast: (id: number) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
	toasts: [],
	addToast: (type, message, duration = 3000) => {
		// Default duration 3 seconds
		const id = toastId++;
		set((state) => ({
			toasts: [...state.toasts, { id, type, message, duration }],
		}));

		// Remove toast after the duration
		setTimeout(() => {
			set((state) => ({
				toasts: state.toasts.filter((toast) => toast.id !== id),
			}));
		}, duration);
	},
	removeToast: (id) => {
		set((state) => ({
			toasts: state.toasts.filter((toast) => toast.id !== id),
		}));
	},
}));

export function useToast() {
	const toasts = useToastStore((state) => state.toasts);
	const addToast = useToastStore((state) => state.addToast);
	const removeToast = useToastStore((state) => state.removeToast);

	useEffect(() => {
		console.log("useToast", { toasts });
	}, [toasts]);

	return {
		toasts,
		addToast,
		removeToast,
	};
}
