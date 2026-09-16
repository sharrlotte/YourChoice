import { Prisma } from "@/app/generated/prisma";
import { logServerError } from "./logger";

export type ActionResult<T = unknown> =
	| { success: true; data: T; error?: never }
	| { success: false; error: string; data?: never };

export function isRedirectError(error: unknown): boolean {
	if (typeof error !== "object" || error === null) return false;
	const err = error as { message?: string; digest?: string };
	return (
		err.message === "NEXT_REDIRECT" ||
		(typeof err.digest === "string" && err.digest.startsWith("NEXT_REDIRECT"))
	);
}

export function isNotFoundError(error: unknown): boolean {
	if (typeof error !== "object" || error === null) return false;
	const err = error as { message?: string; digest?: string };
	return (
		err.message === "NEXT_NOT_FOUND" ||
		(typeof err.digest === "string" && err.digest.startsWith("NEXT_NOT_FOUND"))
	);
}

export function handlePrismaError(error: unknown, fallbackMessage = "A database error occurred."): string {
	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		switch (error.code) {
			case "P2002": {
				const target = (error.meta?.target as string[])?.join(", ") || "field";
				return `A record with this ${target} already exists.`;
			}
			case "P2025": {
				return (error.meta?.cause as string) || "The requested record was not found.";
			}
			case "P2003": {
				const field = (error.meta?.field_name as string) || "referenced record";
				return `Operation failed because the related ${field} does not exist.`;
			}
			case "P1000":
				return "Authentication failed against database server. Please check credentials.";
			case "P1001":
				return "Cannot connect to database. Please check your network connection.";
			case "P1002":
				return "Database server connection timed out.";
			case "P1008":
				return "Database operation timed out.";
			case "P2000":
				return "The provided value is too long for the database field.";
			case "P2001":
				return "The record searched for does not exist.";
			case "P2005":
				return "The value stored in the database is invalid for the field type.";
			case "P2006":
				return "The provided value is not valid for the field type.";
			case "P2011":
				return "Null constraint violation on required field.";
			case "P2014":
				return "The change you are trying to make would violate the required relation.";
			default:
				return `Database error (${error.code}). Please try again later.`;
		}
	}

	if (error instanceof Prisma.PrismaClientInitializationError) {
		return "Failed to initialize database connection. Please check database configuration.";
	}

	if (error instanceof Prisma.PrismaClientValidationError) {
		return "Invalid database query parameters provided.";
	}

	if (error instanceof Prisma.PrismaClientRustPanicError) {
		return "Critical database engine error. Please reload the page.";
	}

	if (error instanceof Prisma.PrismaClientUnknownRequestError) {
		return "An unexpected database error occurred.";
	}

	if (error instanceof Error && error.message) {
		return error.message;
	}

	if (typeof error === "string") {
		return error;
	}

	return fallbackMessage;
}

export function formatErrorMessage(error: unknown, fallbackMessage = "An unexpected error occurred."): string {
	if (isRedirectError(error) || isNotFoundError(error)) {
		throw error;
	}

	if (
		error instanceof Prisma.PrismaClientKnownRequestError ||
		error instanceof Prisma.PrismaClientInitializationError ||
		error instanceof Prisma.PrismaClientValidationError ||
		error instanceof Prisma.PrismaClientRustPanicError ||
		error instanceof Prisma.PrismaClientUnknownRequestError
	) {
		return handlePrismaError(error, fallbackMessage);
	}

	if (error instanceof Error && error.message) {
		return error.message;
	}

	if (typeof error === "string") {
		return error;
	}

	return fallbackMessage;
}

export function actionSuccess<T>(data: T): ActionResult<T> {
	return { success: true, data };
}

export function actionError(
	context: string,
	error: unknown,
	fallbackMessage = "Operation failed"
): ActionResult<never> {
	if (isRedirectError(error) || isNotFoundError(error)) {
		throw error;
	}

	logServerError(context, error);
	const message = formatErrorMessage(error, fallbackMessage);
	return { success: false, error: message };
}
