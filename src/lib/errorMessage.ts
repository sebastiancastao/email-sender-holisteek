// Los errores de Supabase (PostgrestError, StorageError) son objetos planos,
// no instancias de Error, así que `err instanceof Error` los deja fuera y
// `String(err)` termina imprimiendo "[object Object]". Este helper cubre
// ambos casos para poder mostrar mensajes de error útiles.
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}
