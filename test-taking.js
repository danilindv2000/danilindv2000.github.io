/**
 * ============================================
 * МОДУЛЬ ПРОХОЖДЕНИЯ ТЕСТА
 * ============================================
 */

// Global variables
let currentTest = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let testTimer = null;
let timeRemaining = 0;
let autoSaveInterval = null;

// DOM Elements
const testTitle = document.getElementById('testTitle');
const testInfo = document.getElementById('testInfo');
const timerElement = document.getElementById('timer');
const questionNumber = document.getElementById('questionNumber');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const finishBtn = document.getElementById('finishBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('test-taking.html')) {
        checkAuth();
        const urlParams = new URLSearchParams(window.location.search);
        const testId = urlParams.get('id');
        if (testId) {
            loadTest(testId);
        } else {
            showError('Тест не найден');
            setTimeout(() => {
                window.location.href = 'tests.html';
            }, 2000);
        }
    }
});

/**
 * Загрузка теста
 */
function loadTest(testId) {
    const tests = JSON.parse(localStorage.getItem('tests')) || [];
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
        showError('Тест не найден');
        setTimeout(() => {
            window.location.href = 'tests.html';
        }, 2000);
        return;
    }
    
    currentTest = test;
    currentQuestionIndex = 0;
    userAnswers = {};
    
    // Инициализация таймера
    timeRemaining = (test.duration || 30) * 60; // Convert to seconds
    updateTimerDisplay();
    startTimer();
    
    // Загрузка вопросов (создаем демо-вопросы)
    createDemoQuestions(test);
    
    // Запуск автосохранения каждые 2 минуты
    startAutoSave();
    
    displayQuestion();
}

/**
 * Создание демо-вопросов для теста
 */
function createDemoQuestions(test) {
    if (!currentTest.questions) {
        currentTest.questions = [];
        const questionTypes = ['single_choice', 'multiple_choice', 'text_input'];
        
        for (let i = 0; i < (test.questionsCount || 10); i++) {
            const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
            currentTest.questions.push({
                id: generateUUID(),
                number: i + 1,
                text: `Вопрос ${i + 1}: Найдите значение выражения: ${Math.floor(Math.random() * 10) + 1}³ + ${Math.floor(Math.random() * 10) + 1}² × ${Math.floor(Math.random() * 5) + 2}`,
                type: questionType,
                options: questionType === 'single_choice' ? [
                    { id: 'A', text: `${Math.floor(Math.random() * 100) + 10}` },
                    { id: 'B', text: `${Math.floor(Math.random() * 100) + 10}` },
                    { id: 'C', text: `${Math.floor(Math.random() * 100) + 10}` },
                    { id: 'D', text: `${Math.floor(Math.random() * 100) + 10}` }
                ] : null,
                correctAnswer: questionType === 'single_choice' ? 'C' : null
            });
        }
    }
}

/**
 * Отображение текущего вопроса
 */
function displayQuestion() {
    if (!currentTest.questions || currentQuestionIndex >= currentTest.questions.length) return;
    
    const question = currentTest.questions[currentQuestionIndex];
    
    // Обновление заголовка теста
    if (testTitle) {
        testTitle.textContent = currentTest.title;
    }
    
    if (testInfo) {
        testInfo.textContent = `${getSubjectName(currentTest.subject)} • ${currentTest.examType} • ${currentTest.duration} мин`;
    }
    
    // Обновление номера вопроса
    if (questionNumber) {
        questionNumber.textContent = `Вопрос ${currentQuestionIndex + 1} из ${currentTest.questions.length}`;
    }
    
    // Обновление текста вопроса
    if (questionText) {
        questionText.textContent = question.text;
    }
    
    // Обновление вариантов ответов
    if (optionsContainer) {
        if (question.type === 'single_choice' && question.options) {
            optionsContainer.innerHTML = question.options.map((option, index) => {
                const isSelected = userAnswers[currentQuestionIndex] === option.id;
                return `
                    <div class="test-item" style="margin: 0.5rem 0; padding: 1rem; cursor: pointer; background: ${isSelected ? '#dbeafe' : '#f3f4f6'};" 
                         onclick="selectAnswer('${option.id}')">
                        <strong>${String.fromCharCode(65 + index)}.</strong> ${option.text}
                    </div>
                `;
            }).join('');
        } else if (question.type === 'text_input') {
            optionsContainer.innerHTML = `
                <div class="form-group">
                    <label>Введите ваш ответ:</label>
                    <input type="text" id="textInput" class="form-control" 
                           value="${userAnswers[currentQuestionIndex] || ''}" 
                           oninput="saveTextInput(this.value)">
                </div>
            `;
        }
    }
    
    // Обновление кнопок навигации
    if (prevBtn) {
        prevBtn.disabled = currentQuestionIndex === 0;
    }
    
    if (nextBtn && finishBtn) {
        if (currentQuestionIndex === currentTest.questions.length - 1) {
            nextBtn.style.display = 'none';
            finishBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            finishBtn.style.display = 'none';
        }
    }
}

