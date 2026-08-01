import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listCourses,
  submitApplication,
  applicationSchema,
  type ApplicationInput,
} from "@/lib/public.functions";

const coursesQuery = queryOptions({
  queryKey: ["public", "courses"],
  queryFn: () => listCourses(),
});

export const Route = createFileRoute("/enrol")({
  validateSearch: (search: Record<string, unknown>) => ({
    course: typeof search["course"] === "string" ? search["course"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Enrol — SYNALYX Analytics" },
      {
        name: "description",
        content:
          "Apply for a SYNALYX Analytics cohort. Tell us your background, goals and preferred schedule — approval unlocks your student portal.",
      },
      { property: "og:title", content: "Enrol at SYNALYX Analytics" },
      {
        property: "og:description",
        content: "A short application form to join the next data analytics cohort.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(coursesQuery);
  },
  component: Enrol,
});

const emptyForm: ApplicationInput = {
  full_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  gender: "",
  city: "",
  education: "",
  occupation: "",
  experience_level: "",
  has_computer: false,
  course_id: "",
  preferred_start: "",
  preferred_schedule: "",
  learning_mode: "",
  goals: "",
  referral_source: "",
  questions: "",
};

const stepFields: (keyof ApplicationInput)[][] = [
  ["full_name", "email", "phone", "date_of_birth", "gender", "city"],
  ["education", "occupation", "experience_level", "has_computer"],
  ["course_id", "preferred_start", "preferred_schedule", "learning_mode"],
  ["goals", "referral_source", "questions"],
];

const stepTitles = [
  "Personal details",
  "Background",
  "Course & schedule",
  "Goals & referral",
];

function Enrol() {
  const { course: courseSlug } = Route.useSearch();
  const { data: courses } = useSuspenseQuery(coursesQuery);
  const submit = useServerFn(submitApplication);

  const preselected = courses.find((c) => c.slug === courseSlug)?.id ?? "";
  const [form, setForm] = useState<ApplicationInput>({
    ...emptyForm,
    course_id: preselected,
  });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = <K extends keyof ApplicationInput>(key: K, value: ApplicationInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key as string];
      return next;
    });
  };

  const validateStep = () => {
    const result = applicationSchema.safeParse(form);
    if (result.success) return true;
    const fields = stepFields[step]!;
    const found: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof ApplicationInput;
      if (fields.includes(key) && !found[key as string]) {
        found[key as string] = issue.message;
      }
    }
    if (Object.keys(found).length === 0) return true;
    setErrors(found);
    return false;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(stepFields.length - 1, s + 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    const parsed = applicationSchema.safeParse(form);
    if (!parsed.success) {
      const found: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        found[issue.path[0] as string] = issue.message;
      }
      setErrors(found);
      toast.error("Some answers still need fixing.");
      return;
    }
    setSubmitting(true);
    try {
      await submit({ data: parsed.data });
      setDone(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(
        message.includes("duplicate")
          ? "An application with this email already exists."
          : "We couldn't submit your application. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <SiteLayout>
        <section className="mx-auto flex max-w-2xl flex-col items-center px-5 py-32 text-center">
          <CheckCircle2 className="h-14 w-14 text-primary-glow" />
          <h1 className="mt-6 font-display text-4xl font-bold uppercase">Application received</h1>
          <p className="mt-4 text-muted-foreground">
            Thanks, {form.full_name.split(" ")[0]}. Our team reviews applications and will email{" "}
            <span className="text-foreground">{form.email}</span> once yours is approved. That
            email will include how to activate your student portal account.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline">
              <Link to="/courses">Browse courses</Link>
            </Button>
            <Button asChild>
              <Link to="/">Back home</Link>
            </Button>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Enrolment"
        title="Apply for a cohort"
        lead="Four short steps. Applications are reviewed by our team before portal access is granted."
      />

      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="mb-10 grid grid-cols-4 gap-2">
          {stepTitles.map((title, i) => (
            <div key={title}>
              <div
                className={`h-1 rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-border"
                }`}
              />
              <p
                className={`mt-2 text-[11px] font-medium ${
                  i <= step ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {title}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-border bg-card p-8">
          <h2 className="font-display text-2xl font-bold">{stepTitles[step]}</h2>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            {step === 0 && (
              <>
                <Field label="Full name" error={errors["full_name"]} className="sm:col-span-2">
                  <Input
                    value={form.full_name}
                    onChange={(e) => set("full_name", e.target.value)}
                    placeholder="Ada Lovelace"
                    maxLength={120}
                  />
                </Field>
                <Field label="Email" error={errors["email"]}>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@email.com"
                    maxLength={255}
                  />
                </Field>
                <Field label="Phone" error={errors["phone"]}>
                  <Input
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+234 800 000 0000"
                    maxLength={30}
                  />
                </Field>
                <Field label="Date of birth" error={errors["date_of_birth"]}>
                  <Input
                    type="date"
                    value={form.date_of_birth ?? ""}
                    onChange={(e) => set("date_of_birth", e.target.value)}
                  />
                </Field>
                <Field label="Gender" error={errors["gender"]}>
                  <Choice
                    value={form.gender ?? ""}
                    onChange={(v) => set("gender", v)}
                    placeholder="Select"
                    options={["Female", "Male", "Prefer not to say"]}
                  />
                </Field>
                <Field label="City / State" error={errors["city"]} className="sm:col-span-2">
                  <Input
                    value={form.city ?? ""}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="Lagos, Nigeria"
                    maxLength={120}
                  />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="Highest education" error={errors["education"]}>
                  <Choice
                    value={form.education ?? ""}
                    onChange={(v) => set("education", v)}
                    placeholder="Select"
                    options={[
                      "Secondary school",
                      "Diploma / OND",
                      "Bachelor's degree",
                      "Master's degree",
                      "Other",
                    ]}
                  />
                </Field>
                <Field label="Current occupation" error={errors["occupation"]}>
                  <Input
                    value={form.occupation ?? ""}
                    onChange={(e) => set("occupation", e.target.value)}
                    placeholder="Student, banker, freelancer…"
                    maxLength={120}
                  />
                </Field>
                <Field
                  label="Experience with data"
                  error={errors["experience_level"]}
                  className="sm:col-span-2"
                >
                  <Choice
                    value={form.experience_level ?? ""}
                    onChange={(v) => set("experience_level", v)}
                    placeholder="Select"
                    options={[
                      "Complete beginner",
                      "Some spreadsheet experience",
                      "Intermediate (SQL or BI tools)",
                      "Advanced (working analyst)",
                    ]}
                  />
                </Field>
                <div className="sm:col-span-2 flex items-start gap-3 rounded-xl border border-border p-4">
                  <Checkbox
                    id="has_computer"
                    checked={form.has_computer}
                    onCheckedChange={(v) => set("has_computer", v === true)}
                  />
                  <Label htmlFor="has_computer" className="text-sm font-normal leading-relaxed">
                    I have regular access to a laptop or desktop computer for classes and
                    assignments.
                  </Label>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Course" error={errors["course_id"]} className="sm:col-span-2">
                  <Select value={form.course_id} onValueChange={(v) => set("course_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a track" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title} · {c.duration_weeks} weeks
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Preferred start date" error={errors["preferred_start"]}>
                  <Input
                    type="date"
                    value={form.preferred_start ?? ""}
                    onChange={(e) => set("preferred_start", e.target.value)}
                  />
                </Field>
                <Field label="Preferred schedule" error={errors["preferred_schedule"]}>
                  <Choice
                    value={form.preferred_schedule ?? ""}
                    onChange={(v) => set("preferred_schedule", v)}
                    placeholder="Select"
                    options={["Weekday mornings", "Weekday evenings", "Weekends"]}
                  />
                </Field>
                <Field label="Learning mode" error={errors["learning_mode"]} className="sm:col-span-2">
                  <Choice
                    value={form.learning_mode ?? ""}
                    onChange={(v) => set("learning_mode", v)}
                    placeholder="Select"
                    options={["Online (live)", "On campus", "Hybrid"]}
                  />
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <Field
                  label="What do you want to achieve?"
                  error={errors["goals"]}
                  className="sm:col-span-2"
                >
                  <Textarea
                    rows={5}
                    value={form.goals}
                    onChange={(e) => set("goals", e.target.value)}
                    placeholder="Tell us where you are now and what you want to be able to do after the programme."
                    maxLength={2000}
                  />
                </Field>
                <Field
                  label="How did you hear about us?"
                  error={errors["referral_source"]}
                  className="sm:col-span-2"
                >
                  <Choice
                    value={form.referral_source ?? ""}
                    onChange={(v) => set("referral_source", v)}
                    placeholder="Select"
                    options={[
                      "Instagram",
                      "LinkedIn",
                      "X (Twitter)",
                      "Facebook",
                      "Friend or family",
                      "Past student",
                      "Google search",
                      "Event or seminar",
                      "Other",
                    ]}
                  />
                </Field>
                <Field
                  label="Anything you'd like to ask? (optional)"
                  error={errors["questions"]}
                  className="sm:col-span-2"
                >
                  <Textarea
                    rows={3}
                    value={form.questions ?? ""}
                    onChange={(e) => set("questions", e.target.value)}
                    maxLength={2000}
                  />
                </Field>
              </>
            )}
          </div>

          <div className="mt-9 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={step === 0 || submitting}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {step < stepFields.length - 1 ? (
              <Button type="button" onClick={next}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit application
              </Button>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string | undefined;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-2 block text-sm">{label}</Label>
      {children}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Choice({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
