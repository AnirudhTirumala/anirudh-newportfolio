import { useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Check, X, Camera, ImageOff, Image as ImageIcon } from "lucide-react";
import {
  createCertificate,
  createEducation,
  createLanguage,
  deleteCertificate,
  deleteCertificateImage,
  deleteEducation,
  deleteLanguage,
  getCertificates,
  getEducation,
  getLanguages,
  updateCertificate,
  updateEducation,
  updateLanguage,
  uploadCertificateImage,
} from "@/api/endpoints";
import { apiErrorMessage, resolveUploadUrl } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { ErrorNotice, LoadError, PageSpinner, Spinner } from "@/components/ui/Feedback";
import type { Certificate, Education, Language } from "@/types";

export default function CredentialsEditor() {
  return (
    <div className="max-w-3xl">
      <p className="font-display text-sm text-scope">Credentials</p>
      <h1 className="mt-2 font-display text-3xl text-bone">Education & certificates</h1>

      <div className="mt-10 flex flex-col gap-14">
        <EducationSection />
        <CertificatesSection />
        <LanguagesSection />
      </div>
    </div>
  );
}

const EMPTY_EDUCATION: Omit<Education, "id"> = {
  institution: "",
  degree: "",
  field: "",
  location: "",
  start_year: "",
  end_year: "",
  score: "",
  sort_order: 0,
};

function EducationSection() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-education"],
    queryFn: getEducation,
  });
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | "new" | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-education"] });
    queryClient.invalidateQueries({ queryKey: ["portfolio"] });
  }
  const createM = useMutation({
    mutationFn: createEducation,
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
  });
  const updateM = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Education> }) => updateEducation(id, payload),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
  });
  const deleteM = useMutation({ mutationFn: deleteEducation, onSuccess: invalidate });

  // A mutation holds its error until the next attempt, so without this reset
  // the banner from a failed save reappeared on the next form opened.
  function openForm(next: number | "new" | null) {
    createM.reset();
    updateM.reset();
    setEditingId(next);
  }

  if (isLoading) return <PageSpinner />;

  const loadFailed = isBlockingLoadFailure(isError, data);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-bone">Education</h2>
        {!loadFailed && editingId === null && (
          <Button size="sm" variant="secondary" onClick={() => openForm("new")}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        )}
      </div>

      {loadFailed ? (
        <div className="mt-4">
          <LoadError message={apiErrorMessage(error)} onRetry={() => refetch()} isRetrying={isFetching} />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {isError && (
            <ErrorNotice message={`Showing the last loaded education entries — couldn't refresh them. ${apiErrorMessage(error)}`} />
          )}
          {deleteM.isError && <ErrorNotice message={apiErrorMessage(deleteM.error)} />}

          {data?.map((entry) =>
            editingId === entry.id ? (
              <EducationForm
                key={entry.id}
                initial={entry}
                onCancel={() => openForm(null)}
                onSave={(values) => updateM.mutate({ id: entry.id, payload: values })}
                saving={updateM.isPending}
                error={updateM.error}
              />
            ) : (
              <div key={entry.id} className="flex items-center justify-between gap-4 border border-ink-700 px-4 py-3">
                <div>
                  <p className="text-sm text-bone">
                    {entry.institution} — {entry.degree}
                    {entry.field ? `, ${entry.field}` : ""}
                  </p>
                  <p className="font-mono text-xs text-bone-faint">
                    {entry.start_year}–{entry.end_year} · {[entry.location, entry.score].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <RowActions
                  name={`${entry.institution} — ${entry.degree}`}
                  onEdit={() => openForm(entry.id)}
                  onDelete={() => deleteM.mutate(entry.id)}
                  deleting={deleteM.isPending && deleteM.variables === entry.id}
                />
              </div>
            ),
          )}

          {editingId === "new" && (
            <EducationForm
              nextSortOrder={data?.length ?? 0}
              onCancel={() => openForm(null)}
              onSave={(values) => createM.mutate(values)}
              saving={createM.isPending}
              error={createM.error}
            />
          )}
        </div>
      )}
    </section>
  );
}

