function AddBookForm({
  form,
  onChange,
  onSave,
  isSaving,
  saveError,
  saveSuccess,
}) {
  return (
    <form onSubmit={onSave} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-semibold text-ink-700">
          Title
        </label>
        <input
          id="title"
          name="title"
          value={form.title}
          onChange={onChange}
          required
          className="min-h-[44px] w-full rounded-xl border border-brand-100 px-3 text-base text-ink-700 outline-none focus:border-brand-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="author" className="mb-1 block text-sm font-semibold text-ink-700">
            Author
          </label>
          <input
            id="author"
            name="author"
            value={form.author}
            onChange={onChange}
            className="min-h-[44px] w-full rounded-xl border border-brand-100 px-3 text-base text-ink-700 outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label htmlFor="condition" className="mb-1 block text-sm font-semibold text-ink-700">
            Condition
          </label>
          <select
            id="condition"
            name="condition"
            value={form.condition}
            onChange={onChange}
            className="min-h-[44px] w-full rounded-xl border border-brand-100 px-3 text-base text-ink-700 outline-none focus:border-brand-500"
          >
            <option>Like New</option>
            <option>Very Good</option>
            <option>Good</option>
            <option>Fair</option>
            <option>Reading Copy</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="isbn" className="mb-1 block text-sm font-semibold text-ink-700">
            ISBN
          </label>
          <input
            id="isbn"
            name="isbn"
            value={form.isbn}
            onChange={onChange}
            className="min-h-[44px] w-full rounded-xl border border-brand-100 px-3 text-base text-ink-700 outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label htmlFor="publishedYear" className="mb-1 block text-sm font-semibold text-ink-700">
            Year
          </label>
          <input
            id="publishedYear"
            name="publishedYear"
            value={form.publishedYear}
            onChange={onChange}
            className="min-h-[44px] w-full rounded-xl border border-brand-100 px-3 text-base text-ink-700 outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="publisher" className="mb-1 block text-sm font-semibold text-ink-700">
          Publisher
        </label>
        <input
          id="publisher"
          name="publisher"
          value={form.publisher}
          onChange={onChange}
          className="min-h-[44px] w-full rounded-xl border border-brand-100 px-3 text-base text-ink-700 outline-none focus:border-brand-500"
        />
      </div>

      <div>
        <label htmlFor="coverImageUrl" className="mb-1 block text-sm font-semibold text-ink-700">
          Cover Image URL
        </label>
        <input
          id="coverImageUrl"
          name="coverImageUrl"
          value={form.coverImageUrl}
          onChange={onChange}
          className="min-h-[44px] w-full rounded-xl border border-brand-100 px-3 text-base text-ink-700 outline-none focus:border-brand-500"
        />
      </div>

      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-semibold text-ink-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={form.notes}
          onChange={onChange}
          className="w-full rounded-xl border border-brand-100 px-3 py-2 text-base text-ink-700 outline-none focus:border-brand-500"
        />
      </div>

      {saveError ? <p className="text-sm font-medium text-red-600">{saveError}</p> : null}
      {saveSuccess ? <p className="text-sm font-medium text-green-700">{saveSuccess}</p> : null}

      <button
        type="submit"
        disabled={isSaving}
        className="min-h-[44px] w-full rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-70"
      >
        {isSaving ? "Saving..." : "Add Book to Inventory"}
      </button>
    </form>
  );
}

export default AddBookForm;
