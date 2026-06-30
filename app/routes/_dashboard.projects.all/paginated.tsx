import Paginate from "~/components/ui/paginate";
import usePaginate from "~/hooks/usePaginate";
import type { UsePaginateProps } from "~/types";



export default function Paginated({ meta }: { meta: UsePaginateProps }) {
  const {
    handlePageChange,
    handleLimitChange,
    totalPages,
    hasMore,
    currentPage,
    limit: pageLimit,
  } = usePaginate({
    totalPages: meta?.totalPages || 1,
    hasMore: meta?.hasMore || false,
    currentPage: meta?.currentPage || 1,
  });
  return (
    <Paginate
      totalPages={totalPages}
      hasMore={hasMore}
      handlePageChange={handlePageChange}
      onLimitChange={handleLimitChange}
      currentPage={currentPage}
      limit={pageLimit}
    />
  );
}