import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createExperience, deleteExperience, getExperiences, updateExperience } from "@/api/endpoints";
import { apiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { EmptyState, ErrorNotice, LoadError, PageSpinner } from "@/components/ui/Feedback";
import type { Experience, ExperienceInput } from "@/types";

type ExperienceFormValues = Omit<ExperienceInput, "highlights"> & { highlights: string };

const MAX_HIGHLIGHTS = 8;

const EMPTY_EXPERIENCE: ExperienceFormValues = {
  company: "",
  role: "",
  location: "",
  start_date: "",
  end_date: "",
  current: false,
  description: "",
  highlights: "",
  sort_order: 0,
};

function toFormValues(experience?: Experience): ExperienceFormValues {
  return experience ? { ...experience, highlights: experience.highlights.join("\n") } : EMPTY_EXPERIENCE;
}

/**
 * One point per line, exactly as the field's hint promises.
 *
 * This used to fall back to splitting on commas whenever the textarea held no
 * newline, which shredded a single legitimate point ("Trained YOLOv8, YOLOv11
 * and RT-DETR models") into three bullets. Any saved entry with one highlight
 * round-trips through the form newline-free, so that fallback also split
 * existing content apart on an unrelated edit.
 */
function splitHighlights(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
}

function toPayload(values: ExperienceFormValues): ExperienceInput {
  return { ...values, highlights: splitHighlights(values.highlights) };
}

export default function ExperienceEditor() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-experiences"],
    queryFn: getExperiences,
  });
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Experience | "new" | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-experiences"] });
    queryClient.invalidateQueries({ queryKey: ["portfolio"] });
  }

  const createMutation = useMutation({
    mutationFn: createExperience,
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ExperienceInput }) => updateExperience(id, payload),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });
  const deleteMutation = useMutation({ mutationFn: deleteExperience, onSuccess: invalidate });

  // A mutation holds on to its error until the next attempt, so a failed
  // create left its red banner sitting on top of whichever form was opened
  // next - a form that had not been submitted at all yet.
  function openEditor(next: Experience | "new" | null) {
    createMutation.reset();
    updateMutation.reset();
    setEditing(next);
  }

  if (isLoading) return <PageSpinner />;

  // A failed *refresh* keeps the last good list, which is still perfectly
  // editable. Only a load that produced nothing has to stop the owner.
  const loadFailed = isError && data === undefined;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-display text-sm text-scope">Experience</p>
          <h1 className="mt-2 font-display text-3xl text-bone">Work history</h1>
          <p className="mt-2 text-sm text-bone-dim">Add and edit the roles shown in the public Experience section.</p>
        </div>
        {!loadFailed && editing === null && (
          <Button size="sm" onClick={() => openEditor("new")}>
            <Plus className="h-4 w-4" /> Add role
          </Button>
        )}
      </div>

      {/* Editing is refused outright while the list is unknown: a blank page
          reads as "I have no roles yet" and invites the owner to re-create
          entries that are still on the server. */}
      {editing ? (
        <ExperienceForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? undefined : editing}
          isSaving={createMutation.isPending || updateMutation.isPending}
          error={createMutation.error || updateMutation.error}
          onCancel={() => openEditor(null)}
          onSave={(values) => {
            const payload = toPayload(values);
            if (editing === "new") createMutation.mutate(payload);
            else updateMutation.mutate({ id: editing.id, payload });
          }}
        />
      ) : loadFailed ? (
        <div className="mt-10">
          <LoadError message={apiErrorMessage(error)} onRetry={() => refetch()} isRetrying={isFetching} />
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-3">
          {isError && (
            <ErrorNotice message={`Showing the last loaded roles — couldn't refresh them. ${apiErrorMessage(error)}`} />
          )}
          {deleteMutation.isError && <ErrorNotice message={apiErrorMessage(deleteMutation.error)} />}
          {data?.length === 0 && <EmptyState title="No experience entries yet" description="Add a role to make the Experience section visible." />}
          {data?.map((experience) => (
            <article key={experience.id} className="flex items-center justify-between gap-4 rounded-xl border border-ink-700 p-5 transition-colors hover:border-scope/50">
              <div>
                <p className="font-display text-base text-bone">{experience.role} · {experience.company}</p>
                <p className="mt-1 font-mono text-xs text-bone-faint">
                  {[experience.location, experience.current ? "Current" : [experience.start_date, experience.end_date].filter(Boolean).join(" — ")].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button type="button" onClick={() => openEditor(experience)} className="rounded p-1 text-bone-dim transition-colors hover:bg-scope/10 hover:text-scope" aria-label={`Edit ${experience.role} at ${experience.company}`}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={deleteMutation.isPending && deleteMutation.variables === experience.id}
                  onClick={() => {
                    if (confirm(`Delete "${experience.role}" at ${experience.company}? This can't be undone.`)) deleteMutation.mutate(experience.id);
                  }}
                  className="rounded p-1 text-bone-dim transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                  aria-label={`Delete ${experience.role} at ${experience.company}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ExperienceForm({
  initial,
  isSaving,
  error,
  onCancel,
  onSave,
}: {
  initial?: Experience;
  isSaving: boolean;
  error: unknown;
  onCancel: () => void;
  onSave: (values: ExperienceFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ExperienceFormValues>({ defaultValues: toFormValues(initial) });
  const isCurrent = watch("current");

  return (
    <form onSubmit={handleSubmit(onSave)} className="mt-10 flex flex-col gap-5 rounded-2xl border border-ink-700 bg-ink-900/40 p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* These two were registered as required with no `error` prop to show
            it, so submitting without them made the Save button look dead. */}
        <TextField
          label="Company"
          error={errors.company?.message}
          {...register("company", { required: "Required", maxLength: { value: 160, message: "Up to 160 characters" } })}
        />
        <TextField
          label="Role"
          error={errors.role?.message}
          {...register("role", { required: "Required", maxLength: { value: 160, message: "Up to 160 characters" } })}
        />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <TextField label="Location" placeholder="Hyderabad, India" {...register("location")} />
        <TextField label="Start date" placeholder="Jan 2026" {...register("start_date")} />
        <TextField label="End date" placeholder="Present" disabled={isCurrent} {...register("end_date")} />
      </div>
      <label className="flex items-center gap-2 text-sm text-bone-dim">
        <input type="checkbox" {...register("current")} className="h-4 w-4 accent-scope" />
        I currently hold this role
      </label>
      <TextAreaField
        label="Description"
        rows={5}
        error={errors.description?.message}
        {...register("description", { maxLength: { value: 2000, message: "Up to 2000 characters" } })}
      />
      <TextAreaField
        label="Key contribution points"
        rows={4}
        hint={`Enter one point per line, up to ${MAX_HIGHLIGHTS}. You can start each line with a dash; it will be formatted as a bullet on the portfolio.`}
        placeholder={"Image annotation\nSynthetic damage-data generation with LLMs and GenAI\nYOLO detection-model training"}
        error={errors.highlights?.message}
        {...register("highlights", {
          validate: (value) =>
            splitHighlights(value).length <= MAX_HIGHLIGHTS ||
            `Up to ${MAX_HIGHLIGHTS} points — merge or remove a line.`,
        })}
      />
      <TextField
        label="Sort order"
        type="number"
        hint="Lower numbers appear first."
        {...register("sort_order", {
          // An empty number input becomes NaN under `valueAsNumber`, and NaN
          // serialises to null: creating 422s and updating writes null into a
          // NOT NULL column, which the owner sees as an unexplained 500.
          setValueAs: (value) => {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : 0;
          },
        })}
      />

      <div className="mt-2 flex items-center gap-4">
        <Button type="submit" disabled={isSaving}>{isSaving ? "Saving…" : "Save experience"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
      {error !== null && error !== undefined && <ErrorNotice message={apiErrorMessage(error)} />}
    </form>
  );
}
