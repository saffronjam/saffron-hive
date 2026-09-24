interface HistoryActions {
  open: (roomId: string) => void;
  back: () => void;
}

/** Coordinates room selection with the compact drawer's shallow history entry. */
export class DashboardNavigation {
  selectedRoomId = $state<string | null>(null);
  private wide: boolean | null = null;
  private drawerRoomId: string | null = null;
  private awaitingBack = false;
  private preserveSelection = false;

  constructor(private history: HistoryActions) {}

  select(roomId: string | null) {
    if (this.selectedRoomId === roomId) return;
    this.selectedRoomId = roomId;
    if (!this.wide && roomId && !this.awaitingBack) this.history.open(roomId);
  }

  close() {
    this.selectedRoomId = null;
    this.dismiss(false);
  }

  private dismiss(preserveSelection: boolean) {
    if (this.awaitingBack || !this.drawerRoomId) return;
    this.awaitingBack = true;
    this.preserveSelection = preserveSelection;
    this.history.back();
  }

  synchronize(
    wide: boolean,
    drawerRoomId: string | null,
    roomIds: ReadonlySet<string>,
    hydrated: boolean,
  ) {
    this.drawerRoomId = drawerRoomId;
    if (hydrated && this.selectedRoomId && !roomIds.has(this.selectedRoomId)) {
      this.selectedRoomId = null;
    }
    if (this.awaitingBack) {
      if (drawerRoomId) return;
      this.awaitingBack = false;
      if (!this.preserveSelection) this.selectedRoomId = null;
      this.preserveSelection = false;
      this.wide = wide;
      if (!wide && this.selectedRoomId) this.history.open(this.selectedRoomId);
      return;
    }
    if (drawerRoomId && hydrated && !roomIds.has(drawerRoomId)) {
      this.selectedRoomId = null;
      this.dismiss(false);
      return;
    }
    const changed = this.wide !== null && this.wide !== wide;
    this.wide = wide;
    if (wide) {
      if (drawerRoomId) {
        this.selectedRoomId = drawerRoomId;
        this.dismiss(true);
      }
    } else if (changed && this.selectedRoomId && !drawerRoomId) {
      this.history.open(this.selectedRoomId);
    } else {
      this.selectedRoomId = drawerRoomId;
    }
  }
}
