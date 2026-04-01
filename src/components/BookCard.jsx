import { BookOpenText, Calendar, UserRound } from "lucide-react";

function BookCard({ book }) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <div className="flex gap-3">
        <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-page-200">
          {book.coverImageUrl ? (
            <img src={book.coverImageUrl} alt={book.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-brand-500">
              <BookOpenText className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold tracking-tight text-ink-700">{book.title}</h3>
          <p className="mt-1 flex items-center gap-2 text-sm text-ink-600">
            <UserRound className="h-4 w-4" />
            {book.author || "Unknown author"}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-ink-600">
            <Calendar className="h-4 w-4" />
            {book.publishedYear || "Year n/a"} • {book.condition}
          </p>
          {book.isbn ? <p className="mt-2 text-xs font-medium text-brand-700">ISBN: {book.isbn}</p> : null}
        </div>
      </div>
    </article>
  );
}

export default BookCard;
