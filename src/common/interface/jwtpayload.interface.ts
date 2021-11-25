export interface JWTPayload {
  id: number;
  email: string;
  is_admin: boolean;
  name: string;
  email_confirmed: boolean;
  credentials_id: number;
  created_at: Date;
  updated_at: Date;
}
