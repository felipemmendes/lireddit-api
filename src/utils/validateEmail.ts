export const validateEmail = (email: string) => {
  const emailValidation = /\S+@\S+\.\S+/;

  return emailValidation.test(email);
};