function EducationForm({
  initial,
  nextSortOrder = 0,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial?: Education;
  nextSortOrder?: number;
  onSave: (values: Omit<Education, "id">) => void;
  onCancel: () => void;
  saving: boolean;
  error: unknown;
}) {
  const [values, setValues] = useState<Omit<Education, "id">>(
    initial ?? { ...EMPTY_EDUCATION, sort_order: nextSortOrder },
  );
  const set = (field: keyof Omit<Education, "id">) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  return (
    <form onSubmit={submitHandler(() => onSave(values))} className="flex flex-col gap-2 border border-scope-dim p-4">
      <div className="grid grid-cols-2 gap-2">
        <MiniInput label="Institution" required value={values.institution} onChange={set("institution")} />
        <MiniInput label="Degree" required value={values.degree} onChange={set("degree")} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MiniInput label="Field of study" value={values.field} onChange={set("field")} />
        <MiniInput label="Location" value={values.location} onChange={set("location")} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniInput label="Start year" value={values.start_year} onChange={set("start_year")} />
        <MiniInput label="End year" value={values.end_year} onChange={set("end_year")} />
        <MiniInput label="Score" placeholder="CGPA 7.75" value={values.score} onChange={set("score")} />
        <MiniInput
          label="Order"
          type="number"
          value={values.sort_order}
          onChange={(e) => setValues((v) => ({ ...v, sort_order: toSortOrder(e.target.value) }))}
        />
      </div>
      <FormActions onCancel={onCancel} saving={saving} />
      {error !== null && error !== undefined && <ErrorNotice message={apiErrorMessage(error)} />}
    </form>
  );
}

const EMPTY_CERTIFICATE: Omit<Certificate, "id"> = { name: "", issuer: "", issued_on: "", url: "", image_url: "", sort_order: 0 };

function CertificatesSection() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-certificates"],
    queryFn: getCertificates,
  });
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | "new" | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-certificates"] });
    queryClient.invalidateQueries({ queryKey: ["portfolio"] });
  }
  const createM = useMutation({
    mutationFn: createCertificate,
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
  });
  const updateM = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Certificate> }) => updateCertificate(id, payload),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
  });
  const deleteM = useMutation({ mutationFn: deleteCertificate, onSuccess: invalidate });
  const uploadImageM = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadCertificateImage(id, file),
    onSuccess: invalidate,
  });
  const removeImageM = useMutation({ mutationFn: deleteCertificateImage, onSuccess: invalidate });

  function openForm(next: number | "new" | null) {
    createM.reset();
    updateM.reset();
    setEditingId(next);
  }

  if (isLoading) return <PageSpinner />;

  const loadFailed = isBlockingLoadFailure(isError, data);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-bone">Certificates</h2>
        {!loadFailed && editingId === null && (
          <Button size="sm" variant="secondary" onClick={() => openForm("new")}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        )}
      </div>

      {loadFailed ? (
        <div className="mt-4">
          <LoadError message={apiErrorMessage(error)} onRetry={() => refetch()} isRetrying={isFetching} />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {isError && (
            <ErrorNotice message={`Showing the last loaded certificates — couldn't refresh them. ${apiErrorMessage(error)}`} />
          )}
          {deleteM.isError && <ErrorNotice message={apiErrorMessage(deleteM.error)} />}

          {data?.map((entry) => {
            const uploading = uploadImageM.isPending && uploadImageM.variables?.id === entry.id;
            const removingImage = removeImageM.isPending && removeImageM.variables === entry.id;
            const imageError =
              (uploadImageM.isError && uploadImageM.variables?.id === entry.id && uploadImageM.error) ||
              (removeImageM.isError && removeImageM.variables === entry.id && removeImageM.error) ||
              null;

            return editingId === entry.id ? (
              <CertificateForm
                key={entry.id}
                initial={entry}
                onCancel={() => openForm(null)}
                onSave={(values) => updateM.mutate({ id: entry.id, payload: values })}
                saving={updateM.isPending}
                error={updateM.error}
              />
            ) : (
              <div key={entry.id} className="flex flex-col gap-1.5 border border-ink-700 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {entry.image_url ? (
                      <img
                        src={resolveUploadUrl(entry.image_url)}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-dashed border-ink-600 text-bone-faint">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm text-bone">{entry.name}</p>
                      <p className="font-mono text-xs text-bone-faint">{entry.issuer}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <label
                      className={
                        uploading
                          ? "cursor-default text-scope"
                          : "cursor-pointer text-bone-faint hover:text-scope"
                      }
                      aria-label={entry.image_url ? `Change photo for ${entry.name}` : `Upload photo for ${entry.name}`}
                      title={uploading ? "Uploading…" : entry.image_url ? "Change photo" : "Upload photo"}
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        // A second upload started before the first finished
                        // deleted the file the first one had just written.
                        disabled={uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImageM.mutate({ id: entry.id, file });
                          e.target.value = "";
                        }}
                      />
                      {uploading ? <Spinner /> : <Camera className="h-4 w-4" />}
                    </label>
                    {entry.image_url && (
                      <button
                        type="button"
                        disabled={removingImage}
                        onClick={() => {
                          // The file is unlinked from the server's disk, so
                          // this is as destructive as the row delete beside
                          // it - which has always asked first.
                          if (confirm(`Remove the uploaded photo for "${entry.name}"? This can't be undone.`)) {
                            removeImageM.mutate(entry.id);
                          }
                        }}
                        className="text-bone-faint hover:text-danger disabled:opacity-50"
                        aria-label={`Remove photo for ${entry.name}`}
                        title="Remove photo"
                      >
                        {removingImage ? <Spinner /> : <ImageOff className="h-4 w-4" />}
                      </button>
                    )}
                    <RowActions
                      name={entry.name}
                      onEdit={() => openForm(entry.id)}
                      onDelete={() => deleteM.mutate(entry.id)}
                      deleting={deleteM.isPending && deleteM.variables === entry.id}
                    />
                  </div>
                </div>
                {imageError && <p className="font-mono text-xs text-danger">{apiErrorMessage(imageError)}</p>}
              </div>
            );
          })}

          {editingId === "new" && (
            <CertificateForm
              nextSortOrder={data?.length ?? 0}
              onCancel={() => openForm(null)}
              onSave={(values) => createM.mutate(values)}
              saving={createM.isPending}
              error={createM.error}
            />
          )}
        </div>
      )}
    </section>
  );
}

