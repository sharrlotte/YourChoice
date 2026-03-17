import { useInfiniteQuery } from "@tanstack/react-query";
import { getComments } from "@/app/actions/comments";

export function useTaskComments(taskId: string) {
	return useInfiniteQuery({
		queryKey: ["comments", taskId],
		queryFn: async ({ pageParam }) => {
			const res = await getComments(taskId, pageParam as string | undefined);
			return res;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor,
	});
}
