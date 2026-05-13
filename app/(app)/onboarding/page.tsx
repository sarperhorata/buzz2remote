"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, X } from "lucide-react";

const POPULAR_SKILLS = [
  "React",
  "Python",
  "Node.js",
  "TypeScript",
  "AWS",
  "Docker",
  "Figma",
  "SQL",
  "Go",
  "Rust",
  "Flutter",
  "Kotlin",
];

interface FormData {
  position: string;
  location: string;
  bio: string;
  skills: string[];
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
              step < currentStep
                ? "bg-primary text-primary-foreground"
                : step === currentStep
                ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step}
          </div>
          {step < 3 && (
            <div
              className={`w-16 h-1 mx-1 rounded transition-all duration-300 ${
                step < currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function SkillTag({
  skill,
  onRemove,
}: {
  skill: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
      {skill}
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 hover:text-primary/70 transition-colors"
        aria-label={`Remove ${skill}`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [formData, setFormData] = useState<FormData>({
    position: "",
    location: "",
    bio: "",
    skills: [],
  });

  function addSkill(skill: string) {
    const trimmed = skill.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
    }
    setSkillInput("");
  }

  function removeSkill(skill: string) {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  }

  function handleSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(skillInput);
    }
  }

  async function saveStep(targetStep: number) {
    setLoading(true);
    try {
      const isComplete = targetStep === 3;
      await fetch("/api/users/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: targetStep,
          position: formData.position,
          location: formData.location,
          bio: formData.bio,
          skills: formData.skills,
        }),
      });

      if (isComplete) {
        // Refresh JWT so onboardingCompleted becomes true
        await updateSession();
      }

      setStep(targetStep);
    } catch {
      // Allow proceeding even if save fails
      setStep(targetStep);
    } finally {
      setLoading(false);
    }
  }

  async function handleNext() {
    if (step === 1) {
      await saveStep(2);
    } else if (step === 2) {
      await saveStep(3);
    }
  }

  const step1Valid = formData.position.trim().length > 0;
  const step2Valid = formData.skills.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Set up your profile</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Takes less than 2 minutes
          </p>
        </div>

        <StepIndicator currentStep={step} />

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-lg p-8 transition-all duration-300">
          {/* Step 1 - Basic Info */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-semibold mb-1">
                  Basic Information
                </h2>
                <p className="text-muted-foreground text-sm">
                  Tell employers who you are
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="position">
                    Title / Position{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, position: e.target.value }))
                    }
                    placeholder="e.g. Senior Frontend Developer"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, location: e.target.value }))
                    }
                    placeholder="e.g. Remote, Berlin, New York"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">
                    Bio{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, bio: e.target.value }))
                    }
                    placeholder="A short bio about yourself..."
                    maxLength={300}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.bio.length}/300
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 - Skills */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-semibold mb-1">Your Skills</h2>
                <p className="text-muted-foreground text-sm">
                  Add at least one skill to continue
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="skill-input">
                    Add a skill <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="skill-input"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                      placeholder="Type a skill and press Enter"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addSkill(skillInput)}
                      disabled={!skillInput.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {/* Popular skills */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Popular skills — click to add
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SKILLS.filter(
                      (s) => !formData.skills.includes(s)
                    ).map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => addSkill(skill)}
                        className="px-3 py-1 rounded-full border border-border text-sm hover:border-primary hover:text-primary transition-colors"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected skills */}
                {formData.skills.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Your skills ({formData.skills.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill) => (
                        <SkillTag
                          key={skill}
                          skill={skill}
                          onRemove={() => removeSkill(skill)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3 - Done */}
          {step === 3 && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 mb-6 shadow-lg">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">You&apos;re all set!</h2>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                  Your profile is ready! Let&apos;s find you some jobs.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => router.push("/jobs")}
                    className="gradient-primary text-white border-0 px-8 h-11 font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Browse Jobs
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    className="px-8 h-11"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          {step < 3 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <div>
                {step > 1 && (
                  <Button
                    variant="ghost"
                    onClick={() => setStep((s) => s - 1)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => saveStep(step === 1 ? 2 : 3)}
                  disabled={loading}
                  className="text-muted-foreground"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={
                    loading ||
                    (step === 1 && !step1Valid) ||
                    (step === 2 && !step2Valid)
                  }
                  className="gradient-primary text-white border-0 px-6 font-semibold"
                >
                  {loading ? "Saving..." : "Next"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
