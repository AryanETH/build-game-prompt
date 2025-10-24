import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

function getAgeTier(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  if (age < 0) return null;
  if (age <= 12) return 1; // Kids 9–12 -> conservatively bucket <=12
  if (age <= 17) return 2; // Teens 13–17
  if (age <= 25) return 3; // Young Adults 18–25
  return 4; // Adults 26+
}

const AVATARS = [
  "astronaut", "robot", "wizard", "ninja", "cat", "dog", "panda", "unicorn"
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Step 1: Legal + Account
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  // Step 2: DOB + basic identity
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  const computedTier = useMemo(() => getAgeTier(dateOfBirth || null), [dateOfBirth]);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Step 3: Profile visual
  const [avatarChoice, setAvatarChoice] = useState<string>(AVATARS[0]);
  const [bio, setBio] = useState("");

  // Step 4: Preferences
  const [goal, setGoal] = useState<string>("both");
  const [skill, setSkill] = useState<string>("beginner");
  const [device, setDevice] = useState<string>("mobile");
  const [interests, setInterests] = useState<string[]>([]);
  const [preferredStyles, setPreferredStyles] = useState<string[]>([]);

  // Step 5: Region/Language/Consent
  const [region, setRegion] = useState("");
  const [language, setLanguage] = useState("");
  const [aiConsent, setAiConsent] = useState(false);
  const [guardianConsent, setGuardianConsent] = useState(false);

  const [step, setStep] = useState(1);

  useEffect(() => {
    (async () => {
      const userIdFromClerk = (window as any).Clerk?.user?.id || null;
      if (!userIdFromClerk) {
        navigate("/auth");
        return;
      }
      setUserId(userIdFromClerk);
      // Load existing to prefill
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name, bio, date_of_birth, age_tier, onboarding_complete, avatar_choice, goal, skill_level, device_type, interests, preferred_styles, region, language, ai_personalization_consent, guardian_consent")
        .eq("id", userIdFromClerk)
        .single();
      if (profile) {
        setUsername(profile.username ?? "");
        setDisplayName(profile.display_name ?? "");
        setBio(profile.bio ?? "");
        setDateOfBirth(profile.date_of_birth ?? "");
        setAvatarChoice(profile.avatar_choice ?? AVATARS[0]);
        setGoal(profile.goal ?? "both");
        setSkill(profile.skill_level ?? "beginner");
        setDevice(profile.device_type ?? "mobile");
        setInterests(Array.isArray(profile.interests) ? profile.interests : []);
        setPreferredStyles(Array.isArray(profile.preferred_styles) ? profile.preferred_styles : []);
        setRegion(profile.region ?? "");
        setLanguage(profile.language ?? "");
        setAiConsent(Boolean(profile.ai_personalization_consent));
        setGuardianConsent(Boolean(profile.guardian_consent));
        if (profile.onboarding_complete) {
          navigate("/feed");
          return;
        }
      }
      setLoading(false);
    })();
  }, [navigate]);

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!acceptTerms || !acceptPrivacy) {
        toast.error("You must accept Terms & Privacy.");
        return false;
      }
    }
    if (step === 2) {
      if (!dateOfBirth) {
        toast.error("Please provide your date of birth.");
        return false;
      }
      if (!username || !displayName) {
        toast.error("Username and display name are required.");
        return false;
      }
    }
    if (step === 3) {
      if (bio.length > 150) {
        toast.error("Bio must be 150 characters or less.");
        return false;
      }
    }
    if (step === 5) {
      const tier = computedTier;
      if (tier === 1 && !guardianConsent) {
        toast.error("Guardian consent is required for kids accounts.");
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    if (step < 5) {
      setStep(step + 1);
    } else {
      await handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const tier = computedTier;
      const payload = {
        display_name: displayName.trim(),
        bio: bio.trim(),
        date_of_birth: dateOfBirth || null,
        age_tier: tier,
        onboarding_complete: true,
        avatar_choice: avatarChoice,
        goal,
        skill_level: skill,
        device_type: device,
        interests,
        preferred_styles: preferredStyles,
        region: region || null,
        language: language || null,
        ai_personalization_consent: aiConsent,
        guardian_consent: guardianConsent,
      } as const;

      // Ensure username uniqueness and update username/display_name in profiles
      if (username) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .neq("id", userId);
        if (existing && existing.length > 0) {
          toast.error("Username is already taken.");
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({ username, ...payload })
        .eq("id", userId);
      if (error) throw error;
      toast.success("You're all set!");
      navigate("/feed");
    } catch (e: any) {
      toast.error(e.message || "Failed to save onboarding");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Welcome to playGen</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <p>Please review and accept the following to continue:</p>
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(Boolean(v))} />
                <Label htmlFor="terms">I agree to the Terms & Conditions</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="privacy" checked={acceptPrivacy} onCheckedChange={(v) => setAcceptPrivacy(Boolean(v))} />
                <Label htmlFor="privacy">I agree to the Privacy Policy</Label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                <p className="text-xs text-muted-foreground">Tier preview: {computedTier ?? "-"}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@handle" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display">Display Name</Label>
                  <Input id="display" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How others see you" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Choose an Avatar</Label>
                <div className="grid grid-cols-4 gap-3">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      className={`border rounded p-3 text-sm ${a === avatarChoice ? "border-primary" : "border-border/50"}`}
                      onClick={() => setAvatarChoice(a)}
                      type="button"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio (150 chars)</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={150} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Goal</Label>
                  <Select value={goal} onValueChange={setGoal}>
                    <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="create">Create</SelectItem>
                      <SelectItem value="play">Play</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Skill Level</Label>
                  <Select value={skill} onValueChange={setSkill}>
                    <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Device</Label>
                  <Select value={device} onValueChange={setDevice}>
                    <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Interests (comma separated)</Label>
                <Input value={interests.join(", ")} onChange={(e) => setInterests(e.target.value.split(",").map(s => s.trim()).filter(Boolean))} placeholder="Puzzle, Creative, Social" />
              </div>
              <div className="space-y-2">
                <Label>Preferred Styles (comma separated)</Label>
                <Input value={preferredStyles.join(", ")} onChange={(e) => setPreferredStyles(e.target.value.split(",").map(s => s.trim()).filter(Boolean))} placeholder="2D Platformer, Arcade" />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Region/Country</Label>
                  <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g., United States" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Input id="language" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="e.g., en" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="ai-consent" checked={aiConsent} onCheckedChange={(v) => setAiConsent(Boolean(v))} />
                <Label htmlFor="ai-consent">Allow AI personalization</Label>
              </div>
              {computedTier === 1 && (
                <div className="flex items-center space-x-2">
                  <Checkbox id="guardian" checked={guardianConsent} onCheckedChange={(v) => setGuardianConsent(Boolean(v))} />
                  <Label htmlFor="guardian">I confirm guardian consent is granted</Label>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={handleBack} disabled={step === 1 || saving}>Back</Button>
            <Button onClick={handleNext} disabled={saving}>{step < 5 ? "Next" : "Finish"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
