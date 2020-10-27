import { UsernamePasswordInput } from '../resolvers/UsernamePasswordInput';
import { validateEmail } from './validateEmail';
import { validatePassword } from './validatePassword';
import { validationErrors } from './validationErrors';

export const validateRegister = (options: UsernamePasswordInput) => {
  const validateUser = /^[a-zA-Z][a-zA-Z0-9]{2,}/;

  if (!validateEmail(options.email)) {
    return [validationErrors.validateEmail];
  }

  if (options.username.length <= 2) {
    return [validationErrors.validateUsernameLength];
  }

  if (!validateUser.test(options.username)) {
    return [validationErrors.validateUsernameChars];
  }

  if (!validatePassword(options.password)) {
    return [validationErrors.validatePassword];
  }

  return null;
};
