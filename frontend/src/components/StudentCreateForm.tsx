import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { addChildToClass, createStudent } from "@/lib/teacherApi";

const AVATAR_OPTIONS = ["🦊", "🐼", "🦁", "🐸", "🦄", "🐻"];

type StudentCreateFormProps = {
  classId: string;
  existingNames: string[];
  onCreated: () => Promise<void>;
};

export function StudentCreateForm({ classId, existingNames, onCreated }: StudentCreateFormProps) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    setSuccess("");
    setError("");

    if (!trimmedName) {
      setError("Enter a first name to continue.");
      return;
    }

    if (
      existingNames.some(
        (existingName) =>
          existingName.trim().toLocaleLowerCase() === trimmedName.toLocaleLowerCase(),
      )
    ) {
      setError("A student with that name is already in this class.");
      return;
    }

    setIsLoading(true);
    try {
      const student = await createStudent(trimmedName, avatar);
      await addChildToClass(classId, student.id);
      await onCreated();
      setName("");
      setAvatar(AVATAR_OPTIONS[0]);
      setSuccess(`${student.name} was added successfully!`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not add this student.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="bg-card rounded-3xl p-6 chunky-shadow border-2 border-border/40">
      <div className="mb-5">
        <div className="text-sm font-semibold uppercase tracking-wide text-coral">
          Student onboarding
        </div>
        <h2 className="text-2xl font-bold mt-1">Add a student</h2>
        <p className="text-sm text-foreground/60 mt-1">
          Choose a first name and a friendly avatar to get started.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="student-first-name" className="block text-sm font-semibold">
            First name
          </label>
          <input
            id="student-first-name"
            name="firstName"
            type="text"
            autoComplete="off"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Riley"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "student-form-error" : undefined}
            className="h-12 w-full rounded-2xl border-2 border-border/60 bg-background px-4 outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Choose an avatar</legend>
          <div className="flex flex-wrap gap-2">
            {AVATAR_OPTIONS.map((option, index) => (
              <label key={option} className="cursor-pointer">
                <input
                  className="peer sr-only"
                  type="radio"
                  name="avatar"
                  value={option}
                  checked={avatar === option}
                  onChange={() => setAvatar(option)}
                  aria-label={`Avatar ${index + 1}: ${option}`}
                />
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-border/60 bg-background text-2xl transition peer-checked:border-coral peer-checked:bg-coral/10 peer-focus-visible:ring-2 peer-focus-visible:ring-coral">
                  {option}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <p id="student-form-error" role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="text-sm font-medium text-teal">
            {success}
          </p>
        )}

        <Button type="submit" variant="coral" disabled={isLoading} className="w-full">
          {isLoading ? "Adding student…" : "Add student"}
        </Button>
      </form>
    </section>
  );
}
