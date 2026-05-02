export type StateHistorySource =
  | { kind: "device"; id: string }
  | { kind: "room"; id: string; name: string }
  | { kind: "group"; id: string; name: string }
  | { kind: "apartment" };

export function sourceKey(s: StateHistorySource): string {
  switch (s.kind) {
    case "device":
      return `dev:${s.id}`;
    case "room":
      return `room:${s.id}`;
    case "group":
      return `group:${s.id}`;
    case "apartment":
      return "apt";
  }
}
