import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

export class AuthException extends AppException {
  constructor(message = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}