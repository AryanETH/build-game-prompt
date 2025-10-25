import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/auth");
        return;
      }

      // Optional: redirect if onboarding not complete
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", data.session.user.id)
        .single();

      if (!profile?.onboarding_complete) {
        navigate("/onboarding");
        return;
      }

      setLoading(false);
    })();
  }, [navigate]);

  if (loading) return <div>Loading...</div>;

  return <>{children}</>;
};      if (!userIdFromSupabase) {
        navigate("/auth");
        return;
      }
      setUserId(userIdFromSupabase);
      // Load existing to prefill
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name, bio, date_of_birth, age_tier, onboarding_complete, avatar_choice, goal, skill_level, device_type, interests, preferred_styles, region, language, ai_personalization_consent, guardian_consent")
        .eq("id", userIdFromSupabase)
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
