import { RiBookOpenFill, RiCloseFill, RiSearch2Line } from "@remixicon/react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useDebouncedCallback } from "use-debounce";
import { PageSection, PageWrapper } from "~/components/provider/page-wrapper";
import Modal from "~/components/ui/modal";
import {
  helpdeskKnowledgeBase as articles,
  type KnowledgeBaseArticle,
} from "~/lib/knowledge-base";
import type { Route } from "./+types/route";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Knowledge Base Guide - Get information" },
    {
      name: "description",
      content: `See information on how to get thebest out of TSA InternHub`,
    },
  ];
}

export default function KnowledgeBase() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("query") || "";
  const [inputValue, setInputValue] = useState(urlQuery);
  const [selectedArticle, setSelectedArticle] =
    useState<KnowledgeBaseArticle | null>(null);

  const debouncedSubmit = useDebouncedCallback((value: string) => {
    setInputValue(value);
    if (value) {
      setSearchParams({ query: value }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, 500);

  const categories = useMemo(() => {
    const map = new Map<string, KnowledgeBaseArticle[]>();
    for (const article of articles) {
      const existing = map.get(article.category) || [];
      existing.push(article);
      map.set(article.category, existing);
    }
    return Array.from(map.entries());
  }, []);

  const query = inputValue;
  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.keywords.some((k) => k.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <PageWrapper>
      <PageSection index={0} className="container mx-auto mt-10 space-y-10">
        {/* Hero */}
        <div className="max-w-lg mx-auto flex flex-col gap-4 justify-center items-center text-center">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
            How may we help?
          </h1>
          <div className="relative w-full">
            <RiSearch2Line className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Search guide…"
              value={inputValue}
              onChange={(e) => debouncedSubmit(e.target.value)}
              className="w-full h-10 pl-10 pr-9 rounded-md border border-border bg-card text-sm outline-none focus:border-mainBlue/50 dark:focus:border-darkBlue/50 transition-colors"
            />
            {inputValue && (
              <button
                onClick={() => setInputValue("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <RiCloseFill size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {filtered !== null && (
          <section>
            <p className="text-sm text-muted-foreground mb-4">
              {filtered.length === 0
                ? "No results found. Try a different search term."
                : `Showing ${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${query}"`}
            </p>
            {filtered.length > 0 && (
              <div className="flex flex-col gap-2">
                {filtered.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onClick={setSelectedArticle}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Category Sections */}
        {filtered === null &&
          categories.map(([category, categoryArticles]) => (
            <section key={category} className="max-w-3xl mx-auto">
              <h2 className="text-lg font-semibold tracking-tight mb-4 flex items-center gap-2">
                <RiBookOpenFill
                  size={18}
                  className="text-mainBlue dark:text-darkBlue"
                />
                {category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoryArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onClick={setSelectedArticle}
                  />
                ))}
              </div>
            </section>
          ))}
      </PageSection>

      {/* Article Detail Modal */}
      <Modal
        title={selectedArticle?.title}
        isOpen={!!selectedArticle}
        setIsOpen={(open) => {
          if (!open) setSelectedArticle(null);
        }}
        classname="sm:max-w-2xl max-h-[85dvh]"
      >
        {selectedArticle && (
          <div className="max-h-[60dvh] overflow-y-auto pr-1 space-y-4">
            <span className="material-symbols-outlined text-[40px] text-mainBlue dark:text-darkBlue">
              {selectedArticle.icon}
            </span>
            {selectedArticle.content.split("\n").map((line, i) => {
              if (line.startsWith("### ")) {
                return (
                  <h3
                    key={i}
                    className="text-base font-semibold text-foreground mt-5 mb-2"
                  >
                    {line.replace("### ", "")}
                  </h3>
                );
              }
              if (line.startsWith("## ")) {
                return (
                  <h2
                    key={i}
                    className="text-lg font-bold text-foreground mt-6 mb-2"
                  >
                    {line.replace("## ", "")}
                  </h2>
                );
              }
              if (line.startsWith("- ")) {
                const text = line
                  .replace(/^- \*\*/, "")
                  .replace(/\*\* — /, " — ");
                return (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground ml-4 list-disc"
                  >
                    {text}
                  </li>
                );
              }
              if (/^\d+\. /.test(line)) {
                const text = line.replace(/^\d+\. /, "");
                return (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground ml-4 list-decimal"
                  >
                    {text}
                  </li>
                );
              }
              if (line.trim() === "") {
                return <div key={i} className="h-2" />;
              }
              return (
                <p
                  key={i}
                  className="text-sm text-muted-foreground leading-relaxed"
                >
                  {line}
                </p>
              );
            })}
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}

function ArticleCard({
  article,
  onClick,
}: {
  article: KnowledgeBaseArticle;
  onClick: (a: KnowledgeBaseArticle) => void;
}) {
  return (
    <button
      onClick={() => onClick(article)}
      className="flex items-start gap-3 p-4 rounded-sm border bg-card dark:bg-muted/30 hover:border-mainBlue/30 dark:hover:border-darkBlue/40 hover:shadow-sm transition-[border-color,box-shadow] text-left w-full"
    >
      <span className="material-symbols-outlined text-[24px] text-mainBlue dark:text-darkBlue shrink-0 mt-0.5">
        {article.icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {article.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {article.content
            .split("\n")
            .find((l) => l.startsWith("## "))
            ?.replace("## ", "") || "Learn more about this topic"}
        </p>
      </div>
    </button>
  );
}
