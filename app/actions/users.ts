"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getUsers(page = 1, limit = 10) {
	const session = await getSession();

	if (!session || session.user.role !== "DEVELOPER") {
		throw new Error("Unauthorized");
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
		totalPages: Math.ceil(total / limit),
		currentPage: page,
	};
}

export async function getUserStats() {
	const session = await getSession();

	if (!session || session.user.role !== "DEVELOPER") {
		throw new Error("Unauthorized");
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

	// Group by day
	const stats: Record<string, number> = {};

	// Initialize last 30 days with 0
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
}
