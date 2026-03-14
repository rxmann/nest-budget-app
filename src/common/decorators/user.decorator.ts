import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentUserType = {
  id: string;
  email: string;
  username: string;
};

// hardcoded until auth is wired
const MOCK_USER: CurrentUserType = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  email: 'test@budgets.com',
  username: 'testuser',
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): CurrentUserType => {
    return MOCK_USER;
  },
);