export type TaskKey = "mystery" | "hunt" | "letters" | "quiz" | "leaderboard";
export type TaskAccess = { task: TaskKey; open: boolean };
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T = unknown>(path: string, method = "GET", data?: unknown): Promise<T> {
  const upload = data instanceof File;
  const response = await fetch("/api" + path, {
    method,
    credentials: "same-origin",
    headers:
      method === "GET"
        ? {}
        : {
            "X-Requested-With": "Dogdlol",
            "Content-Type": upload ? (data as File).type : "application/json",
          },
    body: data === undefined ? undefined : upload ? (data as File) : JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) throw new ApiError(response.status, body.error || "Хүсэлт амжилтгүй.");
  return body as T;
}
export type Person = { id: string; name: string; department: string };
export type Question = {
  id: string;
  question: string;
  answers: string[];
  correct?: number;
  explanation?: string;
  category: string;
  seconds: number;
  position?: number;
};
export type Scores = { mystery: number; gift: number; letters: number; quiz: number };
export type Gift = {
  id: string;
  label: string;
  clue: string;
  second_clue: string;
  status: string;
  note: string;
  assigned?: string | null;
  hasPhoto?: boolean;
  photo?: string | null;
};
export type Settings = {
  start_date: string;
  opening_time: string;
  friday_time: string;
  prepared: boolean;
  released?: boolean;
};
export type AppState = {
  me: Person & { username: string; role: "admin" | "employee" };
  settings: Settings;
  stage: number;
  access: TaskAccess[];
  released: boolean;
  scores: Scores;
  employees: Person[];
  community: number;
  partner: string | null;
  sent: { id: string; recipient: string; name: string; created: number }[];
  inbox: { id: string; created: number }[];
  gift: Gift | null;
  mystery: {
    id: string;
    position: number;
    chosen: string | null;
    correct: number | null;
    facts: string[];
  }[];
  draft: { message: string; recipient: string } | null;
};
export type LiveQuiz = {
  open: boolean;
  stage: "lobby" | "question" | "reveal" | "final";
  position: number;
  total: number;
  deadline: number;
  serverNow: number;
  question: Question | null;
  answer: number | null;
  players: number;
  answered: number;
  score: number;
};
export type AdminData = {
  access: TaskAccess[];
  settings: Settings;
  employees: (Person & { username: string; role: string; active: number; facts: string[] })[];
  gifts: Gift[];
  questions: Question[];
  quiz: LiveQuiz;
};
