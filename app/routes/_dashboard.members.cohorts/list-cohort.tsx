import { RiCloseLine, RiSearchLine, RiTeamLine } from "@remixicon/react";
import { useState } from "react";
import { Form, Link } from "react-router";
import { useDebouncedCallback } from "use-debounce";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import Modal from "~/components/ui/modal";
import NotFound from "~/components/ui/not-found";
import Paginate from "~/components/ui/paginate";
import { Separator } from "~/components/ui/separator";
import usePaginate from "~/hooks/usePaginate";
import { getOptimizedImageUrl } from "~/lib/cloudinary";
import { cohortStatusColor } from "~/lib/constants";
import { formatDate } from "~/lib/utils";
import type { CohortDataType, UsePaginateProps } from "~/types";

export default function ListCohort({
  cohorts,
  meta,
}: {
  cohorts: CohortDataType[];
  meta: UsePaginateProps;
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedCohort, setSelectedCohort] = useState<CohortDataType | null>(
    null,
  );
  const [searchValue, setSearchValue] = useState<string>("");
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

  const filteredMembers = selectedCohort?.members?.filter((member) =>
    member.name.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const debouncedSubmit = useDebouncedCallback((value: string) => {
    setSearchValue(value);
  }, 500);

  return (
    <div>
      {cohorts?.length === 0 ? (
        <NotFound
          title="No cohort found"
          message="Your cohort catalog is currently empty. Start by adding your first cohort."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3">
            {cohorts?.map((cohort, index) => (
              <div
                key={cohort._id}
                className="cursor-pointer group relative flex flex-col gap-4 p-3 rounded-md border border-border/60 bg-background hover:border-mainBlue/30 dark:hover:border-darkBlue/40 hover:shadow-sm dark:bg-muted/20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
                onClick={() => {
                  setSelectedCohort(cohort);
                  setIsOpen(true);
                }}
              >
                <div className="flex justify-between items-center">
                  <Badge className={cohortStatusColor(cohort.status)}>
                    {cohort.status}
                  </Badge>
                </div>
                <div
                  className="flex gap-2 items-center animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                  title={`View Cohort members`}
                >
                  <RiTeamLine size={20} />
                  <h1 className="dark:text-white">{cohort.cohort}</h1>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <p className="text-sm dark:text-white">
                    {cohort.members.length || 0}{" "}
                    <span className="text-xs text-gray-500">members</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Created{" "}
                    <span className="text-mainBlue dark:text-white">
                      {formatDate(cohort.createdAt)}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Paginate
            totalPages={totalPages}
            hasMore={hasMore}
            handlePageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            currentPage={currentPage}
            limit={pageLimit}
          />
          <Modal
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            title={selectedCohort?.cohort}
            description="See the members of this cohort."
          >
            <Separator />
            <div className="py-4 px-2 max-h-[70vh] overflow-y-auto space-y-4">
              <Form
                className="relative w-full bg-inherit rounded-sm group hover:border border-mainBlue dark:border-mainGold/40 transition-all duration-300 outline-none flex items-center ring-1 ring-mainDark/20"
                role="search"
              >
                <RiSearchLine className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                {searchValue && (
                  <RiCloseLine
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
                    onClick={() => setSearchValue("")}
                  />
                )}
                <Input
                  placeholder="Search members..."
                  value={searchValue}
                  onChange={(e) => debouncedSubmit(e.target.value)}
                  name="query"
                  aria-label="Search"
                  className="w-full rounded-sm pl-10 placeholder:text-[14px] border-none focus:ring-0 focus:outline-0 focus:ring-offset-0"
                  type="search"
                />
              </Form>
              {filteredMembers && filteredMembers.length > 0 ? (
                <>
                  {filteredMembers.map((member) => (
                    <Link
                      key={member._id}
                      className="my-4 flex justify-between items-center p-4 hover:bg-accent hover:rounded-md"
                      to={`/members/cohorts/${member._id}/${member.name.toLowerCase().replace(/\s+/g, "-")}/profile`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarImage
                            src={getOptimizedImageUrl(member.image, 40)}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm dark:text-white">
                            {member.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {searchValue
                    ? "No members match your search."
                    : "No members in this cohort."}
                </p>
              )}
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
