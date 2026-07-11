// Rejecting stand-in for `@tauri-apps/api/core`'s invoke. The Result editing
// hooks are compiled verbatim from desktop but their affordances are disabled
// on the web (queryInfo reports nothing editable); this guards the paths that
// could still reach a commit.

export function invoke<T>(command: string, _args?: Record<string, unknown>): Promise<T> {
  return Promise.reject(new Error(`${command} isn't available in a shared session`));
}
