import { useState } from "react";
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
import { PageSpinner } from "@/components/ui/Feedback";
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
  const { data, isLoading } = useQuery({ queryKey: ["admin-education"], queryFn: getEducation });
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

  if (isLoading) return <PageSpinner />;

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-bone">Education</h2>
        {editingId === null && (
          <Button size="sm" variant="secondary" onClick={() => setEditingId("new")}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {data?.map((entry) =>
          editingId === entry.id ? (
            <EducationForm
              key={entry.id}
              initial={entry}
              onCancel={() => setEditingId(null)}
              onSave={(values) => updateM.mutate({ id: entry.id, payload: values })}
              saving={updateM.isPending}
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
              <RowActions onEdit={() => setEditingId(entry.id)} onDelete={() => deleteM.mutate(entry.id)} />
            </div>
          ),
        )}

        {editingId === "new" && (
          <EducationForm onCancel={() => setEditingId(null)} onSave={(values) => createM.mutate(values)} saving={createM.isPending} />
        )}
      </div>
    </section>
  );
}

function EducationForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Education;
  onSave: (values: Omit<Education, "id">) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [values, setValues] = useState<Omit<Education, "id">>(initial ?? EMPTY_EDUCATION);
  const set = (field: keyof Omit<Education, "id">) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  return (
    <div className="flex flex-col gap-2 border border-scope-dim p-4">
      <div className="grid grid-cols-2 gap-2">
        <MiniInput placeholder="Institution" value={values.institution} onChange={set("institution")} />
        <MiniInput placeholder="Degree" value={values.degree} onChange={set("degree")} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MiniInput placeholder="Field of study" value={values.field} onChange={set("field")} />
        <MiniInput placeholder="Location" value={values.location} onChange={set("location")} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <MiniInput placeholder="Start year" value={values.start_year} onChange={set("start_year")} />
        <MiniInput placeholder="End year" value={values.end_year} onChange={set("end_year")} />
        <MiniInput placeholder="Score (e.g. CGPA 7.75)" value={values.score} onChange={set("score")} />
      </div>
      <FormActions onSave={() => onSave(values)} onCancel={onCancel} saving={saving} />
    </div>
  );
}

const EMPTY_CERTIFICATE: Omit<Certificate, "id"> = { name: "", issuer: "", issued_on: "", url: "", image_url: "", sort_order: 0 };

function CertificatesSection() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-certificates"], queryFn: getCertificates });
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

  if (isLoading) return <PageSpinner />;

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-bone">Certificates</h2>
        {editingId === null && (
          <Button size="sm" variant="secondary" onClick={() => setEditingId("new")}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {data?.map((entry) =>
          editingId === entry.id ? (
            <CertificateForm
              key={entry.id}
              initial={entry}
              onCancel={() => setEditingId(null)}
              onSave={(values) => updateM.mutate({ id: entry.id, payload: values })}
              saving={updateM.isPending}
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
                    className="cursor-pointer text-bone-faint hover:text-scope"
                    aria-label={entry.image_url ? `Change photo for ${entry.name}` : `Upload photo for ${entry.name}`}
                    title={entry.image_url ? "Change photo" : "Upload photo"}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadImageM.mutate({ id: entry.id, file });
                        e.target.value = "";
                      }}
                    />
                    <Camera className="h-4 w-4" />
                  </label>
                  {entry.image_url && (
                    <button
                      onClick={() => removeImageM.mutate(entry.id)}
                      className="text-bone-faint hover:text-danger"
                      aria-label={`Remove photo for ${entry.name}`}
                      title="Remove photo"
                    >
                      <ImageOff className="h-4 w-4" />
                    </button>
                  )}
                  <RowActions onEdit={() => setEditingId(entry.id)} onDelete={() => deleteM.mutate(entry.id)} />
                </div>
              </div>
              {uploadImageM.isError && uploadImageM.variables?.id === entry.id && (
                <p className="font-mono text-xs text-danger">{apiErrorMessage(uploadImageM.error)}</p>
              )}
            </div>
          ),
        )}
        {editingId === "new" && (
          <CertificateForm onCancel={() => setEditingId(null)} onSave={(values) => createM.mutate(values)} saving={createM.isPending} />
        )}
      </div>
    </section>
  );
}

function CertificateForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Certificate;
  onSave: (values: Omit<Certificate, "id">) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [values, setValues] = useState<Omit<Certificate, "id">>(initial ?? EMPTY_CERTIFICATE);
  const set = (field: keyof Omit<Certificate, "id">) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  return (
    <div className="flex flex-col gap-2 border border-scope-dim p-4">
      <div className="grid grid-cols-2 gap-2">
        <MiniInput placeholder="Certificate name" value={values.name} onChange={set("name")} />
        <MiniInput placeholder="Issuer" value={values.issuer} onChange={set("issuer")} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MiniInput placeholder="Date (optional)" value={values.issued_on} onChange={set("issued_on")} />
        <MiniInput placeholder="Verification URL (optional)" value={values.url} onChange={set("url")} />
      </div>
      <FormActions onSave={() => onSave(values)} onCancel={onCancel} saving={saving} />
    </div>
  );
}

const EMPTY_LANGUAGE: Omit<Language, "id"> = { name: "", proficiency: "", sort_order: 0 };

function LanguagesSection() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-languages"], queryFn: getLanguages });
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

  if (isLoading) return <PageSpinner />;

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-bone">Languages</h2>
        {editingId === null && (
          <Button size="sm" variant="secondary" onClick={() => setEditingId("new")}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {data?.map((entry) =>
          editingId === entry.id ? (
            <LanguageForm
              key={entry.id}
              initial={entry}
              onCancel={() => setEditingId(null)}
              onSave={(values) => updateM.mutate({ id: entry.id, payload: values })}
              saving={updateM.isPending}
            />
          ) : (
            <div key={entry.id} className="flex items-center justify-between gap-4 border border-ink-700 px-4 py-3">
              <p className="text-sm text-bone">
                {entry.name}
                {entry.proficiency && <span className="ml-2 font-mono text-xs text-bone-faint">{entry.proficiency}</span>}
              </p>
              <RowActions onEdit={() => setEditingId(entry.id)} onDelete={() => deleteM.mutate(entry.id)} />
            </div>
          ),
        )}
        {editingId === "new" && (
          <LanguageForm onCancel={() => setEditingId(null)} onSave={(values) => createM.mutate(values)} saving={createM.isPending} />
        )}
      </div>
    </section>
  );
}

function LanguageForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Language;
  onSave: (values: Omit<Language, "id">) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [values, setValues] = useState<Omit<Language, "id">>(initial ?? EMPTY_LANGUAGE);
  const set = (field: keyof Omit<Language, "id">) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  return (
    <div className="flex flex-col gap-2 border border-scope-dim p-4">
      <div className="grid grid-cols-2 gap-2">
        <MiniInput placeholder="Language" value={values.name} onChange={set("name")} />
        <MiniInput placeholder="Proficiency (optional)" value={values.proficiency} onChange={set("proficiency")} />
      </div>
      <FormActions onSave={() => onSave(values)} onCancel={onCancel} saving={saving} />
    </div>
  );
}

// --- Shared bits --------------------------------------------------------------
function MiniInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="rounded-md border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-bone placeholder:text-bone-faint focus-visible:border-scope focus-visible:outline-none"
    />
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <button onClick={onEdit} className="text-bone-faint hover:text-scope" aria-label="Edit">
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={() => {
          if (confirm("Delete this entry?")) onDelete();
        }}
        className="text-bone-faint hover:text-danger"
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function FormActions({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div className="mt-1 flex items-center gap-3">
      <Button size="sm" onClick={onSave} disabled={saving} type="button">
        <Check className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel} type="button">
        <X className="h-3.5 w-3.5" /> Cancel
      </Button>
    </div>
  );
}
