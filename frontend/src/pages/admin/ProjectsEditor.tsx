import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { createProject, deleteProject, getProjects, updateProject } from "@/api/endpoints";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PageSpinner, ErrorNotice, EmptyState, LoadError } from "@/components/ui/Feedback";
import { apiErrorMessage } from "@/api/client";
import { slugify } from "@/lib/utils";
import { safeExternalUrl } from "@/lib/urls";
import type { Project } from "@/types";

const schema = z.object({
  title: z.string().min(1, "Required"),
  slug: z
    .string()
    .min(1, "Required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  summary: z.string(),
  description: z.string(),
  tech_stack: z.string(),
  github_url: z.string(),
  live_url: z.string(),
  dashboard_key: z.enum(["none", "lumpy", "janseva"]),
  cover_note: z.string(),
  featured: z.boolean(),
  sort_order: z.coerce.number(),
});

type FormValues = z.infer<typeof schema>;

function toFormValues(project?: Project): FormValues {
  return {
    title: project?.title ?? "",
    slug: project?.slug ?? "",
    summary: project?.summary ?? "",
    description: project?.description ?? "",
    tech_stack: project?.tech_stack.join(", ") ?? "",
    github_url: project?.github_url ?? "",
    live_url: project?.live_url ?? "",
    dashboard_key: project?.dashboard_key ?? "none",
    cover_note: project?.cover_note ?? "",
    featured: project?.featured ?? true,
    sort_order: project?.sort_order ?? 0,
  };
}

export default function ProjectsEditor() {
  const {
    data: projects,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({ queryKey: ["admin-projects"], queryFn: getProjects });
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Project | "new" | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["portfolio"] });
  }

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Project> }) => updateProject(id, payload),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: invalidate,
  });

  // A mutation keeps its error until the next attempt, so a failed create
  // otherwise showed its red banner on whichever form was opened next.
  function openEditor(next: Project | "new" | null) {
    createMutation.reset();
    updateMutation.reset();
    setEditing(next);
  }

  if (isLoading) return <PageSpinner />;

  // A failed *refresh* keeps the last good list, which is still editable.
  // Only a load that produced nothing has to stop the owner.
  const loadFailed = isError && projects === undefined;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-sm text-scope">Projects</p>
          <h1 className="mt-2 font-display text-3xl text-bone">Selected work</h1>
        </div>
        {!loadFailed && editing === null && (
          <Button size="sm" onClick={() => openEditor("new")}>
            <Plus className="h-4 w-4" /> Add project
          </Button>
        )}
      </div>

      {/* No editing while the list is unknown: an empty region reads as "I
          have no projects", which invites re-creating ones that still exist. */}
      {editing !== null ? (
        <ProjectForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? undefined : editing}
          onCancel={() => openEditor(null)}
          onSubmit={(values) => {
            const payload = { ...values, tech_stack: values.tech_stack.split(",").map((t) => t.trim()).filter(Boolean) };
            if (editing === "new") {
              createMutation.mutate(payload);
            } else {
              updateMutation.mutate({ id: editing.id, payload });
            }
          }}
          isSaving={createMutation.isPending || updateMutation.isPending}
          error={createMutation.error || updateMutation.error}
        />
      ) : loadFailed ? (
        <div className="mt-10">
          <LoadError message={apiErrorMessage(error)} onRetry={() => refetch()} isRetrying={isFetching} />
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-3">
          {isError && (
            <ErrorNotice message={`Showing the last loaded projects — couldn't refresh them. ${apiErrorMessage(error)}`} />
          )}
          {deleteMutation.isError && <ErrorNotice message={apiErrorMessage(deleteMutation.error)} />}
          {projects && projects.length === 0 && (
            <EmptyState title="No projects yet" description="Add your first project to show it on the homepage." />
          )}
          {projects?.map((project) => (
            <div key={project.id} className="flex items-center justify-between gap-4 border border-ink-700 px-5 py-4">
              <div>
                <p className="font-display text-base text-bone">{project.title}</p>
                <p className="font-mono text-xs text-bone-faint">/{project.slug}</p>
                {safeExternalUrl(project.live_url) && (
                  <a
                    href={safeExternalUrl(project.live_url) ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-scope transition-colors hover:text-scope-bright hover:underline"
                  >
                    Open saved live project <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => openEditor(project)} className="text-bone-dim hover:text-scope" aria-label={`Edit ${project.title}`}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  disabled={deleteMutation.isPending && deleteMutation.variables === project.id}
                  onClick={() => {
                    if (confirm(`Delete "${project.title}"? This can't be undone.`)) deleteMutation.mutate(project.id);
                  }}
                  className="text-bone-dim hover:text-danger disabled:opacity-50"
                  aria-label={`Delete ${project.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectForm({
  initial,
  onSubmit,
  onCancel,
  isSaving,
  error,
}: {
  initial?: Project;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  isSaving: boolean;
  error: unknown;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toFormValues(initial) });

  const title = watch("title");
  useEffect(() => {
    // The title only seeds the slug until the owner types one themselves.
    // Without the dirty check, going back to fix a typo in the title silently
    // replaced a hand-picked URL with the full slugified title.
    if (!initial && !dirtyFields.slug) setValue("slug", slugify(title || ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-10 flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField label="Title" {...register("title")} error={errors.title?.message} />
        <TextField label="Slug" {...register("slug")} error={errors.slug?.message} hint="Used in the project URL" />
      </div>
      <TextField label="Summary (one line, shown on the homepage card)" {...register("summary")} />
      <TextAreaField label="Full description" rows={5} {...register("description")} />
      <TextField label="Tech stack" hint="Comma-separated, e.g. Python, FastAPI, React" {...register("tech_stack")} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField label="GitHub URL" placeholder="https://github.com/username/repo" {...register("github_url")} />
        <TextField
          label="Live project URL"
          placeholder="https://example.com"
          hint="Optional external link, including the https:// prefix. When saved, visitors see a clickable Live project link beside this card and demo."
          {...register("live_url")}
        />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="dashboard_key" className="font-display text-sm font-medium text-bone-dim">
            Interactive demo (optional)
          </label>
          <select
            id="dashboard_key"
            {...register("dashboard_key")}
            className="w-full rounded-md border border-ink-600 bg-ink-900 px-3 py-2 text-bone focus-visible:border-scope focus-visible:outline-none"
          >
            <option value="none">None</option>
            <option value="lumpy">Lumpy Skin Disease detector</option>
            <option value="janseva">JanSeva Connect</option>
          </select>
        </div>
        <TextField label="Cover note" hint="Small label above the project title" {...register("cover_note")} />
        <TextField label="Sort order" type="number" {...register("sort_order")} />
      </div>
      <label className="flex items-center gap-2 text-sm text-bone-dim">
        <input type="checkbox" {...register("featured")} className="h-4 w-4 accent-scope" />
        Featured on homepage
      </label>

      <div className="mt-2 flex items-center gap-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save project"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {error !== null && error !== undefined && <ErrorNotice message={apiErrorMessage(error)} />}
    </form>
  );
}
