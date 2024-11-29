document.querySelector('form').addEventListener('submit', function(e) {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // Check if username is empty
  if (username.trim() === '') {
    alert('Username is required');
    e.preventDefault(); // Prevent form submission
    return;
  }

  // Check password validity
  if (password.length < 8) {
    alert('Password must be at least 8 characters long');
    e.preventDefault(); // Prevent form submission
  } else if (!/[A-Z]/.test(password)) {
    alert('Password must contain at least one uppercase letter');
    e.preventDefault(); // Prevent form submission
  } else if (!/[0-9]/.test(password)) {
    alert('Password must contain at least one number');
    e.preventDefault(); // Prevent form submission
  }
});
