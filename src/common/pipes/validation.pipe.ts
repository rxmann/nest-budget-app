import {
  ValidationPipe,
  UnprocessableEntityException,
  ValidationError,
} from '@nestjs/common';

export const AppValidationPipe = new ValidationPipe({
  whitelist: true, // strip unknown fields
  forbidNonWhitelisted: true, // throw if unknown fields sent
  transform: true, // auto transform to DTO class instances
  transformOptions: {
    enableImplicitConversion: true, // convert primitives automatically
  },
  exceptionFactory: (errors: ValidationError[]) => {
    const messages = flattenErrors(errors);
    return new UnprocessableEntityException(messages.join(', '));
  },
});

function flattenErrors(errors: ValidationError[], parent = ''): string[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;

    if (error.children?.length) {
      return flattenErrors(error.children, field);
    }

    return Object.values(error.constraints ?? {}).map(
      (msg) => `${field}: ${msg}`,
    );
  });
}