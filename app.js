/**
 * ============================================
 * ОСНОВНОЙ МОДУЛЬ ПРИЛОЖЕНИЯ
 * ============================================
 */

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDashboardData();
});

/**
 * Проверка авторизации
 */
function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const currentPage = window.location.pathname;
    
    // If not logged in and not on auth/index page, redirect to auth
    if (!currentUser && !currentPage.includes('auth.html') && !currentPage.includes('index.html')) {
        window.location.href = 'auth.html';
    }
    
    // If logged in and on auth/index page, redirect to dashboard
    if (currentUser && (currentPage.includes('auth.html') || currentPage.includes('index.html'))) {
        window.location.href = 'dashboard.html';
    }
    
    // Update user info if on dashboard
    if (currentUser && currentPage.includes('dashboard.html')) {
        updateUserGreeting(currentUser);
    }
}

/**
 * Обновление приветствия пользователя
 */
function updateUserGreeting(user) {
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        const roleNames = {
            'student': 'Студент',
            'teacher': 'Преподаватель',
            'admin': 'Администратор'
        };
        welcomeMessage.textContent = `Добро пожаловать, ${user.name}!`;
    }
}

/**
 * Загрузка данных для панели управления
 */
function loadDashboardData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    // Get all tests and results
    const tests = JSON.parse(localStorage.getItem('tests')) || [];
    const results = JSON.parse(localStorage.getItem('results')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];

    // Filter based on user role
    let userTests = tests;
    let userResults = results;
    
    if (currentUser.role === 'student') {
        userResults = results.filter(r => r.studentId === currentUser.id);
    } else if (currentUser.role === 'teacher') {
        // Teachers see tests they created
        userTests = tests.filter(t => t.createdBy === currentUser.id);
    }

    // Update statistics
    updateStatistics(userTests, userResults, users, currentUser.role);
    
    // Load recent tests
    loadRecentTests(userTests, userResults);
}

/**
 * Обновление статистики
 */
function updateStatistics(tests, results, users, role) {
    const totalTestsEl = document.getElementById('totalTests');
    const completedTestsEl = document.getElementById('completedTests');
    const averageScoreEl = document.getElementById('averageScore');
    const activeStudentsEl = document.getElementById('activeStudents');

    if (totalTestsEl) totalTestsEl.textContent = tests.length;
    
    if (completedTestsEl) {
        completedTestsEl.textContent = results.length;
    }
    
    if (averageScoreEl) {
        if (results.length > 0) {
            const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
            averageScoreEl.textContent = Math.round(avgScore) + '%';
        } else {
            averageScoreEl.textContent = '0%';
        }
    }
    
    if (activeStudentsEl) {
        if (role === 'teacher' || role === 'admin') {
            const students = users.filter(u => u.role === 'student');
            activeStudentsEl.textContent = students.length;
        } else {
            activeStudentsEl.textContent = '1';
        }
    }
}

/**
 * Загрузка последних тестов
 */
function loadRecentTests(tests, results) {
    const recentTestsContainer = document.getElementById('recentTests');
    if (!recentTestsContainer) return;

    // Sort tests by creation date and take last 5
    const recentTests = tests
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    if (recentTests.length === 0) {
        recentTestsContainer.innerHTML = '<p style="color: var(--text-light); text-align: center;">Тесты пока не созданы</p>';
        return;
    }

    recentTestsContainer.innerHTML = recentTests.map(test => {
        const testResults = results.filter(r => r.testId === test.id);
        const avgScore = testResults.length > 0 
            ? Math.round(testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length)
            : 0;

        return `
            <div class="test-item">
                <div class="test-info">
                    <h3>${test.title}</h3>
                    <div class="test-meta">
                        <span>📝 ${test.questions?.length || 0} вопросов</span>
                        <span>⏱️ ${test.duration || 30} мин</span>
                        <span> ${testResults.length} попыток</span>
                        <span>📊 Средний балл: ${avgScore}%</span>
                    </div>
                </div>
                <div class="test-actions">
                    <button class="btn-secondary" onclick="window.location.href='test-taking.html?id=${test.id}'">
                        Пройти
                    </button>
                    <button class="btn-primary" onclick="window.location.href='results.html?testId=${test.id}'">
                        Результаты
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Выход из системы
 */
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'auth.html';
}

/**
 * Утилита: Форматирование даты
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Утилита: Генерация UUID
 */
function generateUUID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}