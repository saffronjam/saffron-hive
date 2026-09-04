<script lang="ts">
	import { goto } from "$app/navigation";
	import { getContextClient, queryStore, subscriptionStore } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { sessionTeardown } from "$lib/session";

	const CURRENT_GUEST = graphql(`
		query GuestSessionCurrent {
			currentGuest {
				id
				expiresAt
			}
		}
	`);

	const GUEST_CHANGED = graphql(`
		subscription GuestSessionChanged {
			guestChanged {
				kind
				guest {
					id
					expiresAt
				}
			}
		}
	`);

	const client = getContextClient();
	const current = queryStore({ client, query: CURRENT_GUEST, requestPolicy: "network-only" });
	const changes = subscriptionStore({ client, query: GUEST_CHANGED });
	let ending = false;
	let handledChange = "";
	let extendedExpiry = $state<string | null>(null);
	const expiresAt = $derived(extendedExpiry ?? $current.data?.currentGuest?.expiresAt ?? null);

	function endGuestSession() {
		if (ending) return;
		ending = true;
		sessionTeardown();
		void goto("/login?mode=guest&reason=unavailable", { replaceState: true });
	}

	$effect(() => {
		if ($current.error || (!$current.fetching && $current.data && !$current.data.currentGuest)) {
			endGuestSession();
		}
	});

	$effect(() => {
		const event = $changes.data?.guestChanged;
		if (!event) return;
		const signature = `${event.kind}:${event.guest?.expiresAt ?? ""}`;
		if (signature === handledChange) return;
		handledChange = signature;
		if (event.kind === "EXTENDED" && event.guest) {
			extendedExpiry = event.guest.expiresAt;
			return;
		}
		if (event.kind === "REVOKED" || event.kind === "EXPIRED") endGuestSession();
	});

	$effect(() => {
		const expiry = expiresAt;
		if (!expiry) return;
		const remaining = new Date(expiry).getTime() - Date.now();
		if (remaining <= 0) {
			endGuestSession();
			return;
		}
		const timer = setTimeout(endGuestSession, remaining);
		return () => clearTimeout(timer);
	});
</script>
