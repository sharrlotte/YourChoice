import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TaskStatus } from "@/app/generated/prisma";

const ITEMS_PER_PAGE = 10;

export async function GET(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
	const { projectId } = await params;
	const searchParams = request.nextUrl.searchParams;
	const statusParam = searchParams.get("status");
	const pageParam = searchParams.get("page");
	const limitParam = searchParams.get("limit");

	if (!statusParam) {
		return NextResponse.json({ error: "Status is required" }, { status: 400 });
	}

	// Validate status
	if (!Object.values(TaskStatus).includes(statusParam as TaskStatus)) {
		return NextResponse.json({ error: "Invalid status" }, { status: 400 });
	}
	const status = statusParam as TaskStatus;

	const page = parseInt(pageParam || "1");
	const limit = parseInt(limitParam || ITEMS_PER_PAGE.toString());

	if (limit > 100) {
		return NextResponse.json({ error: "Limit can not exceed 100" }, { status: 400 });
	}

	const skip = (page - 1) * limit;

	const session = await getSession();
	const userId = session?.user?.id;

	try {
		const whereClause = {
			projectId,
			status,
		};

		const tasks = await prisma.task.findMany({
			where: whereClause,
			include: {
				author: true,
				labels: true,
				_count: {
					select: {
						votes: true,
						comments: true,
					},
				},
				votes: {
					where: {
						userId: userId ?? "undefined",
						status: status,
					},
				},
			},
			orderBy: { index: "asc" },
			take: limit,
			skip,
		});

		const total = await prisma.task.count({
			where: whereClause,
		});

		return NextResponse.json({
			data: tasks,
			meta: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Error fetching tasks:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
