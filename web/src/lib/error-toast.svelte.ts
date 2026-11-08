import { untrack } from "svelte";
import { toast } from "svelte-sonner";
import { graphqlErrorMessage } from "$lib/graphql-error";
import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";

/** Notify once for a reactive request failure, allowing another notification after recovery. */
export function watchErrorToast(
  message: () => string | null | undefined,
  retry?: () => void | Promise<void>,
) {
  let previous: string | null = null;
  function notify(current: string) {
    toast.error(current, {
      id: `request-error:${current}`,
      action: retry
        ? {
            label: m.common_try_again({}, locale.messageOptions()),
            onClick: () => {
              void retryFailed();
            },
          }
        : undefined,
    });
  }
  async function retryFailed() {
    try {
      await retry?.();
      const current = untrack(message);
      if (current) notify(current);
    } catch (error) {
      notify(graphqlErrorMessage(error));
    }
  }
  $effect(() => {
    const current = message() || null;
    if (current === previous) return;
    previous = current;
    if (current) notify(current);
  });
}
