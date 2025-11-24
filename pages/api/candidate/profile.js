import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";

export default function CandidateProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // STEP 1: Get logged-in Supabase user
  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error(error);
      setUser(data?.user || null);
    };

    loadUser();
  }, []);

  // STEP 2: Fetch candidate profile once user is known
  useEffect(() => {
    if (!user) return; // prevents error

    const fetchProfile = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("candidate_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) console.error(error);
      setProfile(data || null);
      setLoading(false);
    };

    fetchProfile();
  }, [user]); // <-- this is the correct dependency

  if (!user) return <p>Loading user…</p>;
  if (loading) return <p>Loading profile…</p>;

  return (
    <div>
      <h1>Your Candidate Profile</h1>
      {profile ? (
        <pre>{JSON.stringify(profile, null, 2)}</pre>
      ) : (
        <p>No profile found yet.</p>
      )}
    </div>
  );
}
