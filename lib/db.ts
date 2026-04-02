import type { Post, Task, Streak, Report, UserProfile } from "@/types";

type StoreState = {
  posts: Post[];
  tasks: Task[];
  streak: Streak[];
  reports: Report[];
  user: UserProfile[];
  counters: Record<string, number>;
};

type CollectionName = keyof Omit<StoreState, "counters">;

const STORAGE_KEY = "looksmaxx-local-db";

function assertBrowser() {
  if (typeof window === "undefined") {
    throw new Error("Local storage is only available in the browser");
  }
}

function initialState(): StoreState {
  return {
    posts: [],
    tasks: [],
    streak: [],
    reports: [],
    user: [],
    counters: {
      posts: 0,
      tasks: 0,
      streak: 0,
      reports: 0,
      user: 0,
    },
  };
}

function reviveDate<T extends { createdAt?: Date | string }>(item: T): T {
  if (!item.createdAt) return item;
  return { ...item, createdAt: new Date(item.createdAt) } as T;
}

function loadState(): StoreState {
  assertBrowser();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return initialState();

  const parsed = JSON.parse(raw) as StoreState;
  return {
    ...initialState(),
    ...parsed,
    posts: (parsed.posts ?? []).map((item) => reviveDate<Post>(item)),
    reports: (parsed.reports ?? []).map((item) => reviveDate<Report>(item)),
    user: (parsed.user ?? []).map((item) => reviveDate<UserProfile>(item)),
    tasks: parsed.tasks ?? [],
    streak: parsed.streak ?? [],
    counters: { ...initialState().counters, ...(parsed.counters ?? {}) },
  };
}

function saveState(state: StoreState) {
  assertBrowser();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function sortByField<T>(items: T[], field: keyof T, descending = false): T[] {
  const sorted = [...items].sort((a, b) => {
    const left = a[field] as unknown;
    const right = b[field] as unknown;

    const leftValue = left instanceof Date ? left.getTime() : left;
    const rightValue = right instanceof Date ? right.getTime() : right;

    if (leftValue == null && rightValue == null) return 0;
    if (leftValue == null) return -1;
    if (rightValue == null) return 1;
    if (leftValue < rightValue) return -1;
    if (leftValue > rightValue) return 1;
    return 0;
  });

  return descending ? sorted.reverse() : sorted;
}

class QueryResult<T> {
  constructor(private readonly items: T[]) {}

  async toArray(): Promise<T[]> {
    return [...this.items];
  }

  async last(): Promise<T | undefined> {
    return this.items[this.items.length - 1];
  }

  reverse() {
    return new QueryResult([...this.items].reverse());
  }
}

class LocalTable<T extends { id?: number }> {
  constructor(private readonly name: CollectionName) {}

  private getItems(state = loadState()): T[] {
    return [...(state[this.name] as unknown as T[])];
  }

  private setItems(items: T[]) {
    const state = loadState();
    (state as Record<string, unknown>)[this.name] = items;
    saveState(state);
  }

  async get(id: number): Promise<T | undefined> {
    return this.getItems().find((item) => item.id === id);
  }

  async add(item: Omit<T, "id"> | T): Promise<number> {
    const state = loadState();
    const nextId = (state.counters[this.name] ?? 0) + 1;
    state.counters[this.name] = nextId;

    const items = this.getItems(state);
    items.push({ ...(item as T), id: nextId });
    (state as Record<string, unknown>)[this.name] = items;
    saveState(state);
    return nextId;
  }

  async bulkAdd(items: Array<Omit<T, "id"> | T>, options?: { allKeys?: boolean }): Promise<number[]> {
    const ids: number[] = [];
    for (const item of items) {
      ids.push(await this.add(item));
    }
    return options?.allKeys ? ids : ids;
  }

  async bulkDelete(ids: number[]): Promise<void> {
    const idSet = new Set(ids);
    this.setItems(this.getItems().filter((item) => !idSet.has(item.id ?? -1)));
  }

  async update(id: number, changes: Partial<T>): Promise<void> {
    const items = this.getItems().map((item) =>
      item.id === id ? ({ ...item, ...changes } as T) : item
    );
    this.setItems(items);
  }

  async count(): Promise<number> {
    return this.getItems().length;
  }

  where<K extends keyof T>(field: K) {
    const items = this.getItems();
    return {
      equals: (value: T[K]) =>
        new QueryResult(items.filter((item) => item[field] === value)),
      anyOf: (values: T[K][]) => {
        const set = new Set(values);
        return new QueryResult(items.filter((item) => set.has(item[field])));
      },
    };
  }

  orderBy<K extends keyof T>(field: K) {
    return new QueryResult(sortByField(this.getItems(), field));
  }
}

class LocalDB {
  posts = new LocalTable<Post>("posts");
  tasks = new LocalTable<Task>("tasks");
  streak = new LocalTable<Streak>("streak");
  reports = new LocalTable<Report>("reports");
  user = new LocalTable<UserProfile>("user");
}

export const db = new LocalDB();
