export class Queue<T> {
  constructor(private queue: T[] = []) {}
  pop() {
    const val = this.queue.shift();
    if (typeof val === 'undefined') throw new Error();
    return val;
  }
  push(val: T) {
    this.queue.push(val);
  }
  isEmpty() {
    return this.queue.length === 0;
  }
}
