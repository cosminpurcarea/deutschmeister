import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "deutschmeister-session-id";

/** Returns the persisted session UUID, creating and storing one on first call. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = uuidv4();
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
