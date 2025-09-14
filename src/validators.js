export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    throw new Error('Invalid email format');
  }
};

export const validatePhone = (phone) => {
  const re = /^\+?[1-9]\d{1,14}$/; // E.164 format
  if (!re.test(phone)) {
    throw new Error('Invalid phone number format');
  }
};

export const validatePassword = (password) => {
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
};

export const validateUsername = (username) => {
  const re = /^[a-zA-Z0-9_]+$/;
  if (!re.test(username)) {
    throw new Error('Username can only contain letters, numbers and underscores');
  }
  if (username.length < 3 || username.length > 30) {
    throw new Error('Username must be between 3 and 30 characters');
  }
};