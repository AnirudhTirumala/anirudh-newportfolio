import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "@/api/endpoints";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PageSpinner, ErrorNotice } from "@/components/ui/Feedback";
import { apiErrorMessage } from "@/api/client";
import type { ProfileUpdate } from "@/types";

export default function ProfileEditor() {
  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile"], updated);
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  const { register, handleSubmit, reset } = useForm<ProfileUpdate>();

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-2xl">
      <p className="font-display text-sm text-scope">Profile</p>
      <h1 className="mt-2 font-display text-3xl text-bone">Hero, about & contact</h1>

      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="mt-10 flex flex-col gap-5">
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
          <TextField label="GitHub URL" {...register("github_url")} />
          <TextField label="LinkedIn URL" {...register("linkedin_url")} />
        </div>
        <TextField label="Resume URL" hint="Link to a hosted PDF, if you have one" {...register("resume_url")} />

        <div className="mt-2 flex items-center gap-4">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
          {mutation.isSuccess && <span className="text-sm text-scope">Saved</span>}
        </div>
        {mutation.isError && <ErrorNotice message={apiErrorMessage(mutation.error)} />}
      </form>
    </div>
  );
}
