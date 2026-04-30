/**
 * ============================================
 * МОДУЛЬ УПРАВЛЕНИЯ ТЕСТАМИ
 * ============================================
 */

// DOM Elements
const testsList = document.getElementById('testsList');
const testModal = document.getElementById('testModal');
const testForm = document.getElementById('testForm');
const modalTitle = document.getElementById('modalTitle');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('tests.html')) {
        checkAuth();
        loadTests();
    }
});

/**
 * Загрузка списка тестов
 */
function loadTests() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const allTests = JSON.parse(localStorage.getItem('tests')) || [];
    
    // Фильтрация тестов в зависимости от роли
    let userTests = allTests;
    if (currentUser.role === 'teacher') {
        userTests = allTests.filter(test => test.createdBy === currentUser.id);
    } else if (currentUser.role === 'student') {
        // Студенты видят все активные тесты
        userTests = allTests.filter(test => test.isActive !== false);
    }
    
    displayTests(userTests);
}

/**
 * Отображение списка тестов
 */
function displayTests(tests) {
    if (!testsList) return;
    
    if (tests.length === 0) {
        testsList.innerHTML = '<p style="color: var(--text-light); text-align: center;">Тесты пока не созданы</p>';
        return;
    }
    
    testsList.innerHTML = tests.map(test => {
        const subjectIcons = {
            'math': '📐',
            'physics': '⚛️',
            'cs': '💻'
        };
        
        const examTypes = {
            'OGE': 'ОГЭ',
            'EGE': 'ЕГЭ'
        };
        
        return `
            <div class="test-item">
                <div class="test-info">
                    <h3>${test.title}</h3>
                    <div class="test-meta">
                        <span>${subjectIcons[test.subject] || '📚'} ${getSubjectName(test.subject)}</span>
                        <span>${examTypes[test.examType] || test.examType}</span>
                        <span>⏱️ ${test.duration || 30} мин</span>
                        <span>📝 ${test.questionsCount || 10} вопросов</span>
                        <span>${formatDate(test.createdAt)}</span>
                    </div>
                    <p style="margin-top: 0.5rem; color: var(--text-light);">${test.description || 'Без описания'}</p>
                </div>
                <div class="test-actions">
                    ${getCurrentUserRole() === 'teacher' ? 
                        `<button class="btn-secondary" onclick="editTest('${test.id}')">Редактировать</button>` : ''}
                    <button class="btn-primary" onclick="startTest('${test.id}')">Пройти</button>
                    ${getCurrentUserRole() === 'teacher' ? 
                        `<button class="btn-secondary" style="background: var(--danger-color);" onclick="deleteTest('${test.id}')">Удалить</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Получение названия предмета
 */
function getSubjectName(subjectCode) {
    const subjects = {
        'math': 'Математика',
        'physics': 'Физика',
        'cs': 'Информатика'
    };
    return subjects[subjectCode] || subjectCode;
}

/**
 * Показать модальное окно создания/редактирования теста
 */
function showCreateTestModal(testId = null) {
    if (testId) {
        // Редактирование существующего теста
        const tests = JSON.parse(localStorage.getItem('tests')) || [];
        const test = tests.find(t => t.id === testId);
        if (test) {
            document.getElementById('testTitle').value = test.title;
            document.getElementById('testSubject').value = test.subject;
            document.getElementById('testExamType').value = test.examType;
            document.getElementById('testDuration').value = test.duration;
            document.getElementById('testQuestionsCount').value = test.questionsCount;
            document.getElementById('testDescription').value = test.description || '';
            modalTitle.textContent = 'Редактировать тест';
            testForm.dataset.editing = testId;
        }
    } else {
        // Создание нового теста
        testForm.reset();
        modalTitle.textContent = 'Создать новый тест';
        delete testForm.dataset.editing;
    }
    
    testModal.classList.remove('hidden');
}

/**
 * Скрыть модальное окно
 */
function hideTestModal() {
    testModal.classList.add('hidden');
    hideMessages();
}

/**
 * Обработка формы создания/редактирования теста
 */
testForm?.addEventListener('submit', function(e) {
    e.preventDefault();
    hideMessages();
    
    const formData = {
        title: document.getElementById('testTitle').value,
        subject: document.getElementById('testSubject').value,
        examType: document.getElementById('testExamType').value,
        duration: parseInt(document.getElementById('testDuration').value),
        questionsCount: parseInt(document.getElementById('testQuestionsCount').value),
        description: document.getElementById('testDescription').value,
        createdAt: new Date().toISOString(),
        isActive: true
    };
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    formData.createdBy = currentUser.id;
    formData.createdByName = currentUser.name;
    
    const tests = JSON.parse(localStorage.getItem('tests')) || [];
    
    if (testForm.dataset.editing) {
        // Редактирование существующего теста
        const testIndex = tests.findIndex(t => t.id === testForm.dataset.editing);
        if (testIndex !== -1) {
            formData.id = testForm.dataset.editing;
            formData.createdAt = tests[testIndex].createdAt; // Сохраняем оригинальную дату
            tests[testIndex] = formData;
            localStorage.setItem('tests', JSON.stringify(tests));
            showSuccess('Тест успешно обновлен!');
        }
    } else {
        // Создание нового теста
        formData.id = generateUUID();
        tests.push(formData);
        localStorage.setItem('tests', JSON.stringify(tests));
        showSuccess('Тест успешно создан!');
    }
    
    setTimeout(() => {
        hideTestModal();
        loadTests();
    }, 1000);
});

/**
 * Начать прохождение теста
 */
function startTest(testId) {
    window.location.href = `test-taking.html?id=${testId}`;
}

/**
 * Редактировать тест
 */
function editTest(testId) {
    showCreateTestModal(testId);
}

/**
 * Удалить тест
 */
function deleteTest(testId) {
    if (confirm('Вы уверены, что хотите удалить этот тест?')) {
        const tests = JSON.parse(localStorage.getItem('tests')) || [];
        const filteredTests = tests.filter(test => test.id !== testId);
        localStorage.setItem('tests', JSON.stringify(filteredTests));
        
        // Удалить связанные результаты
        const results = JSON.parse(localStorage.getItem('results')) || [];
        const filteredResults = results.filter(result => result.testId !== testId);
        localStorage.setItem('results', JSON.stringify(filteredResults));
        
        showSuccess('Тест успешно удален!');
        loadTests();
    }
}

/**
 * Вспомогательные функции
 */
function getCurrentUserRole() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    return currentUser?.role || 'guest';
}

function hideMessages() {
    const errorEl = document.getElementById('errorMessage');
    const successEl = document.getElementById('successMessage');
    if (errorEl) errorEl.classList.add('hidden');
    if (successEl) successEl.classList.add('hidden');
}

function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }
}

function showSuccess(message) {
    const successEl = document.getElementById('successMessage');
    if (successEl) {
        successEl.textContent = message;
        successEl.classList.remove('hidden');
    }
}