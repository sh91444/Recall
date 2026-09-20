/* ============================================================
           RECALL
           Простое приложение интервального повторения
           ============================================================ */


        /*
            Здесь хранятся все данные приложения.
        
            cards  — карточки пользователя
            xp     — опыт
            streak — количество дней подряд
        */
        let data = {

            cards: [],

            xp: 0,

            streak: 0,

            lastStudyDate: null,

            /*
                Сколько карточек пользователь уже
                повторил сегодня.
            */
            reviewedToday: 0,

            /*
                Сколько карточек было запланировано
                на начало сегодняшнего дня.
            */
            todayStartCount: null,

            todayDate: null
        };


        /*
            Очередь карточек, которые надо повторить.
        */
        let reviewQueue = [];


        /*
            Текущая карточка.
        */
        let currentCard = null;


        /* ============================================================
           LOCAL STORAGE
           ============================================================ */


        /*
            Сохраняем данные в браузере.
        
            Даже если пользователь закроет сайт,
            карточки останутся.
        */
        function saveData() {

            localStorage.setItem(
                "recall-data",
                JSON.stringify(data)
            );

        }


        /*
            Загружаем данные при запуске сайта.
        */
        function loadData() {

            const saved =
                localStorage.getItem("recall-data");

            if (!saved) {
                return;
            }

            try {

                const parsed = JSON.parse(saved);

                data = {
                    ...data,
                    ...parsed
                };

            } catch (error) {

                console.error(
                    "Не удалось загрузить данные:",
                    error
                );

            }

        }



        /* ============================================================
           DATE HELPERS
           ============================================================ */


        /*
            Возвращает дату вроде:
        
            2026-09-20
        */
        function getTodayKey() {

            const now = new Date();

            const year =
                now.getFullYear();

            const month =
                String(now.getMonth() + 1)
                    .padStart(2, "0");

            const day =
                String(now.getDate())
                    .padStart(2, "0");

            return `${year}-${month}-${day}`;

        }


        /*
            Проверяет, является ли одна дата
            вчерашним днём относительно другой.
        */
        function isYesterday(oldDate, currentDate) {

            const oldDay =
                new Date(oldDate + "T00:00:00");

            const currentDay =
                new Date(currentDate + "T00:00:00");

            const difference =
                currentDay - oldDay;

            return difference ===
                24 * 60 * 60 * 1000;

        }



        /* ============================================================
           CARD CREATION
           ============================================================ */


        document
            .getElementById("addCardForm")
            .addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();


                    const topic =
                        document
                            .getElementById("topicInput")
                            .value
                            .trim();


                    const question =
                        document
                            .getElementById("questionInput")
                            .value
                            .trim();


                    const answer =
                        document
                            .getElementById("answerInput")
                            .value
                            .trim();


                    if (
                        !topic ||
                        !question ||
                        !answer
                    ) {
                        return;
                    }


                    /*
                        Структура одной карточки.
        
                        interval:
                            текущий интервал в днях
        
                        stability:
                            насколько хорошо информация
                            закреплена в памяти
        
                        repetitions:
                            сколько успешных повторений было
        
                        due:
                            время следующего повторения
                    */
                    const card = {

                        id: Date.now(),

                        topic: topic,

                        question: question,

                        answer: answer,

                        interval: 0,

                        stability: 1,

                        repetitions: 0,

                        reviews: 0,

                        correctReviews: 0,

                        createdAt:
                            new Date().toISOString(),

                        due:
                            new Date().toISOString()

                    };


                    data.cards.push(card);


                    saveData();


                    /*
                        Очищаем форму.
                    */
                    event.target.reset();


                    /*
                        Гарантируем, что папка этой темы развернута.
                    */
                    topicFolderState[getFolderId(topic)] = true;


                    updateEverything();


                    /*
                        Простое подтверждение.
                    */
                    alert(
                        "Материал добавлен. Он уже доступен для повторения 🧠"
                    );

                }
            );



        /* ============================================================
           REVIEW QUEUE
           ============================================================ */


        function getDueCards() {

            const now =
                new Date().getTime();


            return data.cards
                .filter(card => {

                    return (
                        new Date(card.due)
                            .getTime()
                        <= now
                    );

                })
                .sort((a, b) => {

                    return (
                        new Date(a.due) -
                        new Date(b.due)
                    );

                });

        }



        /*
            Открываем экран повторения.
        */
        function openReview() {

            switchPage("review");

            startReview();

        }


        /*
            Создаём новую очередь.
        */
        function startReview() {

            reviewQueue =
                getDueCards();


            showNextCard();

        }



        /* ============================================================
           SHOW CARD
           ============================================================ */


        function showNextCard() {

            const reviewArea =
                document.getElementById(
                    "reviewArea"
                );


            /*
                Если очередь закончилась.
            */
            if (reviewQueue.length === 0) {

                currentCard = null;


                reviewArea.innerHTML = `

            <div class="empty">

                <div class="empty-icon">
                    🎉
                </div>

                <h3>
                    Всё на сегодня!
                </h3>

                <p>
                    Ты закончил текущую очередь.
                    Можешь спокойно заниматься другими делами.
                </p>

                <br>

                <button
                    class="button"
                    onclick="switchPage('dashboard')"
                >
                    На главную
                </button>

            </div>

        `;


                document.getElementById(
                    "reviewStatus"
                ).textContent =
                    "Очередь завершена";


                updateEverything();

                return;
            }


            currentCard =
                reviewQueue.shift();


            document.getElementById(
                "reviewStatus"
            ).textContent =
                `${reviewQueue.length + 1} осталось`;


            reviewArea.innerHTML = `

        <div class="flashcard">

            <div class="topic-badge">

                ${escapeHTML(
                currentCard.topic
            )
                }

            </div>


            <div class="question">

                ${escapeHTML(
                    currentCard.question
                )
                }

            </div>


            <div
                class="answer"
                id="currentAnswer"
            >

                ${escapeHTML(
                    currentCard.answer
                )
                }

            </div>

        </div>


        <button
            class="button"
            id="showAnswerButton"
            style="width:100%;"
            onclick="showAnswer()"
        >
            Показать ответ
        </button>


        <div
            class="rating-buttons"
            id="ratingButtons"
        >

            <button
                class="rating again"
                onclick="reviewCard('again')"
            >

                <strong>
                    😵 Забыл
                </strong>

                <span>
                    через 10 мин
                </span>

            </button>


            <button
                class="rating hard"
                onclick="reviewCard('hard')"
            >

                <strong>
                    😕 Тяжело
                </strong>

                <span>
                    короткий интервал
                </span>

            </button>


            <button
                class="rating good"
                onclick="reviewCard('good')"
            >

                <strong>
                    🙂 Нормально
                </strong>

                <span>
                    стандартный интервал
                </span>

            </button>


            <button
                class="rating easy"
                onclick="reviewCard('easy')"
            >

                <strong>
                    😎 Легко
                </strong>

                <span>
                    длинный интервал
                </span>

            </button>

        </div>

    `;

        }



        /*
            Показываем правильный ответ.
        */
        function showAnswer() {

            document
                .getElementById("currentAnswer")
                .classList
                .add("visible");


            document
                .getElementById("showAnswerButton")
                .style
                .display = "none";


            document
                .getElementById("ratingButtons")
                .classList
                .add("visible");

        }



        /* ============================================================
           SPACED REPETITION ALGORITHM
           ============================================================ */


        /*
            Это упрощённый адаптивный алгоритм.
        
            Он не является полным FSRS.
        
            Его задача — быть понятным для MVP,
            но при этом реально изменять интервалы
            в зависимости от ответа пользователя.
        */
        function reviewCard(rating) {

            if (!currentCard) {
                return;
            }


            const card = currentCard;


            card.reviews += 1;


            let nextDate =
                new Date();


            /* -------------------------
               ЗАБЫЛ
               -------------------------
        
               Карточка почти полностью
               возвращается назад.
        
               Повторяем через 10 минут.
            */
            if (rating === "again") {

                card.stability =
                    Math.max(
                        0.5,
                        card.stability * 0.45
                    );


                card.interval = 0;


                nextDate.setMinutes(
                    nextDate.getMinutes() + 10
                );


                data.xp += 2;

            }



            /* -------------------------
               ТЯЖЕЛО
               -------------------------
        
               Пользователь вспомнил,
               но знание слабое.
            */
            if (rating === "hard") {

                card.correctReviews += 1;

                card.repetitions += 1;


                card.stability *= 1.25;


                const days =
                    card.interval < 1
                        ? 1
                        : Math.max(
                            1,
                            Math.round(
                                card.interval * 1.3
                            )
                        );


                card.interval = days;


                nextDate.setDate(
                    nextDate.getDate() + days
                );


                data.xp += 5;

            }



            /* -------------------------
               НОРМАЛЬНО
               -------------------------
        
               Стандартный успешный ответ.
            */
            if (rating === "good") {

                card.correctReviews += 1;

                card.repetitions += 1;


                card.stability *= 1.8;


                let days;


                /*
                    Первые интервалы:
        
                    1 → 3 → 7 → ...
                */
                if (card.repetitions === 1) {

                    days = 1;

                } else if (
                    card.repetitions === 2
                ) {

                    days = 3;

                } else {

                    days =
                        Math.max(
                            4,
                            Math.round(
                                Math.max(
                                    card.interval,
                                    card.stability
                                ) * 2
                            )
                        );

                }


                card.interval = days;


                nextDate.setDate(
                    nextDate.getDate() + days
                );


                data.xp += 10;

            }



            /* -------------------------
               ЛЕГКО
               -------------------------
        
               Можно значительно увеличить
               интервал.
            */
            if (rating === "easy") {

                card.correctReviews += 1;

                card.repetitions += 1;


                card.stability *= 2.4;


                let days;


                if (card.repetitions === 1) {

                    days = 3;

                } else {

                    days =
                        Math.max(
                            7,
                            Math.round(
                                Math.max(
                                    card.interval,
                                    card.stability
                                ) * 2.6
                            )
                        );

                }


                card.interval = days;


                nextDate.setDate(
                    nextDate.getDate() + days
                );


                data.xp += 15;

            }


            /*
                Ставим дату следующего повторения.
            */
            card.due =
                nextDate.toISOString();


            /*
                Обновляем streak.
            */
            updateStreak();


            data.reviewedToday += 1;


            saveData();


            currentCard = null;


            /*
                Переходим к следующей карточке.
            */
            showNextCard();

        }



        /* ============================================================
           STREAK
           ============================================================ */


        function updateStreak() {

            const today =
                getTodayKey();


            /*
                Если пользователь уже занимался сегодня,
                streak менять нельзя.
            */
            if (
                data.lastStudyDate === today
            ) {

                return;

            }


            /*
                Если занимался вчера —
                продолжаем streak.
            */
            if (
                data.lastStudyDate &&
                isYesterday(
                    data.lastStudyDate,
                    today
                )
            ) {

                data.streak += 1;

            } else {

                /*
                    Если был пропуск —
                    начинаем заново.
                */
                data.streak = 1;

            }


            data.lastStudyDate = today;

        }



        /* ============================================================
           NEW DAY
           ============================================================ */


        function prepareToday() {

            const today =
                getTodayKey();


            /*
                Первый запуск нового дня.
            */
            if (
                data.todayDate !== today
            ) {

                data.todayDate = today;

                data.reviewedToday = 0;

                data.todayStartCount =
                    getDueCards().length;


                saveData();

            }

        }



        /* ============================================================
           DASHBOARD
           ============================================================ */


        function updateDashboard() {

            prepareToday();


            const due =
                getDueCards().length;


            document.getElementById(
                "streakValue"
            ).textContent =
                data.streak;


            document.getElementById(
                "dueValue"
            ).textContent =
                due;


            document.getElementById(
                "xpValue"
            ).textContent =
                data.xp;


            document.getElementById(
                "cardsValue"
            ).textContent =
                data.cards.length;



            /*
                Текст сегодняшнего плана.
            */
            const description =
                document.getElementById(
                    "todayDescription"
                );


            if (due === 0) {

                description.textContent =
                    "На данный момент все повторения выполнены.";

            } else if (due === 1) {

                description.textContent =
                    "Сегодня нужно повторить 1 материал.";

            } else {

                description.textContent =
                    `Сегодня нужно повторить ${due} материалов.`;

            }



            /*
                DAILY PROGRESS
            */
            const total =
                Math.max(
                    data.todayStartCount || 0,
                    data.reviewedToday
                );


            let percentage = 0;


            if (total > 0) {

                percentage =
                    Math.min(
                        100,
                        (
                            data.reviewedToday /
                            total
                        ) * 100
                    );

            }


            document.getElementById(
                "dailyProgress"
            ).style.width =
                percentage + "%";


            document.getElementById(
                "progressText"
            ).textContent =
                `${data.reviewedToday} / ${total}`;



            /*
                LEVEL SYSTEM
        
                Каждые 100 XP = новый уровень.
            */
            const level =
                Math.floor(
                    data.xp / 100
                ) + 1;


            const xpInsideLevel =
                data.xp % 100;


            document.getElementById(
                "levelValue"
            ).textContent =
                `Level ${level}`;


            document.getElementById(
                "levelXP"
            ).textContent =
                `${xpInsideLevel} / 100 XP`;


            document.getElementById(
                "levelProgress"
            ).style.width =
                xpInsideLevel + "%";

        }



        /* ============================================================
           TOPIC FOLDERS STATE & HELPERS
           ============================================================ */


        /*
            Состояние папок тем: id_папки -> boolean (открыта/закрыта).
            По умолчанию все папки считаются открытыми.
        */
        const topicFolderState = {};


        function getFolderId(topicName) {
            return "topic_" + encodeURIComponent(topicName || "default").replace(/[^a-zA-Z0-9_-]/g, "_");
        }


        function formatMaterialsCount(count) {

            const abs = Math.abs(count) % 100;
            const rem = abs % 10;

            if (abs > 10 && abs < 20) {
                return `${count} материалов`;
            }

            if (rem > 1 && rem < 5) {
                return `${count} материала`;
            }

            if (rem === 1) {
                return `${count} материал`;
            }

            return `${count} материалов`;

        }


        function toggleTopicFolder(folderId) {

            const content =
                document.getElementById(
                    "folderContent-" + folderId
                );

            const arrow =
                document.getElementById(
                    "folderArrow-" + folderId
                );


            if (!content) {
                return;
            }


            const isCurrentlyCollapsed =
                content.classList.contains("collapsed");


            if (isCurrentlyCollapsed) {

                content.classList.remove("collapsed");

                if (arrow) {
                    arrow.classList.remove("collapsed");
                }

                topicFolderState[folderId] = true;

            } else {

                content.classList.add("collapsed");

                if (arrow) {
                    arrow.classList.add("collapsed");
                }

                topicFolderState[folderId] = false;

            }

        }


        function updateTopicSuggestions() {

            const datalist =
                document.getElementById("topicsList");

            if (!datalist) {
                return;
            }


            const uniqueTopics = [
                ...new Set(
                    data.cards
                        .map(c => (c.topic || "").trim())
                        .filter(Boolean)
                )
            ];


            datalist.innerHTML =
                uniqueTopics
                    .map(topic => `<option value="${escapeHTML(topic)}"></option>`)
                    .join("");

        }


        /* ============================================================
           CARDS LIST (FOLDERS BY TOPIC)
           ============================================================ */


        function renderCards() {

            const container =
                document.getElementById(
                    "cardsList"
                );


            const countEl =
                document.getElementById(
                    "materialsCount"
                );


            if (countEl) {
                countEl.textContent =
                    formatMaterialsCount(data.cards.length);
            }


            if (
                data.cards.length === 0
            ) {

                container.innerHTML = `

            <div class="empty">

                <div class="empty-icon">
                    📚
                </div>

                <h3>
                    Пока пусто
                </h3>

                <p>
                    Добавь первый материал
                    на главной странице.
                </p>

            </div>

        `;

                return;

            }


            /*
                Группируем карточки по темам в "папки".
            */
            const groups = {};

            data.cards.forEach(card => {

                const topicName =
                    (card.topic || "").trim() || "Без темы";

                if (!groups[topicName]) {
                    groups[topicName] = [];
                }

                groups[topicName].push(card);

            });


            container.innerHTML =
                Object.keys(groups)
                    .map((topicName) => {

                        const cards = groups[topicName];
                        const folderId = getFolderId(topicName);
                        const isOpen =
                            topicFolderState[folderId] !== false;


                        const cardsHtml =
                            cards
                                .map(card => {

                                    const nextReview =
                                        formatNextReview(
                                            card.due
                                        );

                                    const accuracy =
                                        card.reviews === 0
                                            ? 0
                                            : Math.round(
                                                (
                                                    card.correctReviews /
                                                    card.reviews
                                                ) * 100
                                            );

                                    return `

                        <div class="memory-card">

                            <div>

                                <div class="card-topic">

                                    ${escapeHTML(
                                        card.topic
                                    )}

                                </div>


                                <h4>

                                    ${escapeHTML(
                                        card.question
                                    )}

                                </h4>


                                <p>

                                    ${escapeHTML(
                                        card.answer
                                    )}

                                </p>


                                <div class="card-meta">

                                    Следующее:
                                    ${nextReview}

                                    ·

                                    Интервал:
                                    ${formatInterval(
                                        card
                                    )}

                                    ·

                                    Точность:
                                    ${accuracy}%

                                </div>

                            </div>


                            <button
                                class="delete-btn"
                                onclick="deleteCard(${card.id})"
                            >

                                Удалить

                            </button>

                        </div>

                    `;

                                })
                                .join("");


                        return `

                    <div class="topic-folder">

                        <div
                            class="topic-folder-header"
                            onclick="toggleTopicFolder('${folderId}')"
                        >

                            <div class="topic-folder-title">

                                <span class="folder-icon">📁</span>

                                <span class="folder-name">
                                    ${escapeHTML(topicName)}
                                </span>

                                <span class="folder-badge">
                                    ${formatMaterialsCount(cards.length)}
                                </span>

                            </div>

                            <span
                                class="folder-arrow ${isOpen ? '' : 'collapsed'}"
                                id="folderArrow-${folderId}"
                            >
                                ▾
                            </span>

                        </div>

                        <div
                            class="topic-folder-content ${isOpen ? '' : 'collapsed'}"
                            id="folderContent-${folderId}"
                        >

                            ${cardsHtml}

                        </div>

                    </div>

                `;

                    })
                    .join("");

        }



        /* ============================================================
           DELETE
           ============================================================ */


        function deleteCard(id) {

            const confirmed =
                confirm(
                    "Удалить этот материал?"
                );


            if (!confirmed) {
                return;
            }


            data.cards =
                data.cards.filter(
                    card => card.id !== id
                );


            saveData();

            updateEverything();

        }



        /* ============================================================
           FORMAT NEXT REVIEW
           ============================================================ */


        function formatNextReview(dateString) {

            const now =
                new Date();

            const due =
                new Date(dateString);


            const difference =
                due - now;


            if (difference <= 0) {

                return "сейчас";

            }


            const minutes =
                Math.ceil(
                    difference /
                    (1000 * 60)
                );


            if (minutes < 60) {

                return `через ${minutes} мин`;

            }


            const hours =
                Math.ceil(
                    minutes / 60
                );


            if (hours < 24) {

                return `через ${hours} ч`;

            }


            const days =
                Math.ceil(
                    hours / 24
                );


            if (days === 1) {

                return "завтра";

            }


            return `через ${days} дн.`;

        }



        function formatInterval(card) {

            if (card.interval === 0) {
                return "< 1 дня";
            }

            if (card.interval === 1) {
                return "1 день";
            }

            return `${card.interval} дней`;

        }



        /* ============================================================
           NAVIGATION
           ============================================================ */


        const navigationButtons =
            document.querySelectorAll(
                ".nav-btn"
            );


        navigationButtons.forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const page =
                        this.dataset.page;


                    switchPage(page);


                    if (
                        page === "review"
                    ) {

                        startReview();

                    }

                }
            );

        });


        function switchPage(pageName) {

            document
                .querySelectorAll(".page")
                .forEach(page => {

                    page.classList.remove(
                        "active"
                    );

                });


            document
                .querySelectorAll(".nav-btn")
                .forEach(button => {

                    button.classList.remove(
                        "active"
                    );

                });


            document
                .getElementById(pageName)
                .classList
                .add("active");


            const activeButton =
                document.querySelector(
                    `[data-page="${pageName}"]`
                );


            if (activeButton) {

                activeButton.classList.add(
                    "active"
                );

            }


            updateEverything();

        }



        /* ============================================================
           SAFE HTML
           ============================================================ */


        /*
            Нельзя просто вставлять текст пользователя
            внутрь HTML.
        
            Иначе пользователь теоретически
            может вставить HTML/JavaScript.
        
            Поэтому экранируем специальные символы.
        */
        function escapeHTML(text) {

            const div =
                document.createElement("div");

            div.textContent = text;

            return div.innerHTML;

        }



        /* ============================================================
           GREETING
           ============================================================ */


        function updateGreeting() {

            const hour =
                new Date().getHours();


            let text;


            if (hour < 12) {

                text =
                    "Доброе утро 👋";

            } else if (hour < 18) {

                text =
                    "Добрый день 👋";

            } else {

                text =
                    "Добрый вечер 👋";

            }


            document.getElementById(
                "greeting"
            ).textContent = text;

        }



        /* ============================================================
           UPDATE APP
           ============================================================ */


        function updateEverything() {

            updateGreeting();

            updateDashboard();

            renderCards();

            updateTopicSuggestions();

            updateNotificationButton();

        }



        /* ============================================================
           NOTIFICATIONS & PWA (SERVICE WORKER)
           ============================================================ */


        /*
            Регистрация Service Worker для PWA и фоновых уведомлений
        */
        if ("serviceWorker" in navigator) {

            window.addEventListener("load", () => {

                navigator.serviceWorker
                    .register("./sw.js")
                    .then(registration => {
                        console.log("Recall: Service Worker зарегистрирован", registration.scope);
                    })
                    .catch(err => {
                        console.warn("Recall: Service Worker не зарегистрирован (может требоваться HTTPS/localhost)", err);
                    });

            });

        }


        function areNotificationsEnabled() {

            return localStorage.getItem("recall_notifications") === "true";

        }


        function updateNotificationButton() {

            const btn = document.getElementById("notifBtn");
            const label = document.getElementById("notifLabel");
            const bell = document.getElementById("notifBell");

            if (!btn || !label) {
                return;
            }

            if (!("Notification" in window)) {
                btn.style.display = "none";
                return;
            }

            if (Notification.permission === "granted" && areNotificationsEnabled()) {

                btn.classList.add("active");
                label.textContent = "Напоминания вкл.";
                if (bell) bell.textContent = "🔔";

            } else if (Notification.permission === "denied") {

                btn.classList.remove("active");
                label.textContent = "Напоминания заблок.";
                if (bell) bell.textContent = "🔕";

            } else {

                btn.classList.remove("active");
                label.textContent = "Напоминания";
                if (bell) bell.textContent = "🔔";

            }

        }


        function sendNotification(title, body) {

            if (!("Notification" in window) || Notification.permission !== "granted") {
                return;
            }

            const options = {
                body: body,
                icon: "./icons/icon-192.png",
                badge: "./icons/icon-192.png"
            };

            // 1. Пробуем через Service Worker
            if (navigator.serviceWorker && navigator.serviceWorker.ready) {

                navigator.serviceWorker.ready
                    .then(registration => {
                        if (registration.showNotification) {
                            return registration.showNotification(title, options);
                        } else {
                            new Notification(title, options);
                        }
                    })
                    .catch(() => {
                        new Notification(title, options);
                    });

            } else {

                // 2. Fallback на прямой вызов Web Notification
                try {
                    new Notification(title, options);
                } catch (e) {
                    console.warn("Ошибка показа уведомления:", e);
                }

            }

        }


        function checkDueCardsNotification() {

            if (!areNotificationsEnabled() || Notification.permission !== "granted") {
                return;
            }

            const dueCards = getDueCards();

            if (dueCards.length === 0) {
                return;
            }

            const lastNotif = parseInt(localStorage.getItem("recall_last_notif_time") || "0", 10);
            const now = Date.now();
            const fourHours = 4 * 60 * 60 * 1000;

            // Отправляем не чаще одного раза в 4 часа
            if (now - lastNotif >= fourHours) {

                localStorage.setItem("recall_last_notif_time", now.toString());

                const cardsWord = formatMaterialsCount(dueCards.length);

                sendNotification(
                    "Recall: Пора повторить! 🧠",
                    `У вас ${cardsWord}, готовых к повторению прямо сейчас.`
                );

            }

        }


        function toggleNotifications() {

            if (!("Notification" in window)) {
                alert("Ваш браузер не поддерживает системные уведомления.");
                return;
            }

            if (Notification.permission === "default") {

                Notification.requestPermission().then(permission => {

                    if (permission === "granted") {

                        localStorage.setItem("recall_notifications", "true");

                        updateNotificationButton();

                        sendNotification(
                            "Recall",
                            "Напоминания успешно включены! 🧠 Мы сообщим, когда карточки будут готовы к повторению."
                        );

                        // Проверяем, есть ли готовые карточки прямо сейчас
                        const due = getDueCards();
                        if (due.length > 0) {
                            setTimeout(() => {
                                sendNotification(
                                    "Recall: есть карточки для повторения!",
                                    `Прямо сейчас готово к повторению: ${formatMaterialsCount(due.length)}.`
                                );
                            }, 2000);
                        }

                    } else if (permission === "denied") {

                        updateNotificationButton();

                        alert("Уведомления отклонены. Если передумаете, включите их в настройках сайта в браузере.");

                    }

                });

            } else if (Notification.permission === "granted") {

                const currentlyEnabled = areNotificationsEnabled();

                if (currentlyEnabled) {

                    localStorage.setItem("recall_notifications", "false");
                    alert("Напоминания отключены.");

                } else {

                    localStorage.setItem("recall_notifications", "true");

                    sendNotification(
                        "Recall",
                        "Напоминания включены! 🧠"
                    );

                    const due = getDueCards();
                    if (due.length > 0) {
                        setTimeout(() => {
                            sendNotification(
                                "Recall: карточки готовы",
                                `У вас есть ${formatMaterialsCount(due.length)} для повторения.`
                            );
                        }, 1500);
                    }

                }

                updateNotificationButton();

            } else if (Notification.permission === "denied") {

                alert(
                    "Уведомления заблокированы в вашем браузере.\n\n" +
                    "Чтобы включить их, нажмите на значок замочка или параметров слева от адресной строки браузера и разрешите 'Уведомления'."
                );

            }

        }


        // Периодическая проверка (каждые 30 минут, пока открыта вкладка)
        setInterval(checkDueCardsNotification, 30 * 60 * 1000);

        // Проверка при возвращении на вкладку
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                checkDueCardsNotification();
            }
        });



        /* ============================================================
           START APP
           ============================================================ */


        loadData();

        prepareToday();

        updateEverything();
