// register response — no token, just confirmation
export class RegisterResponseDto {
  id: string;
  email: string;
  username: string;
}

// login response — user info only, token goes in cookie
export class LoginResponseDto {
  id: string;
  email: string;
  username: string;
  roles: string[];
}
