export interface RawJob {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string;
  job_type?: string;
  remote_type?: string;
  experience_level?: string;
  skills?: string[];
  tags?: string[];
  posted_date?: string | number | null;
  source: string;
  source_url?: string;
  external_id: string;
}

export interface JobSource {
  name: string;
  fetch(): Promise<RawJob[]>;
}
