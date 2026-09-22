import { infiniteQueryOptions } from "@tanstack/react-query";
import type { AnnouncementsQueryResult } from "~/types";

export type AnnouncementsQueryParams = {
	priority: string;
	target: string;
};

export const announcementsQueryOptions = ({
	priority,
	target,
}: AnnouncementsQueryParams) =>
	infiniteQueryOptions({
		queryKey: ["announcements", priority, target],
		queryFn: async ({ pageParam }) => {
			const params = new URLSearchParams({
				page: String(pageParam),
				priority,
				target,
			});
			const response = await fetch(`/api/v1/announcements?${params}`);
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || "Failed to fetch announcements");
			}
			const data = await response.json();
			return data.body as AnnouncementsQueryResult;
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage) =>
			lastPage.meta.hasMore ? lastPage.meta.currentPage + 1 : undefined,
	});
