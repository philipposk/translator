import { createClient } from "./server";

// Returns the signed-in user's id, or null for anonymous requests.
export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// Owner-or-public read: owner-less rows are public demos.
export function canRead(ownerId: string | null, userId: string | null): boolean {
  return ownerId === null || ownerId === userId;
}

// Only the owner can write.
export function canWrite(ownerId: string | null, userId: string | null): boolean {
  return ownerId !== null && ownerId === userId;
}
