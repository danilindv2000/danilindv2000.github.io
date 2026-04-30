/**
 * ============================================
 * МОДУЛЬ УПРАВЛЕНИЯ ГРУППАМИ
 * ============================================
 */

// DOM Elements
const groupsList = document.getElementById('groupsList');
const groupModal = document.getElementById('groupModal');
const groupForm = document.getElementById('groupForm');
const groupModalTitle = document.getElementById('groupModalTitle');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('groups.html')) {
        checkAuth();
        // Только преподаватели и администраторы могут управлять группами
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser.role === 'student') {
            window.location.href = 'dashboard.html';
            return;
        }
        loadGroups();
    }
});

/**
 * Загрузка списка групп
 */
function loadGroups() {
    const groups = JSON.parse(localStorage.getItem('groups')) || [];
    displayGroups(groups);
}

/**
 * Отображение списка групп
 */
function displayGroups(groups) {
    if (!groupsList) return;
    
    if (groups.length === 0) {
        groupsList.innerHTML = '<p style="color: var(--text-light); text-align: center;">Группы пока не созданы</p>';
        return;
    }
    
    groupsList.innerHTML = groups.map(group => {
        const subjectIcons = {
            'math': '📐',
            'physics': '⚛️',
            'cs': '💻'
        };
        
        // Подсчет студентов в группе
        const students = JSON.parse(localStorage.getItem('users')) || [];
        const groupStudents = students.filter(s => s.class === group.name).length;
        
        return `
            <div class="test-item">
                <div class="test-info">
                    <h3>${group.name}</h3>
                    <div class="test-meta">
                        <span>${subjectIcons[group.subject] || '📚'} ${getSubjectName(group.subject)}</span>
                        <span>👥 Студентов: ${groupStudents}</span>
                        <span>${formatDate(group.createdAt)}</span>
                    </div>
                    <p style="margin-top: 0.5rem; color: var(--text-light);">${group.description || 'Без описания'}</p>
                </div>
                <div class="test-actions">
                    <button class="btn-secondary" onclick="editGroup('${group.id}')">Редактировать</button>
                    <button class="btn-secondary" style="background: var(--danger-color);" onclick="deleteGroup('${group.id}')">Удалить</button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Показать модальное окно создания/редактирования группы
 */
function showCreateGroupModal(groupId = null) {
    if (groupId) {
        // Редактирование существующей группы
        const groups = JSON.parse(localStorage.getItem('groups')) || [];
        const group = groups.find(g => g.id === groupId);
        if (group) {
            document.getElementById('groupName').value = group.name;
            document.getElementById('groupSubject').value = group.subject;
            document.getElementById('groupDescription').value = group.description || '';
            groupModalTitle.textContent = 'Редактировать группу';
            groupForm.dataset.editing = groupId;
        }
    } else {
        // Создание новой группы
        groupForm.reset();
        groupModalTitle.textContent = 'Создать новую группу';
        delete groupForm.dataset.editing;
    }
    
    groupModal.classList.remove('hidden');
}

/**
 * Скрыть модальное окно
 */
function hideGroupModal() {
    groupModal.classList.add('hidden');
    hideGroupMessages();
}

/**
 * Обработка формы создания/редактирования группы
 */
groupForm?.addEventListener('submit', function(e) {
    e.preventDefault();
    hideGroupMessages();
    
    const formData = {
        name: document.getElementById('groupName').value,
        subject: document.getElementById('groupSubject').value,
        description: document.getElementById('groupDescription').value,
        createdAt: new Date().toISOString()
    };
    
    const groups = JSON.parse(localStorage.getItem('groups')) || [];
    
    if (groupForm.dataset.editing) {
        // Редактирование существующей группы
        const groupIndex = groups.findIndex(g => g.id === groupForm.dataset.editing);
        if (groupIndex !== -1) {
            formData.id = groupForm.dataset.editing;
            formData.createdAt = groups[groupIndex].createdAt; // Сохраняем оригинальную дату
            groups[groupIndex] = formData;
            localStorage.setItem('groups', JSON.stringify(groups));
            showGroupSuccess('Группа успешно обновлена!');
        }
    } else {
        // Создание новой группы
        formData.id = generateUUID();
        groups.push(formData);
        localStorage.setItem('groups', JSON.stringify(groups));
        showGroupSuccess('Группа успешно создана!');
    }
    
    setTimeout(() => {
        hideGroupModal();
        loadGroups();
    }, 1000);
});

/**
 * Редактировать группу
 */
function editGroup(groupId) {
    showCreateGroupModal(groupId);
}

/**
 * Удалить группу
 */
function deleteGroup(groupId) {
    if (confirm('Вы уверены, что хотите удалить эту группу?')) {
        const groups = JSON.parse(localStorage.getItem('groups')) || [];
        const filteredGroups = groups.filter(group => group.id !== groupId);
        localStorage.setItem('groups', JSON.stringify(filteredGroups));
        showGroupSuccess('Группа успешно удалена!');
        loadGroups();
    }
}

/**
 * Вспомогательные функции
 */
function hideGroupMessages() {
    const errorEl = document.getElementById('groupErrorMessage');
    const successEl = document.getElementById('groupSuccessMessage');
    if (errorEl) errorEl.classList.add('hidden');
    if (successEl) successEl.classList.add('hidden');
}

function showGroupError(message) {
    const errorEl = document.getElementById('groupErrorMessage');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }
}

function showGroupSuccess(message) {
    const successEl = document.getElementById('groupSuccessMessage');
    if (successEl) {
        successEl.textContent = message;
        successEl.classList.remove('hidden');
    }
}

// Вспомогательные функции (дублируются для независимости модуля)
function getSubjectName(subjectCode) {
    const subjects = {
        'math': 'Математика',
        'physics': 'Физика',
        'cs': 'Информатика'
    };
    return subjects[subjectCode] || subjectCode;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function generateUUID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}