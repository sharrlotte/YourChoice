import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TaskStatus } from "@/app/generated/prisma";
import { formatErrorMessage } from "@/lib/errors";
import { logServerError } from "@/lib/logger";

const ITEMS_PER_PAGE = 10;

export async function GET(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
	try {
		const { projectId } = await params;
		if (!projectId) {
			return NextResponse.json({ success: false, error: "Project ID is required" }, { status: 400 });
		}

		const searchParams = request.nextUrl.searchParams;
		const statusParam = searchParams.get("status");
		const pageParam = searchParams.get("page");
		const limitParam = searchParams.get("limit");

		if (!statusParam) {
			return NextResponse.json({ success: false, error: "Status is required" }, { status: 400 });
		}

		if (!Object.values(TaskStatus).includes(statusParam as TaskStatus)) {
			return NextResponse.json({ success: false, error: "Invalid status parameter" }, { status: 400 });
		}
		const status = statusParam as TaskStatus;

		const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
		const limit = Math.min(100, Math.max(1, parseInt(limitParam || ITEMS_PER_PAGE.toString(), 10) || ITEMS_PER_PAGE));

		const skip = (page - 1) * limit;

		const session = await getSession();
		const userId = session?.user?.id;

		const whereClause = {
			projectId,
			status,
		};

		const [tasks, total] = await Promise.all([
			prisma.task.findMany({
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
			}),
			prisma.task.count({
				where: whereClause,
			}),
		]);

		return NextResponse.json({
			success: true,
			data: tasks,
			meta: {
				total,
				page,
				limit,
				totalPages: Math.max(1, Math.ceil(total / limit)),
			},
		});
	} catch (error) {
		logServerError("GET /api/v1/projects/[projectId]/tasks", error);
		const message = formatErrorMessage(error, "Internal Server Error");
		return NextResponse.json({ success: false, error: message }, { status: 500 });
	}
}

