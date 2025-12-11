export type Skill = { name: string; proficiency?: string };

export type CandidateMini = {
  id: string;
  fullName: string;
  jobTitle?: string | null;
  location?: string | null;
  yearsExperience?: number | null;
  profilePhotoUrl?: string | null;
  skills?: Skill[];
};

export type ApplicationRow = {
  id: string;
  job: { id: string; title: string };
  candidate: CandidateMini;
  createdAt: string;
  status: string;
  yearsExp?: number | null;
  location?: string | null;
  matchScore?: number | null;
};