function CertificateForm({
  initial,
  nextSortOrder = 0,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial?: Certificate;
  nextSortOrder?: number;
  onSave: (values: Omit<Certificate, "id">) => void;
  onCancel: () => void;
  saving: boolean;
  error: unknown;
}) {
  const [values, setValues] = useState<Omit<Certificate, "id">>(
    initial ?? { ...EMPTY_CERTIFICATE, sort_order: nextSortOrder },
  );
  const set = (field: keyof Omit<Certificate, "id">) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  return (
    <form onSubmit={submitHandler(() => onSave(values))} className="flex flex-col gap-2 border border-scope-dim p-4">
      <div className="grid grid-cols-2 gap-2">
        <MiniInput label="Certificate name" required value={values.name} onChange={set("name")} />
        <MiniInput label="Issuer" value={values.issuer} onChange={set("issuer")} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MiniInput label="Date (optional)" placeholder="Mar 2025" value={values.issued_on} onChange={set("issued_on")} />
        {/* `type="url"` makes the browser refuse a bare "coursera.org/..." up
            front; the backend rejects anything without an http(s) scheme. */}
        <MiniInput
          label="Verification URL (optional)"
          type="url"
          placeholder="https://coursera.org/verify/ABC123"
          value={values.url}
          onChange={set("url")}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MiniInput
          label="Order"
          type="number"
          value={values.sort_order}
          onChange={(e) => setValues((v) => ({ ...v, sort_order: toSortOrder(e.target.value) }))}
        />
      </div>
      <FormActions onCancel={onCancel} saving={saving} />
      {error !== null && error !== undefined && <ErrorNotice message={apiErrorMessage(error)} />}
    </form>
  );
}

const EMPTY_LANGUAGE: Omit<Language, "id"> = { name: "", proficiency: "", sort_order: 0 };

function LanguagesSection() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-languages"],
    queryFn: getLanguages,
  });
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | "new" | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-languages"] });
    queryClient.invalidateQueries({ queryKey: ["portfolio"] });
  }
  const createM = useMutation({
    mutationFn: createLanguage,
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
  });
  const updateM = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Language> }) => updateLanguage(id, payload),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
  });
  const deleteM = useMutation({ mutationFn: deleteLanguage, onSuccess: invalidate });

  function openForm(next: number | "new" | null) {
    createM.reset();
    updateM.reset();
    setEditingId(next);
  }

  if (isLoading) return <PageSpinner />;

  const loadFailed = isBlockingLoadFailure(isError, data);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-bone">Languages</h2>
        {!loadFailed && editingId === null && (
          <Button size="sm" variant="secondary" onClick={() => openForm("new")}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        )}
      </div>

      {loadFailed ? (
        <div className="mt-4">
          <LoadError message={apiErrorMessage(error)} onRetry={() => refetch()} isRetrying={isFetching} />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {isError && (
            <ErrorNotice message={`Showing the last loaded languages — couldn't refresh them. ${apiErrorMessage(error)}`} />
          )}
          {deleteM.isError && <ErrorNotice message={apiErrorMessage(deleteM.error)} />}

          {data?.map((entry) =>
            editingId === entry.id ? (
              <LanguageForm
                key={entry.id}
                initial={entry}
                onCancel={() => openForm(null)}
                onSave={(values) => updateM.mutate({ id: entry.id, payload: values })}
                saving={updateM.isPending}
                error={updateM.error}
              />
            ) : (
              <div key={entry.id} className="flex items-center justify-between gap-4 border border-ink-700 px-4 py-3">
                <p className="text-sm text-bone">
                  {entry.name}
                  {entry.proficiency && <span className="ml-2 font-mono text-xs text-bone-faint">{entry.proficiency}</span>}
                </p>
                <RowActions
                  name={entry.name}
                  onEdit={() => openForm(entry.id)}
                  onDelete={() => deleteM.mutate(entry.id)}
                  deleting={deleteM.isPending && deleteM.variables === entry.id}
                />
              </div>
            ),
          )}

          {editingId === "new" && (
            <LanguageForm
              nextSortOrder={data?.length ?? 0}
              onCancel={() => openForm(null)}
              onSave={(values) => createM.mutate(values)}
              saving={createM.isPending}
              error={createM.error}
            />
          )}
        </div>
      )}
    </section>
  );
}

