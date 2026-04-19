export class HistoryStack<T> {
  stack = $state<T[]>([]);
  cursor = $state(-1);
  maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get canUndo(): boolean {
    return this.cursor > 0;
  }

  get canRedo(): boolean {
    return this.cursor < this.stack.length - 1;
  }

  get current(): T | null {
    return this.stack[this.cursor] ?? null;
  }

  push(snapshot: T) {
    this.stack = [...this.stack.slice(0, this.cursor + 1), snapshot];
    if (this.stack.length > this.maxSize) {
      this.stack = this.stack.slice(this.stack.length - this.maxSize);
    }
    this.cursor = this.stack.length - 1;
  }

  undo(): T | null {
    if (!this.canUndo) return null;
    this.cursor--;
    return this.current;
  }

  redo(): T | null {
    if (!this.canRedo) return null;
    this.cursor++;
    return this.current;
  }

  reset(initial: T) {
    this.stack = [initial];
    this.cursor = 0;
  }
}
