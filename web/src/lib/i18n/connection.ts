import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";

export interface ConnectionResult {
  success: boolean;
  code: string;
  diagnostic?: string | null;
}

export function connectionResultMessage(result: ConnectionResult): string {
  const options = locale.messageOptions();
  switch (result.code) {
    case "CONNECTED":
      return m.connection_connected({}, options);
    case "UNAVAILABLE":
      return m.connection_unavailable({}, options);
    case "UNCONFIGURED":
      return m.connection_unconfigured({}, options);
    case "AUTHENTICATION_FAILED":
      return m.connection_authentication_failed({}, options);
    case "TIMEOUT":
      return m.connection_timeout({}, options);
    case "TLS_FAILED":
      return m.connection_tls_failed({}, options);
    case "UNREACHABLE":
      return m.connection_unreachable({}, options);
    default:
      return m.connection_failed({}, options);
  }
}
