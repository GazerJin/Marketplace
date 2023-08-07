// Function to show the sidebar when the username is clicked
function showSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.style.right = '0';
}

// Function to hide the sidebar when the close button is clicked
function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.style.right = '-250px';
}

// JavaScript code to update the username-placeholder element
// Get the username from the query parameter
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

// Update the content of the username-placeholder element
const usernamePlaceholder = document.getElementById('username-placeholder');
if (username) {
  usernamePlaceholder.textContent = username;
}

// Add event listener to show the sidebar when the username is clicked
usernamePlaceholder.addEventListener('click', () => {
  showSidebar();
});


