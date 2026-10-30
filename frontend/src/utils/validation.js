// Client-side validation is for convenience only; the backend repeats every check.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Enter your email address.';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export function validatePassword(password) {
  if (!password || password.length < 8) return 'Use at least 8 characters.';
  if (new TextEncoder().encode(password).length > 72) return 'Use at most 72 bytes (about 72 characters).';
  return '';
}

export function validateRegister({ name, email, password, confirmPassword }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Enter your name.';
  else if (name.trim().length > 100) errors.name = 'Use at most 100 characters.';
  if (!email.trim()) errors.email = 'Enter your email address.';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.';
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  if (confirmPassword !== password) errors.confirmPassword = 'The passwords do not match.';
  return errors;
}

export function validateItem({ title, description, location, status, categoryId }) {
  const errors = {};
  if (!title.trim()) errors.title = 'Give the item a short title.';
  else if (title.trim().length > 255) errors.title = 'Use at most 255 characters.';
  if (!location.trim()) errors.location = 'Say where it was lost or found.';
  else if (location.trim().length > 255) errors.location = 'Use at most 255 characters.';
  if (description.trim().length > 1000) errors.description = 'Use at most 1000 characters.';
  if (status !== 'LOST' && status !== 'FOUND') errors.status = 'Choose Lost or Found.';
  if (!categoryId) errors.categoryId = 'Choose a category.';
  return errors;
}

export function validateClaimMessage(message) {
  const trimmed = message.trim();
  if (trimmed.length < 10) return 'Describe how you can prove this is yours (at least 10 characters).';
  if (trimmed.length > 1000) return 'Use at most 1000 characters.';
  return '';
}

export function validateCategory({ name, description }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Enter a category name.';
  else if (name.trim().length > 255) errors.name = 'Use at most 255 characters.';
  if (description.trim().length > 255) errors.description = 'Use at most 255 characters.';
  return errors;
}

export function validateProfile({ name, currentPassword, newPassword }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Enter your name.';
  else if (name.trim().length > 100) errors.name = 'Use at most 100 characters.';
  if (newPassword) {
    const passwordError = validatePassword(newPassword);
    if (passwordError) errors.newPassword = passwordError;
    if (!currentPassword) errors.currentPassword = 'Enter your current password to set a new one.';
  }
  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
