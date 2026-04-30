/**
 * ============================================
 * МОДУЛЬ ПРОСМОТРА РЕЗУЛЬТАТОВ
 * ============================================
 */

// DOM Elements
const resultsList = document.getElementById('resultsList');
const singleResultView = document.getElementById('singleResultView');
const resultsTitle = document.getElementById('resultsTitle');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('results.html')) {
        checkAuth();
        const urlParams = new URLSearchParams(window.location.search);
        const resultId = urlParams.get('resultId');
        
        if (resultId) {
            loadSingleResult(resultId);
        } else {
            loadResultsList();
        }
    }
});

/**
 * Загрузка списка результатов
 */
function loadResultsList() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const allResults = JSON.parse(localStorage.getItem('results')) || [];
    
    // Фильтрация результатов в зависимости от роли
    let userResults = allResults;
    if (currentUser.role === 'teacher') {
        // Преподаватели видят все результаты
        userResults = allResults;
    } else if (currentUser.role === 'student') {
        // Студенты видят только свои результаты
        userResults = allResults.filter(result => result.studentId === currentUser.id);
    }
    
    displayResultsList(userResults);
}

/**
 * Отображение списка результатов
 */
function displayResultsList(results) {
    if (!resultsList) return;
    
    if (results.length === 0) {
        resultsList.innerHTML = '<p style="color: var(--text-light); text-align: center;">Результаты пока отсутствуют</p>';
        return;
    }
    
    // Сортировка по дате (новые сверху)
    results.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    
    resultsList.innerHTML = results.map(result => {
        const gradeColor = result.score >= 80 ? 'var(--success-color)' : 
                          result.score >= 60 ? 'var(--warning-color)' : 'var(--danger-color)';
        
        return `
            <div class="test-item">
                <div class="test-info">
                    <h3>${result.testName}</h3>
                    <div class="test-meta">
                        ${currentUser.role === 'teacher' ? 
                            `<span>👤 ${result.studentName}</span>` : ''}
                        <span>📊 <strong style="color: ${gradeColor};">${result.score}%</strong></span>
                        <span>✅ ${result.correctAnswers}/${result.totalQuestions}</span>
                        <span>⏱️ ${Math.floor(result.timeSpent / 60)} мин</span>
                        <span>${formatDate(result.completedAt)}</span>
                    </div>
                </div>
                <div class="test-actions">
                    <button class="btn-primary" onclick="viewResultDetails('${result.id}')">Подробнее</button>
                    ${currentUser.role === 'teacher' ? 
                        `<button class="btn-secondary" onclick="downloadResult('${result.id}')">Экспорт</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Загрузка детального результата
 */
function loadSingleResult(resultId) {
    const results = JSON.parse(localStorage.getItem('results')) || [];
    const result = results.find(r => r.id === resultId);
    
    if (!result) {
        showError('Результат не найден');
        setTimeout(() => {
            window.location.href = 'results.html';
        }, 2000);
        return;
    }
    
    // Показываем детальный просмотр
    if (singleResultView) {
        singleResultView.classList.remove('hidden');
    }
    if (resultsList) {
        resultsList.classList.add('hidden');
    }
    if (resultsTitle) {
        resultsTitle.textContent = 'Детальный результат';
    }
    
    displaySingleResult(result);
}

/**
 * Отображение детального результата
 */
function displaySingleResult(result) {
    // Обновление основной информации
    document.getElementById('resultTestName').textContent = result.testName;
    document.getElementById('resultScore').textContent = `${result.score}%`;
    document.getElementById('resultCorrect').textContent = result.correctAnswers;
    document.getElementById('resultTotal').textContent = result.totalQuestions;
    document.getElementById('resultTime').textContent = `${Math.floor(result.timeSpent / 60)} мин ${result.timeSpent % 60} сек`;
    document.getElementById('resultDate').textContent = formatDate(result.completedAt);
    
    // Создание детального разбора (демо-данные)
    const answersDetail = document.getElementById('answersDetail');
    if (answersDetail) {
        let answersHTML = '';
        const totalQuestions = result.totalQuestions || 10;
        
        for (let i = 0; i < totalQuestions; i++) {
            const isCorrect = i < result.correctAnswers;
            const answer = result.answers?.[i] || 'Не отвечен';
            
            answersHTML += `
                <div class="test-item" style="background: ${isCorrect ? '#dcfce7' : '#fee2e2'}; border-left: 4px solid ${isCorrect ? '#10b981' : '#ef4444'};">
                    <div class="test-info">
                        <h4>Вопрос ${i + 1}</h4>
                        <p style="margin-top: 0.5rem;">${isCorrect ? '✅ Правильно' : '❌ Неправильно'}</p>
                        <p style="color: var(--text-light); margin-top: 0.5rem;">Ваш ответ: ${answer}</p>
                        ${!isCorrect ? '<p style="color: var(--text-light); margin-top: 0.5rem;">Правильный ответ: C) 18</p>' : ''}
                    </div>
                </div>
            `;
        }
        
        answersDetail.innerHTML = answersHTML;
    }
}

/**
 * Просмотр деталей результата
 */
function viewResultDetails(resultId) {
    window.location.href = `results.html?resultId=${resultId}`;
}

/**
 * Экспорт результата
 */
function downloadResult(resultId) {
    const results = JSON.parse(localStorage.getItem('results')) || [];
    const result = results.find(r => r.id === resultId);
    
    if (result) {
        const dataStr = JSON.stringify(result, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `result_${resultId}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showSuccess('Результат успешно экспортирован!');
    }
}

// Глобальные переменные для доступа из других функций
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

function showError(message) {
    console.error(message);
}

function showSuccess(message) {
    console.log(message);
}