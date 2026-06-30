import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";

export default function Modal({
  children,
  title,
  description,
  isOpen,
  setIsOpen,
  classname,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  classname?: string;
}) {
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={`rounded-md sm:max-w-lg overflow-auto ${classname}`}>
          <DialogHeader>
            <DialogTitle className={"truncate"}>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    </>
  );
}
