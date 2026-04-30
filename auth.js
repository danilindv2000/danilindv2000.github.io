/**
 * ============================================
 * МОДУЛЬ АВТОРИЗАЦИИ И РЕГИСТРАЦИИ
 * ============================================
 */

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');
const registerSwitch = document.getElementById('registerSwitch');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const registerRole = document.getElementById('registerRole');
const studentFields = document.getElementById('studentFields');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        window.location.href = 'dashboard.html';
    }

    // Event Listeners
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForms(true);
        });
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForms(false);
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (registerRole) {
        registerRole.addEventListener('change', (e) => {
            if (e.target.value === 'student') {
                studentFields.classList.remove('hidden');
            } else {
                studentFields.classList.add('hidden');
            }
        });
    }
});

/**
 * Переключение между формами входа и регистрации
 */
function toggleForms(showRegister) {
    if (showRegister) {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        registerSwitch.classList.remove('hidden');
    } else {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        registerSwitch.classList.add('hidden');
    }
    hideMessages();
}

/**
 * Обработка входа в систему
 */
function handleLogin(e) {
    e.preventDefault();
    hideMessages();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];

    // Find user
    const user = users.find(u => u.email === email && u.password === password && u.role === role);

    if (user) {
        // Login successful
        user.lastLogin = new Date().toISOString();
        
        // Save current user
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Update users array
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            users[userIndex] = user;
            localStorage.setItem('users', JSON.stringify(users));
        }

        showSuccess('Вход выполнен успешно! Перенаправление...');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    } else {
        showError('Неверный email, пароль или роль');
    }
}

/**
 * Обработка регистрации
 */
function handleRegister(e) {
    e.preventDefault();
    hideMessages();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    const userClass = document.getElementById('registerClass')?.value || '';

    // Get existing users
    const users = JSON.parse(localStorage.getItem('users')) || [];

    // Check if user already exists
    if (users.find(u => u.email === email)) {
        showError('Пользователь с таким email уже существует');
        return;
    }

    // Create new user
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        role,
        class: userClass,
        createdAt: new Date().toISOString(),
        lastLogin: null
    };

    // Save user
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));

    showSuccess('Регистрация успешна! Перенаправление...');
    
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
}

/**
 * Показать сообщение об ошибке
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
}

/**
 * Показать сообщение об успехе
 */
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
}

/**
 * Скрыть все сообщения
 */
function hideMessages() {
    errorMessage.classList.add('hidden');
    successMessage.classList.add('hidden');
}

/**
 * Выход из системы
 */
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'auth.html';
}