/**
 * Выбор ответа
 */
function selectAnswer(optionId) {
    userAnswers[currentQuestionIndex] = optionId;
    displayQuestion(); // Обновить отображение
}

/**
 * Сохранение текстового ответа
 */
function saveTextInput(value) {
    userAnswers[currentQuestionIndex] = value;
}

/**
 * Переход к следующему вопросу
 */
function nextQuestion() {
    if (currentQuestionIndex < currentTest.questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

/**
 * Переход к предыдущему вопросу
 */
function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

/**
 * Завершение теста
 */
function finishTest() {
    if (confirm('Вы уверены, что хотите завершить тест?')) {
        calculateResults();
    }
}

/**
 * Расчет результатов
 */
function calculateResults() {
    clearInterval(testTimer);
    clearInterval(autoSaveInterval);
    
    let correctAnswers = 0;
    const totalQuestions = currentTest.questions.length;
    
    currentTest.questions.forEach((question, index) => {
        if (question.type === 'single_choice') {
            if (userAnswers[index] === question.correctAnswer) {
                correctAnswers++;
            }
        }
        // Для других типов вопросов можно добавить логику позже
    });
    
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const result = {
        id: generateUUID(),
        testId: currentTest.id,
        testName: currentTest.title,
        studentId: JSON.parse(localStorage.getItem('currentUser')).id,
        studentName: JSON.parse(localStorage.getItem('currentUser')).name,
        score: score,
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions,
        timeSpent: (currentTest.duration * 60) - timeRemaining,
        completedAt: new Date().toISOString(),
        answers: { ...userAnswers }
    };
    
    // Сохранение результата
    const results = JSON.parse(localStorage.getItem('results')) || [];
    results.push(result);
    localStorage.setItem('results', JSON.stringify(results));
    
    // Перенаправление на страницу результатов
    window.location.href = `results.html?resultId=${result.id}`;
}

/**
 * Запуск таймера
 */
function startTimer() {
    testTimer = setInterval(() => {
        if (timeRemaining > 0) {
            timeRemaining--;
            updateTimerDisplay();
            
            // Предупреждение за 5 минут
            if (timeRemaining === 300) {
                alert('Осталось 5 минут до окончания теста!');
            }
            
            // Автоматическое завершение по истечении времени
            if (timeRemaining === 0) {
                alert('Время вышло! Тест будет автоматически завершен.');
                finishTest();
            }
        }
    }, 1000);
}

/**
 * Обновление отображения таймера
 */
function updateTimerDisplay() {
    if (timerElement) {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Изменение цвета при малом времени
        if (timeRemaining <= 300) {
            timerElement.style.color = '#ef4444';
        } else if (timeRemaining <= 600) {
            timerElement.style.color = '#f59e0b';
        } else {
            timerElement.style.color = '#3b82f6';
        }
    }
}

/**
 * Запуск автосохранения каждые 2 минуты
 */
function startAutoSave() {
    autoSaveInterval = setInterval(() => {
        const autoSaveData = {
            testId: currentTest.id,
            currentQuestionIndex: currentQuestionIndex,
            userAnswers: { ...userAnswers },
            timeRemaining: timeRemaining,
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem(`autosave_${currentTest.id}`, JSON.stringify(autoSaveData));
        console.log('Автосохранение выполнено');
    }, 120000); // Каждые 2 минуты
}

/**
 * Загрузка автосохраненных данных (если есть)
 */
function loadAutoSave(testId) {
    const savedData = localStorage.getItem(`autosave_${testId}`);
    if (savedData) {
        const data = JSON.parse(savedData);
        if (confirm('Найдено автосохранение. Хотите продолжить с последней сохраненной точки?')) {
            currentQuestionIndex = data.currentQuestionIndex;
            userAnswers = data.userAnswers;
            timeRemaining = data.timeRemaining;
            return true;
        }
    }
    return false;
}

// Добавляем обработчик перед закрытием страницы
window.addEventListener('beforeunload', function(e) {
    // Сохраняем данные перед закрытием
    const autoSaveData = {
        testId: currentTest?.id,
        currentQuestionIndex: currentQuestionIndex,
        userAnswers: { ...userAnswers },
        timeRemaining: timeRemaining,
        lastSaved: new Date().toISOString()
    };
    
    localStorage.setItem(`autosave_${currentTest?.id}`, JSON.stringify(autoSaveData));
});