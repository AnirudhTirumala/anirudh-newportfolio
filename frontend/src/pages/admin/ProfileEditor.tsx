import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import { deleteResume, getProfile, updateProfile, uploadResume } from "@/api/endpoints";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PageSpinner, ErrorNotice, LoadError, Spinner } from "@/components/ui/Feedback";
import { apiErrorMessage } from "@/api/client";
import { resolveResumeUrl } from "@/lib/urls";
import type { Profile, ProfileUpdate } from "@/types";

/**
 * Upload a résumé PDF, or clear whichever kind of résumé is set.
 *
 * `resume_url` above accepts a link to a hosted file; this writes the same
 * field from an upload instead, so the owner can use either without the two
 * competing. Saving the form is a separate action from uploading, which is why
 * this block sits outside it and invalidates the caches itself.
 */
function ResumeUpload({ profile }: { profile?: Profile }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const current = profile?.resume_url ?? "";
  const isUploaded = current.startsWith("/uploads/resume/");
  const href = resolveResumeUrl(current);

  const applyProfile = (updated: Profile) => {
    queryClient.setQueryData(["profile"], updated);
    queryClient.invalidateQueries({ queryKey: ["portfolio"] });
  };

  const upload = useMutation({
    mutationFn: uploadResume,
    onSuccess: applyProfile,
    // The same file can be chosen twice in a row only if the input is cleared,
    // because `change` does not fire when the value has not changed.
    onSettled: () => {
      if (inputRef.current) inputRef.current.value = "";
    },
  });
  const remove = useMutation({ mutationFn: deleteResume, onSuccess: applyProfile });

  return (
    <div className="rounded-md border border-ink-700 p-4">
      <p className="font-display text-sm font-medium text-bone-dim">Resume file</p>
      <p className="mt-1 text-xs text-bone-faint">
        Upload a PDF (max 8MB). This replaces whatever the Resume URL field holds, and the site shows a Resume
        button wherever one is set.
      </p>

      {current ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-bone">
            <FileText className="h-4 w-4 text-scope" />
            {isUploaded ? "Uploaded PDF" : "External link"}
          </span>
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-scope hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              if (confirm("Remove the resume from the site?")) remove.mutate();
            }}
            disabled={remove.isPending}
            className="inline-flex items-center gap-1.5 font-mono text-xs text-bone-faint transition-colors hover:text-danger disabled:opacity-50"
          >
            {remove.isPending ? <Spinner /> : <Trash2 className="h-3.5 w-3.5" />} Remove
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-bone-faint">No resume set yet.</p>
      )}

      <div className="mt-4">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          id="resume-file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setLocalError(null);
            // Checked here as well as on the server so an obvious mistake is
            // reported instantly instead of after an upload round trip.
            if (file.type !== "application/pdf") {
              setLocalError("That file is not a PDF.");
              event.target.value = "";
              return;
            }
            if (file.size > 8 * 1024 * 1024) {
              setLocalError("That PDF is larger than 8MB.");
              event.target.value = "";
              return;
            }
            upload.mutate(file);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          {upload.isPending ? <Spinner /> : <Upload className="h-4 w-4" />}
          {upload.isPending ? "Uploading…" : current ? "Replace PDF" : "Upload PDF"}
        </Button>
      </div>

      {localError && <div className="mt-3"><ErrorNotice message={localError} /></div>}
      {upload.isError && <div className="mt-3"><ErrorNotice message={apiErrorMessage(upload.error)} /></div>}
      {remove.isError && <div className="mt-3"><ErrorNotice message={apiErrorMessage(remove.error)} /></div>}
    </div>
  );
}

export default function ProfileEditor() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<ProfileUpdate>();

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile"], updated);
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      // Re-baselining the form on what the server stored is what keeps the
      // "Saved" note honest: it goes away as soon as the owner edits again,
      // instead of sitting there beside unsaved changes for the rest of the
      // session.
      reset(updated);
    },
  });

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  if (isLoading) return <PageSpinner />;

  // Only a load that produced nothing is dangerous. A failed *refresh* still
  // leaves the last good profile in the cache and in the form, so blocking
  // that would throw away a perfectly editable page.
  const loadFailed = isError && data === undefined;

  return (
    <div className="max-w-2xl">
      <p className="font-display text-sm text-scope">Profile</p>
      <h1 className="mt-2 font-display text-3xl text-bone">Hero, about & contact</h1>

      {/* The form is deliberately not rendered when the load failed. Every
          input would be empty, and a PUT of those blanks wipes the name, bio,
          contact details and links off the live site in a single click. */}
      {loadFailed ? (
        <div className="mt-10">
          <LoadError message={apiErrorMessage(error)} onRetry={() => refetch()} isRetrying={isFetching} />
        </div>
      ) : (
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="mt-10 flex flex-col gap-5">
          {isError && (
            <ErrorNotice message={`Showing the last loaded profile — couldn't refresh it. ${apiErrorMessage(error)}`} />
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField label="Name" {...register("name")} />
            <TextField label="Title" {...register("title")} />
          </div>
          <TextField label="Tagline (shown big, under your name)" {...register("tagline")} />
          <TextAreaField label="Bio (the About section - split into sentences automatically)" rows={6} {...register("bio")} />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField label="Email" type="email" {...register("email")} />
            <TextField label="Phone" {...register("phone")} />
          </div>
          <TextField label="Location" {...register("location")} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField label="GitHub URL" placeholder="https://github.com/username" {...register("github_url")} />
            <TextField label="LinkedIn URL" placeholder="https://www.linkedin.com/in/username" {...register("linkedin_url")} />
          </div>
          <TextField
            label="Resume URL"
            placeholder="https://example.com/resume.pdf"
            hint="Link to a hosted PDF, if you have one. Include the https:// prefix. Or upload a file below instead."
            {...register("resume_url")}
          />

          <ResumeUpload profile={data} />

          <div className="mt-2 flex items-center gap-4">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save changes"}
            </Button>
            {mutation.isSuccess && !isDirty && <span className="text-sm text-scope">Saved</span>}
          </div>
          {mutation.isError && <ErrorNotice message={apiErrorMessage(mutation.error)} />}
        </form>
      )}
    </div>
  );
}
