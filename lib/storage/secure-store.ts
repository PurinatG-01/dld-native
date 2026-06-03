import * as SecureStore from "expo-secure-store";

// expo-secure-store caps each stored value at 2048 bytes, but a Supabase
// session (access + refresh tokens + user object) routinely exceeds that.
// This adapter transparently splits a value into numbered chunks
// (`<key>.0`, `<key>.1`, …) and stores the chunk count under the base key.
// Tokens land in the OS keychain / keystore instead of plaintext AsyncStorage.
const CHUNK_SIZE = 2000;

async function getChunkCount(key: string): Promise<number | null> {
  const meta = await SecureStore.getItemAsync(key);
  if (meta === null) return null;
  const n = Number(meta);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function removeChunks(key: string): Promise<void> {
  const count = await getChunkCount(key);
  if (count === null) return;
  for (let i = 0; i < count; i++) {
    await SecureStore.deleteItemAsync(`${key}.${i}`);
  }
  await SecureStore.deleteItemAsync(key);
}

export const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const count = await getChunkCount(key);
    if (count === null) return null;
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(`${key}.${i}`);
      // A missing chunk means the value is corrupt/partial — treat as absent.
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join("");
  },

  setItem: async (key: string, value: string): Promise<void> => {
    // Drop any prior chunks first so a shorter value can't leave stale tails.
    await removeChunks(key);
    const count = Math.max(1, Math.ceil(value.length / CHUNK_SIZE));
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(
        `${key}.${i}`,
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
      );
    }
    await SecureStore.setItemAsync(key, String(count));
  },

  removeItem: async (key: string): Promise<void> => {
    await removeChunks(key);
  },
};
