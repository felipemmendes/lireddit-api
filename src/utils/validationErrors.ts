export const validationErrors = {
  validateEmail: {
    field: 'email',
    message: 'invalid email',
  },
  validateUsernameLength: {
    field: 'username',
    message: 'length must be greater than 2',
  },
  validateUsernameChars: {
    field: 'username',
    message: 'alphanumeric only, starting with a letter',
  },
  validatePassword: {
    field: 'password',
    message: 'length must be at least 6',
  },
  validateNewPassword: {
    field: 'newPassword',
    message: 'length must be at least 6',
  },
  tokenExpired: {
    field: 'token',
    message: 'token expired',
  },
  tokenUserNotFound: {
    field: 'token',
    message: 'user no longer exists',
  },
};
