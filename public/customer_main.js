// customer_main.js
document.addEventListener('DOMContentLoaded', function() {
    // Handle profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateProfile();
        });
    }
});

function toggleSidebar() {
    const sidebar = document.getElementById('profileSidebar');
    const mainContent = document.querySelector('.main-content');
    sidebar.classList.toggle('active');
    mainContent.classList.toggle('shifted');
}

function updateProfile() {
    const formData = {
        username: document.getElementById('username').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value
    };

    fetch('/update-profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Profile updated successfully!');
            toggleSidebar();
        } else {
            alert('Failed to update profile');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating profile');
    });
}

function addToCart(productId, productName, productPrice) {
    fetch('/add-to-cart', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
            productId, 
            productName, 
            productPrice 
        })
    })
    .then(response => {
        if (response.ok) {
            alert('Added ' + productName + ' to cart!');
        } else {
            alert('Failed to add product to cart.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while adding to cart');
    });
}