function LanguageForm({
  initial,
  nextSortOrder = 0,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial?: Language;
  nextSortOrder?: number;
  onSave: (values: Omit<Language, "id">) => void;
  onCancel: () => void;
  saving: boolean;
  error: unknown;
}) {
  const [values, setValues] = useState<Omit<Language, "id">>(
    initial ?? { ...EMPTY_LANGUAGE, sort_order: nextSortOrder },
  );
  const set = (field: keyof Omit<Language, "id">) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  return (
    <form onSubmit={submitHandler(() => onSave(values))} className="flex flex-col gap-2 border border-scope-dim p-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MiniInput label="Language" required value={values.name} onChange={set("name")} />
        <MiniInput label="Proficiency (optional)" value={values.proficiency} onChange={set("proficiency")} />
        <MiniInput
          label="Order"
          type="number"
          value={values.sort_order}
          onChange={(e) => setValues((v) => ({ ...v, sort_order: toSortOrder(e.target.value) }))}
        />
      </div>
      <FormActions onCancel={onCancel} saving={saving} />
      {error !== null && error !== undefined && <ErrorNotice message={apiErrorMessage(error)} />}
    </form>
  );
}

// --- Shared bits --------------------------------------------------------------

/**
 * A failed *refresh* leaves the last good list in the cache and on screen,
 * which is still perfectly editable. Only a load that produced nothing has to
 * stop the owner: that is the state where a form renders blank and one Save
 * writes those blanks over real content.
 */
function isBlockingLoadFailure(isError: boolean, data: unknown): boolean {
  return isError && data === undefined;
}


/** Clearing the box leaves an empty string; the column is NOT NULL, so a
 * blank has to become a number before it reaches the API. */
function toSortOrder(raw: string): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function submitHandler(onSubmit: () => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };
}

/**
 * These forms used to be plain `<div>`s of placeholder-only inputs. A screen
 * reader announced eight unnamed boxes, and on an edit form - which arrives
 * pre-filled, so no placeholder is visible - nothing on screen said which box
 * was "Degree" and which was "Field of study".
 */
function MiniInput({
  label,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="font-mono text-[0.65rem] uppercase tracking-wider text-bone-faint">
        {label}
      </label>
      <input
        id={fieldId}
        {...props}
        className="rounded-md border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-bone placeholder:text-bone-faint focus-visible:border-scope focus-visible:outline-none"
      />
    </div>
  );
}

function RowActions({
  name,
  onEdit,
  onDelete,
  deleting,
}: {
  name: string;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <button type="button" onClick={onEdit} className="text-bone-faint hover:text-scope" aria-label={`Edit ${name}`}>
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={deleting}
        onClick={() => {
          if (confirm(`Delete "${name}"? This can't be undone.`)) onDelete();
        }}
        className="text-bone-faint hover:text-danger disabled:opacity-50"
        aria-label={`Delete ${name}`}
      >
        {deleting ? <Spinner /> : <Trash2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

function FormActions({ onCancel, saving }: { onCancel: () => void; saving: boolean }) {
  return (
    <div className="mt-1 flex items-center gap-3">
      {/* Submitting the form rather than calling onSave directly is what makes
          Enter work and lets the browser flag an empty required field. */}
      <Button size="sm" type="submit" disabled={saving}>
        <Check className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel} type="button">
        <X className="h-3.5 w-3.5" /> Cancel
      </Button>
    </div>
  );
}
