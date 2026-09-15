import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createExperience, deleteExperience, getExperiences, updateExperience } from "@/api/endpoints";
import { apiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { EmptyState, ErrorNotice, PageSpinner } from "@/components/ui/Feedback";
import type { Experience, ExperienceInput } from "@/types";

type ExperienceFormValues = Omit<ExperienceInput, "highlights"> & { highlights: string };

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

function toPayload(values: ExperienceFormValues): ExperienceInput {
  // New entries use one point per line. Retain support for the older
  // comma-separated input, but only when the editor contains a single line.
  const rawPoints = values.highlights.includes("\n") ? values.highlights.split(/\r?\n/) : values.highlights.split(",");
  return {
    ...values,
    highlights: rawPoints.map((item) => item.replace(/^[-•]\s*/, "").trim()).filter(Boolean),
  };
}

export default function ExperienceEditor() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-experiences"], queryFn: getExperiences });
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

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-display text-sm text-scope">Experience</p>
          <h1 className="mt-2 font-display text-3xl text-bone">Work history</h1>
          <p className="mt-2 text-sm text-bone-dim">Add and edit the roles shown in the public Experience section.</p>
        </div>
        {editing === null && (
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> Add role
          </Button>
        )}
      </div>

      {editing ? (
        <ExperienceForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? undefined : editing}
          isSaving={createMutation.isPending || updateMutation.isPending}
          error={createMutation.error || updateMutation.error}
          onCancel={() => setEditing(null)}
          onSave={(values) => {
            const payload = toPayload(values);
            if (editing === "new") createMutation.mutate(payload);
            else updateMutation.mutate({ id: editing.id, payload });
          }}
        />
      ) : (
        <div className="mt-10 flex flex-col gap-3">
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
                <button type="button" onClick={() => setEditing(experience)} className="rounded p-1 text-bone-dim transition-colors hover:bg-scope/10 hover:text-scope" aria-label={`Edit ${experience.role} at ${experience.company}`}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete "${experience.role}" at ${experience.company}? This can't be undone.`)) deleteMutation.mutate(experience.id);
                  }}
                  className="rounded p-1 text-bone-dim transition-colors hover:bg-danger/10 hover:text-danger"
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
  const { register, handleSubmit, watch } = useForm<ExperienceFormValues>({ defaultValues: toFormValues(initial) });
  const isCurrent = watch("current");

  return (
    <form onSubmit={handleSubmit(onSave)} className="mt-10 flex flex-col gap-5 rounded-2xl border border-ink-700 bg-ink-900/40 p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField label="Company" {...register("company", { required: true })} />
        <TextField label="Role" {...register("role", { required: true })} />
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
      <TextAreaField label="Description" rows={5} {...register("description")} />
      <TextAreaField
        label="Key contribution points"
        rows={4}
        hint="Enter one point per line. You can start each line with a dash; it will be formatted as a bullet on the portfolio."
        placeholder={"Image annotation\nSynthetic damage-data generation with LLMs and GenAI\nYOLO detection-model training"}
        {...register("highlights")}
      />
      <TextField label="Sort order" type="number" {...register("sort_order", { valueAsNumber: true })} />

      <div className="mt-2 flex items-center gap-4">
        <Button type="submit" disabled={isSaving}>{isSaving ? "Saving…" : "Save experience"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
      {error !== null && error !== undefined && <ErrorNotice message={apiErrorMessage(error)} />}
    </form>
  );
}
