"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatErrorMessage } from "@/lib/errors";
import { logServerError } from "@/lib/logger";

export async function getUsers(page = 1, limit = 10) {
	try {
		const session = await getSession();

		if (!session || session.user.role !== "DEVELOPER") {
			throw new Error("Unauthorized: Developer access required");
		}
		const skip = (page - 1) * limit;

		const [users, total] = await Promise.all([
			prisma.user.findMany({
				skip,
				take: limit,
				orderBy: { createdAt: "desc" },
			}),
			prisma.user.count(),
		]);

		return {
			users,
			total,
			totalPages: Math.max(1, Math.ceil(total / limit)),
			currentPage: page,
		};
	} catch (error) {
		logServerError("getUsers", error, { page, limit });
		throw new Error(formatErrorMessage(error, "Failed to fetch users"));
	}
}

export async function getUserStats() {
	try {
		const session = await getSession();

		if (!session || session.user.role !== "DEVELOPER") {
			throw new Error("Unauthorized: Developer access required");
		}
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const users = await prisma.user.findMany({
			where: {
				createdAt: {
					gte: thirtyDaysAgo,
				},
			},
			select: {
				createdAt: true,
			},
		});

		const stats: Record<string, number> = {};

		for (let i = 0; i < 30; i++) {
			const date = new Date();
			date.setDate(date.getDate() - i);
			const dateString = date.toISOString().split("T")[0];
			stats[dateString] = 0;
		}

		users.forEach((user) => {
			const dateString = user.createdAt.toISOString().split("T")[0];
			if (stats[dateString] !== undefined) {
				stats[dateString]++;
			}
		});

		const chartData = Object.entries(stats)
			.map(([date, count]) => ({ date, count }))
			.sort((a, b) => a.date.localeCompare(b.date));

		return chartData;
	} catch (error) {
		logServerError("getUserStats", error);
		throw new Error(formatErrorMessage(error, "Failed to fetch user statistics"));
	}
}

