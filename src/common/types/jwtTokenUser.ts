export interface JwtTokenUser {
  username?: string | null;
  id: number | null;
  admin: boolean | null;
}

export const isJwtTokenUser = (candidate: unknown): candidate is JwtTokenUser => {
  const user = candidate as JwtTokenUser;
  return user.username !== undefined && user.id !== undefined && user.admin !== undefined;
};
