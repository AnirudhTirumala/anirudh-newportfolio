import { Fragment, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Tag, Trash2 } from "lucide-react";
import {
  createSkill,
  createSkillCategory,
  deleteSkill,
  deleteSkillCategory,
  getSkillCategories,
  updateSkill,
} from "@/api/endpoints";
import { apiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { PageSpinner, EmptyState, ErrorNotice, LoadError } from "@/components/ui/Feedback";

export default function SkillsEditor() {
  const {
    data: categories,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({ queryKey: ["admin-skills"], queryFn: getSkillCategories });
  const queryClient = useQueryClient();
  const [newCategory, setNewCategory] = useState("");
  const [newSkillByCategory, setNewSkillByCategory] = useState<Record<number, string>>({});
  const [newUsedInByCategory, setNewUsedInByCategory] = useState<Record<number, string>>({});
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
  const [usedInDraft, setUsedInDraft] = useState("");

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-skills"] });
    queryClient.invalidateQueries({ queryKey: ["portfolio"] });
  }

  const addCategory = useMutation({
    mutationFn: (name: string) => createSkillCategory(name, categories?.length ?? 0),
    onSuccess: () => {
      invalidate();
      setNewCategory("");
    },
  });
  const removeCategory = useMutation({ mutationFn: deleteSkillCategory, onSuccess: invalidate });
  const addSkill = useMutation({
    mutationFn: ({
      name,
      categoryId,
      sortOrder,
      usedIn,
    }: {
      name: string;
      categoryId: number;
      sortOrder: number;
      usedIn: string[];
    }) => createSkill(name, categoryId, sortOrder, usedIn),
    onSuccess: (_skill, variables) => {
      invalidate();
      // Clearing these on submit rather than on success read as a successful
      // add even when the request failed, and took the typed name with it.
      setNewSkillByCategory((prev) => ({ ...prev, [variables.categoryId]: "" }));
      setNewUsedInByCategory((prev) => ({ ...prev, [variables.categoryId]: "" }));
    },
  });
  const removeSkill = useMutation({ mutationFn: deleteSkill, onSuccess: invalidate });
  const saveUsedIn = useMutation({
    mutationFn: ({ id, usedIn }: { id: number; usedIn: string[] }) => updateSkill(id, { used_in: usedIn }),
    onSuccess: () => {
      invalidate();
      setEditingSkillId(null);
    },
  });

  if (isLoading) return <PageSpinner />;

  function submitCategory(e: FormEvent) {
    e.preventDefault();
    if (newCategory.trim()) addCategory.mutate(newCategory.trim());
  }

  function parseUsedIn(raw: string): string[] {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return (
    <div className="max-w-3xl">
      <p className="font-display text-sm text-scope">Skills</p>
      <h1 className="mt-2 font-display text-3xl text-bone">Capabilities</h1>
      <p className="mt-2 max-w-lg text-sm text-bone-dim">
        Click a skill's name (the tag icon) to set which projects it shows as "used in" on the public site — comma-separate
        multiple, or use a short note like "Coursework" for anything not tied to a featured project.
      </p>

      {/* Nothing here is editable until the categories are actually known:
          adding to a list you cannot see produces duplicates. A failed
          refresh still leaves the last good list, so it only gets a notice. */}
      {isError && categories === undefined ? (
        <div className="mt-10">
          <LoadError message={apiErrorMessage(error)} onRetry={() => refetch()} isRetrying={isFetching} />
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-8">
          {isError && (
            <ErrorNotice message={`Showing the last loaded skills — couldn't refresh them. ${apiErrorMessage(error)}`} />
          )}
          {categories && categories.length === 0 && (
            <EmptyState title="No skill categories yet" description="Add one below to get started." />
          )}

          {categories?.map((category) => (
            <div key={category.id} className="border border-ink-700 p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg text-bone">{category.name}</h2>
                <button
                  disabled={removeCategory.isPending && removeCategory.variables === category.id}
                  onClick={() => {
                    if (
                      confirm(
                        `Delete the "${category.name}" category and its ${category.skills.length} skill(s)? This can't be undone.`,
                      )
                    ) {
                      removeCategory.mutate(category.id);
                    }
                  }}
                  className="text-bone-faint hover:text-danger disabled:opacity-50"
                  aria-label={`Delete ${category.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {removeCategory.isError && removeCategory.variables === category.id && (
                <div className="mt-3">
                  <ErrorNotice message={apiErrorMessage(removeCategory.error)} />
                </div>
              )}

              <ul className="mt-4 flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <Fragment key={skill.id}>
                    <li
                      className={`flex items-center gap-1.5 border px-2.5 py-1 text-sm text-bone-dim ${
                        skill.used_in.length > 0 ? "border-scope/40" : "border-ink-600"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (editingSkillId === skill.id) {
                            setEditingSkillId(null);
                            return;
                          }
                          setEditingSkillId(skill.id);
                          setUsedInDraft(skill.used_in.join(", "));
                        }}
                        className="flex items-center gap-1.5 hover:text-scope"
                        title="Edit where this skill was used"
                      >
                        <Tag className="h-3 w-3 shrink-0 text-bone-faint" />
                        {skill.name}
                      </button>
                      <button
                        type="button"
                        disabled={removeSkill.isPending && removeSkill.variables === skill.id}
                        onClick={() => {
                          if (confirm(`Remove "${skill.name}" from ${category.name}?`)) removeSkill.mutate(skill.id);
                        }}
                        aria-label={`Remove ${skill.name}`}
                        className="text-bone-faint hover:text-danger disabled:opacity-50"
                      >
                        ×
                      </button>
                    </li>

                    {editingSkillId === skill.id && (
                      <li className="w-full basis-full">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            saveUsedIn.mutate({ id: skill.id, usedIn: parseUsedIn(usedInDraft) });
                          }}
                          className="flex flex-wrap items-center gap-2 rounded-md border border-scope/30 bg-ink-950 p-3"
                        >
                          <label htmlFor={`used-in-${skill.id}`} className="w-full font-mono text-[0.65rem] uppercase tracking-wider text-bone-faint">
                            Used in — project titles or a short note, comma-separated
                          </label>
                          <input
                            id={`used-in-${skill.id}`}
                            value={usedInDraft}
                            onChange={(e) => setUsedInDraft(e.target.value)}
                            placeholder="JanSeva Connect, Lumpy Skin Disease Detection AI"
                            className="min-w-[240px] flex-1 rounded-md border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-bone placeholder:text-bone-faint focus-visible:border-scope focus-visible:outline-none"
                          />
                          <Button type="submit" size="sm" disabled={saveUsedIn.isPending}>
                            {saveUsedIn.isPending ? "Saving…" : "Save"}
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => setEditingSkillId(null)}>
                            Cancel
                          </Button>
                          {saveUsedIn.isError && saveUsedIn.variables?.id === skill.id && (
                            <div className="w-full">
                              <ErrorNotice message={apiErrorMessage(saveUsedIn.error)} />
                            </div>
                          )}
                        </form>
                      </li>
                    )}
                  </Fragment>
                ))}
              </ul>

              {removeSkill.isError && category.skills.some((skill) => skill.id === removeSkill.variables) && (
                <div className="mt-3">
                  <ErrorNotice message={apiErrorMessage(removeSkill.error)} />
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const name = newSkillByCategory[category.id]?.trim();
                  if (name) {
                    addSkill.mutate({
                      name,
                      categoryId: category.id,
                      // A hardcoded 0 tied every new skill with the first one
                      // in its category, so it landed at the front of the
                      // public list in whatever order the database chose.
                      sortOrder: category.skills.length,
                      usedIn: parseUsedIn(newUsedInByCategory[category.id] ?? ""),
                    });
                  }
                }}
                className="mt-4 flex flex-wrap gap-2"
              >
                <input
                  value={newSkillByCategory[category.id] ?? ""}
                  onChange={(e) => setNewSkillByCategory((prev) => ({ ...prev, [category.id]: e.target.value }))}
                  placeholder="Add a skill…"
                  required
                  aria-label={`New skill name for ${category.name}`}
                  className="min-w-[160px] flex-1 rounded-md border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-bone placeholder:text-bone-faint focus-visible:border-scope focus-visible:outline-none"
                />
                <input
                  value={newUsedInByCategory[category.id] ?? ""}
                  onChange={(e) => setNewUsedInByCategory((prev) => ({ ...prev, [category.id]: e.target.value }))}
                  placeholder="Used in (optional)…"
                  aria-label={`Where the new ${category.name} skill was used (optional)`}
                  className="min-w-[160px] flex-1 rounded-md border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-bone placeholder:text-bone-faint focus-visible:border-scope focus-visible:outline-none"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  disabled={addSkill.isPending && addSkill.variables?.categoryId === category.id}
                  aria-label={`Add a skill to ${category.name}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </form>

              {addSkill.isError && addSkill.variables?.categoryId === category.id && (
                <div className="mt-3">
                  <ErrorNotice message={apiErrorMessage(addSkill.error)} />
                </div>
              )}
            </div>
          ))}

          <div className="flex flex-col gap-3">
            <form onSubmit={submitCategory} className="flex gap-2 border border-dashed border-ink-600 p-4">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name…"
                required
                aria-label="New category name"
                className="flex-1 rounded-md border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-bone placeholder:text-bone-faint focus-visible:border-scope focus-visible:outline-none"
              />
              <Button type="submit" size="sm" disabled={addCategory.isPending}>
                <Plus className="h-4 w-4" /> {addCategory.isPending ? "Adding…" : "Add category"}
              </Button>
            </form>
            {addCategory.isError && <ErrorNotice message={apiErrorMessage(addCategory.error)} />}
          </div>
        </div>
      )}
    </div>
  );
}
