function validateName(name) {
  return name.length >= 1;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  // Minimum 8 characters, contains letters and digits
  const hasMinLength = password.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasDigits = /\d/.test(password);
  return hasMinLength && hasLetters && hasDigits;
}

if (typeof module !== 'undefined' && module.exports) {
  // Node.js/CommonJS
  module.exports = {
    validateName,
    validateEmail,
    validatePassword
  };
} else {
  // Browser global
  window.userValidation = {
    validateName,
    validateEmail,
    validatePassword
  };
}