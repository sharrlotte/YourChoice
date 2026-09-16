import type {
	Task as PrismaTask,
	User as PrismaUser,
	Label as PrismaLabel,
	Vote as PrismaVote,
	Comment as PrismaComment,
	Reaction as PrismaReaction,
	Project as PrismaProject,
} from "@/app/generated/prisma";

export const TaskStatus = {
	PENDING_SUGGESTION: "PENDING_SUGGESTION",
	ACCEPTED: "ACCEPTED",
	REJECTED: "REJECTED",
	IN_PROGRESS: "IN_PROGRESS",
	COMPLETED: "COMPLETED",
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const Role = {
	USER: "USER",
	DEVELOPER: "DEVELOPER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export type Task = PrismaTask;
export type User = PrismaUser;
export type Label = PrismaLabel;
export type Vote = PrismaVote;
export type Comment = PrismaComment;
export type Reaction = PrismaReaction;
export type Project = PrismaProject;

export type TaskWithRelations = Task & {
	author: User;
	labels: Label[];
	_count: {
		votes: number;
		comments: number;
	};
	votes?: Vote[]; // For current user vote check
};
