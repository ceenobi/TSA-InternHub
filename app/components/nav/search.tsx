import { RiCloseFill, RiLoaderFill, RiSearch2Line } from "@remixicon/react";
import { useRef } from "react";
import { Form, useNavigation, useSearchParams, useSubmit } from "react-router";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "../ui/input";

export default function Search({
  id,
  placeholder,
}: {
  id: string;
  placeholder?: string;
}) {
  const [searchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const navigation = useNavigation();
  const submit = useSubmit();
  const searching =
    navigation.location &&
    new URLSearchParams(navigation.location.search).has("query");
  const query = searchParams.get("query") || "";

  const debouncedSubmit = useDebouncedCallback((form: HTMLFormElement) => {
    const isFirstSearch = query === "";
    submit(form, {
      replace: !isFirstSearch,
    });
  }, 500);

  const handleQueryDelete = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    searchParams.delete("query");
    submit(searchParams);
  };

  return (
    <>
      <Form
        className="relative w-full bg-muted group border-white/20 rounded-sm transition-all duration-300 flex items-center"
        role="search"
        id={id}
        onChange={(event) => {
          debouncedSubmit(event.currentTarget);
        }}
      >
        {searching ? (
          <RiLoaderFill className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        ) : (
          <RiSearch2Line className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
        {query && (
          <RiCloseFill
            className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
            onClick={handleQueryDelete}
          />
        )}
        <Input
          placeholder={placeholder}
          name="query"
          aria-label="Search"
          defaultValue={query}
          ref={inputRef}
          className="rounded-md pl-8 placeholder:text-[14px] bg-inherit focus:ring-0 focus:border-muted focus:outline-0 focus:ring-offset-0"
          type="search"
        />
      </Form>
    </>
  );
}
