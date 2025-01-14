import { openDB } from "idb";
import { v4 as uuidv4 } from "uuid";

const DATABASE_NAME = "myDatabase";
const STORE_NAME = "fileStore";

// Initialize the IndexedDB
export const initDB = async () => {
	const db = await openDB(DATABASE_NAME, 1, {
		upgrade(db) {
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, {
					keyPath: "id",
					autoIncrement: true,
				});
			}
		},
	});
	return db;
};

// Save a file to the IndexedDB
export const saveFile = async (file: File) => {
	const db = await initDB();
	const tx = db.transaction(STORE_NAME, "readwrite");
	const store = tx.objectStore(STORE_NAME);

	const id = uuidv4();
	await store.add({ name: file.name, data: file, id });
	await tx.done;

	return id;
};

export const saveFiles = async (files: File[]) => {
	const db = await initDB();
	const tx = db.transaction(STORE_NAME, "readwrite");
	const store = tx.objectStore(STORE_NAME);

	const ids = await Promise.all(
		files.map(async (file) => {
			const id = uuidv4();
			await store.add({ name: file.name, data: file, id });
			return id;
		}),
	);
	await tx.done;

	return ids;
};

// Retrieve all files from the IndexedDB
export const getFiles = async () => {
	const db = await initDB();
	const tx = db.transaction(STORE_NAME, "readonly");
	const store = tx.objectStore(STORE_NAME);
	const files = await store.getAll();
	return files;
};

export const getFile = async (id: string) => {
	const db = await initDB();
	const tx = db.transaction(STORE_NAME, "readonly");
	const store = tx.objectStore(STORE_NAME);
	const file = await store.get(id);
	return file;
};
