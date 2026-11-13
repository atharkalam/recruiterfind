export type RecruiterResult = {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  linkedin_url: string;
  email: string | null;
  email_confidence: 'verified' | null;
  hiring_score: number;
  last_post_date: string | null;
  last_post_text: string | null;
  profile_image: string | null;
  email_draft?: string | null;
};

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type Order = {
  id: string;
  user_id: string;
  created_at: string;
  company: string;
  country: string;
  requested_count: number;
  actual_count: number;
  status: OrderStatus;
  results: RecruiterResult[] | null;
  error: string | null;
  query_text: string;
  role_type: string;
  activity_window: string;
  user_name: string;
  user_title: string;
  user_email_domain: string;
};

export type Configuration = {
  id: string;
  user_id: string;
  anthropic_api_key: string | null;
  apify_api_key: string | null;
  openai_api_key: string | null;
  custom_email_prompt: string | null;
  created_at: string;
  updated_at: string;
};

export type ScrapeRequest = {
  company: string;
  country: string;
  requested_count: number;
  role_type: string;
  activity_window: '7d' | '30d' | '90d' | 'any';
  user_name: string;
  user_title: string;
  user_email_domain: string;
};
