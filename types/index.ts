import { Task, User, Label, Vote, Comment, Reaction } from "@prisma/client";

export type TaskWithRelations = Task & {
  author: User;
  labels: Label[];
  _count: {
    votes: number;
    comments: number;
  };
  votes?: Vote[]; // For current user vote check
};
