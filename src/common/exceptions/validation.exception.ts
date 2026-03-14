import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

export class ValidationException extends AppException {
  constructor(message = 'Validation failed') {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}