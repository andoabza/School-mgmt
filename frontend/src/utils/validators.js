// utils/validators.js
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Minimum 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('At least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('At least one special character');
  }
  
  return errors;
}
export default { validatePassword };