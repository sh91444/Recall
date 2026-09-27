/* =========================================================
   RECALL DATA
========================================================= */

const defaultData = {

    cards: [],

    xp: 0,

    streak: 0,

    lastStudyDate: null,

    todayDate: null,

    todayCardIds: [],

    completedToday: []

};


let data = {
    ...defaultData
};


let reviewQueue = [];

let currentCard = null;

/* =========================================================
   AI CONFIG
========================================================= */

const AI_API_URL =
    "https://recall-ai-api.sho591820.workers.dev/";


let generatedAICards = [];

/* =========================================================
   STORAGE
========================================================= */

function saveData() {

    localStorage.setItem(
        "recall-data",
        JSON.stringify(data)
    );

}


function loadData() {

    const raw =
        localStorage.getItem(
            "recall-data"
        );


    if (!raw) {
        return;
    }


    try {

        const parsed =
            JSON.parse(raw);


        data.cards =
            Array.isArray(parsed.cards)
                ? parsed.cards
                : [];


        data.xp =
            typeof parsed.xp === "number" &&
                Number.isFinite(parsed.xp)
                ? Math.max(0, parsed.xp)
                : 0;


        data.streak =
            typeof parsed.streak === "number" &&
                Number.isFinite(parsed.streak)
                ? Math.max(0, parsed.streak)
                : 0;


        data.lastStudyDate =
            typeof parsed.lastStudyDate === "string"
                ? parsed.lastStudyDate
                : null;


        data.todayDate =
            typeof parsed.todayDate === "string"
                ? parsed.todayDate
                : null;


        data.todayCardIds =
            Array.isArray(parsed.todayCardIds)
                ? parsed.todayCardIds
                : [];


        data.completedToday =
            Array.isArray(parsed.completedToday)
                ? parsed.completedToday
                : [];


        migrateOldCards();

    }

    catch (error) {

        console.error(
            "Ошибка данных Recall:",
            error
        );


        data = {
            ...defaultData
        };

    }

}



/* =========================================================
   OLD CARDS SUPPORT
========================================================= */

function migrateOldCards() {

    data.cards =
        data.cards.map(card => ({

            id:
                Number(card.id) ||
                Date.now() +
                Math.random(),

            subject:
                card.subject ||
                card.topic ||
                "Без предмета",

            title:
                card.title ||
                card.question ||
                "Без названия",

            page:
                card.page ||
                "",

            examDate:
                card.examDate ||
                null,

            question:
                card.question ||
                card.title ||
                "",

            answer:
                card.answer ||
                "",

            interval:
                Number(
                    card.interval
                ) || 0,

            stability:
                Number(
                    card.stability
                ) || 1,

            repetitions:
                Number(
                    card.repetitions
                ) || 0,

            reviews:
                Number(
                    card.reviews
                ) || 0,

            correctReviews:
                Number(
                    card.correctReviews
                ) || 0,

            due:
                isValidDate(card.due)
                    ? card.due
                    : new Date()
                        .toISOString(),

            createdAt:
                isValidDate(
                    card.createdAt
                )
                    ? card.createdAt
                    : new Date()
                        .toISOString()

        }));

}



/* =========================================================
   DATE HELPERS
========================================================= */

function isValidDate(value) {

    return (
        value &&
        !Number.isNaN(
            new Date(value)
                .getTime()
        )
    );

}


function getTodayKey() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


function isYesterday(
    oldDate,
    today
) {

    const first =
        new Date(
            oldDate +
            "T00:00:00"
        );


    const second =
        new Date(
            today +
            "T00:00:00"
        );


    return (
        second - first ===
        86400000
    );

}


function daysUntil(
    dateString
) {

    if (!dateString) {
        return null;
    }


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const target =
        new Date(
            dateString +
            "T00:00:00"
        );


    return Math.ceil(
        (
            target -
            today
        ) /
        86400000
    );

}



/* =========================================================
   TODAY
========================================================= */

function prepareToday() {

    const today =
        getTodayKey();


    if (
        data.todayDate === today
    ) {
        return;
    }


    data.todayDate =
        today;


    data.completedToday =
        [];


    data.todayCardIds =
        getDueCards()
            .map(
                card =>
                    card.id
            );


    saveData();

}


function addCardToToday(id) {

    if (
        !data.todayCardIds
            .includes(id)
    ) {

        data.todayCardIds
            .push(id);

    }

}


function markCardCompleted(id) {

    if (
        !data.completedToday
            .includes(id)
    ) {

        data.completedToday
            .push(id);

    }

}



/* =========================================================
   CREATE CARD
========================================================= */

document
    .getElementById(
        "addCardForm"
    )
    .addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const subject =
                document
                    .getElementById(
                        "subjectInput"
                    )
                    .value
                    .trim();


            const title =
                document
                    .getElementById(
                        "titleInput"
                    )
                    .value
                    .trim();


            const page =
                document
                    .getElementById(
                        "pageInput"
                    )
                    .value
                    .trim();


            const examDate =
                document
                    .getElementById(
                        "examInput"
                    )
                    .value ||
                null;


            const question =
                document
                    .getElementById(
                        "questionInput"
                    )
                    .value
                    .trim();


            const answer =
                document
                    .getElementById(
                        "answerInput"
                    )
                    .value
                    .trim();


            const id =
                Date.now();


            const card = {

                id,

                subject,

                title,

                page,

                examDate,

                question,

                answer,

                interval: 0,

                stability: 1,

                repetitions: 0,

                reviews: 0,

                correctReviews: 0,

                due:
                    new Date()
                        .toISOString(),

                createdAt:
                    new Date()
                        .toISOString()

            };


            data.cards.push(
                card
            );


            prepareToday();


            addCardToToday(
                id
            );


            saveData();


            event.target
                .reset();


            updateEverything();

        }
    );



/* =========================================================
   DUE CARDS
========================================================= */

function getDueCards() {

    const now =
        Date.now();


    return data.cards
        .filter(card => {

            return (
                new Date(
                    card.due
                )
                    .getTime()
                <= now
            );

        })
        .sort(
            (a, b) => {

                return (
                    new Date(a.due) -
                    new Date(b.due)
                );

            }
        );

}



/* =========================================================
   REVIEW
========================================================= */

function openReview() {

    switchPage(
        "review"
    );


    startReview();

}


function startReview() {

    reviewQueue =
        getDueCards();


    showNextCard();

}


function showNextCard() {

    const area =
        document.getElementById(
            "reviewArea"
        );


    if (
        reviewQueue.length === 0
    ) {

        currentCard =
            null;


        document.getElementById(
            "reviewStatus"
        ).textContent =
            "Очередь завершена";


        area.innerHTML = `

            <div class="empty">

                <div class="empty-icon">
                    🎉
                </div>

                <h3>
                    Всё выполнено
                </h3>

                <p>
                    Следующие темы появятся,
                    когда наступит время повторения.
                </p>

                <br>

                <button
                    class="button"
                    id="backHomeButton"
                >
                    На главную
                </button>

            </div>

        `;


        document
            .getElementById(
                "backHomeButton"
            )
            .addEventListener(
                "click",
                () => {

                    switchPage(
                        "dashboard"
                    );

                }
            );


        updateEverything();

        return;

    }


    currentCard =
        reviewQueue.shift();


    document.getElementById(
        "reviewStatus"
    ).textContent =
        `${reviewQueue.length + 1} осталось`;


    const pageBadge =
        currentCard.page
            ? `
                <span class="badge page-badge">

                    📖 стр.
                    ${escapeHTML(
                currentCard.page
            )
            }

                </span>
            `
            : "";


    const examBadge =
        currentCard.examDate
            ? `
                <span class="badge exam-badge">

                    🎯
                    ${formatDate(
                currentCard.examDate
            )
            }

                </span>
            `
            : "";


    area.innerHTML = `

        <div class="flashcard">

            <div class="badge-row">

                <span class="badge">

                    ${escapeHTML(
        currentCard.subject
    )
        }

                </span>

                ${pageBadge}

                ${examBadge}

            </div>


            <div class="card-title-small">

                ${escapeHTML(
            currentCard.title
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
                id="currentAnswer"
                class="answer"
            >

                ${escapeHTML(
            currentCard.answer
        )
        }

            </div>

        </div>


        <button
            id="showAnswerButton"
            class="button"
            style="width:100%;"
        >
            Показать ответ
        </button>


        <div
            id="ratingButtons"
            class="rating-buttons"
        >

            <button
                class="rating again"
                data-rating="again"
            >

                <strong>
                    😵 Забыл
                </strong>

                <span>
                    скоро снова
                </span>

            </button>


            <button
                class="rating hard"
                data-rating="hard"
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
                data-rating="good"
            >

                <strong>
                    🙂 Нормально
                </strong>

                <span>
                    обычный интервал
                </span>

            </button>


            <button
                class="rating easy"
                data-rating="easy"
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


    document
        .getElementById(
            "showAnswerButton"
        )
        .addEventListener(
            "click",
            showAnswer
        );


    document
        .querySelectorAll(
            "[data-rating]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    reviewCard(
                        button.dataset.rating
                    );

                }
            );

        });

}


function showAnswer() {

    document
        .getElementById(
            "currentAnswer"
        )
        .classList
        .add(
            "visible"
        );


    document
        .getElementById(
            "showAnswerButton"
        )
        .style
        .display =
        "none";


    document
        .getElementById(
            "ratingButtons"
        )
        .classList
        .add(
            "visible"
        );

}



/* =========================================================
   SPACED REPETITION
========================================================= */

function reviewCard(
    rating
) {

    if (!currentCard) {
        return;
    }


    const card =
        currentCard;


    card.reviews += 1;


    let nextDate =
        new Date();


    /* FORGOT */

    if (
        rating === "again"
    ) {

        card.stability =
            Math.max(
                0.5,
                card.stability *
                0.45
            );


        card.interval =
            0;


        nextDate
            .setMinutes(
                nextDate
                    .getMinutes() +
                10
            );


        data.xp += 2;

    }


    /* HARD */

    if (
        rating === "hard"
    ) {

        card.correctReviews += 1;

        card.repetitions += 1;


        card.stability *=
            1.25;


        const days =
            card.interval < 1
                ? 1
                : Math.max(
                    1,
                    Math.round(
                        card.interval *
                        1.3
                    )
                );


        card.interval =
            days;


        nextDate.setDate(
            nextDate.getDate() +
            days
        );


        data.xp += 5;


        markCardCompleted(
            card.id
        );

    }


    /* GOOD */

    if (
        rating === "good"
    ) {

        card.correctReviews += 1;

        card.repetitions += 1;


        card.stability *=
            1.8;


        let days;


        if (
            card.repetitions === 1
        ) {

            days = 1;

        }

        else if (
            card.repetitions === 2
        ) {

            days = 3;

        }

        else {

            days =
                Math.max(
                    4,
                    Math.round(
                        Math.max(
                            card.interval,
                            card.stability
                        ) *
                        2
                    )
                );

        }


        card.interval =
            days;


        nextDate.setDate(
            nextDate.getDate() +
            days
        );


        data.xp += 10;


        markCardCompleted(
            card.id
        );

    }


    /* EASY */

    if (
        rating === "easy"
    ) {

        card.correctReviews += 1;

        card.repetitions += 1;


        card.stability *=
            2.4;


        let days;


        if (
            card.repetitions === 1
        ) {

            days = 3;

        }

        else {

            days =
                Math.max(
                    7,
                    Math.round(
                        Math.max(
                            card.interval,
                            card.stability
                        ) *
                        2.5
                    )
                );

        }


        card.interval =
            days;


        nextDate.setDate(
            nextDate.getDate() +
            days
        );


        data.xp += 15;


        markCardCompleted(
            card.id
        );

    }


    nextDate =
        adjustForExam(
            card,
            nextDate
        );


    card.due =
        nextDate
            .toISOString();


    updateStreak();


    saveData();


    currentCard =
        null;


    showNextCard();

}



/* =========================================================
   EXAM MODE
========================================================= */

function adjustForExam(
    card,
    proposedDate
) {

    /*
        Нет экзамена —
        ничего не меняем.
    */

    if (!card.examDate) {

        return proposedDate;

    }


    const days =
        daysUntil(
            card.examDate
        );


    if (
        days === null ||
        days < 0
    ) {

        return proposedDate;

    }


    const now =
        new Date();


    let maximumDays;


    if (
        days <= 2
    ) {

        maximumDays = 1;

    }

    else if (
        days <= 7
    ) {

        maximumDays = 2;

    }

    else if (
        days <= 21
    ) {

        maximumDays = 5;

    }

    else {

        return proposedDate;

    }


    const forcedDate =
        new Date(now);


    forcedDate.setDate(
        forcedDate.getDate() +
        maximumDays
    );


    if (
        forcedDate <
        proposedDate
    ) {

        return forcedDate;

    }


    return proposedDate;

}



/* =========================================================
   STREAK
========================================================= */

function updateStreak() {

    const today =
        getTodayKey();


    if (
        data.lastStudyDate === today
    ) {

        return;

    }


    if (
        data.lastStudyDate &&
        isYesterday(
            data.lastStudyDate,
            today
        )
    ) {

        data.streak += 1;

    }

    else {

        data.streak = 1;

    }


    data.lastStudyDate =
        today;

}



/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    prepareToday();


    const due =
        getDueCards();


    document.getElementById(
        "streakValue"
    ).textContent =
        data.streak;


    document.getElementById(
        "dueValue"
    ).textContent =
        due.length;


    document.getElementById(
        "xpValue"
    ).textContent =
        data.xp;


    document.getElementById(
        "cardsValue"
    ).textContent =
        data.cards.length;


    const description =
        document.getElementById(
            "todayDescription"
        );


    if (
        due.length === 0
    ) {

        description.textContent =
            "На данный момент всё повторено.";

    }

    else {

        description.textContent =
            `Нужно повторить: ${due.length}`;

    }


    const total =
        data.todayCardIds
            .length;


    const completed =
        data.completedToday
            .filter(id => {

                return (
                    data.todayCardIds
                        .includes(id)
                );

            })
            .length;


    let percentage =
        0;


    if (
        total > 0
    ) {

        percentage =
            Math.min(
                100,
                completed /
                total *
                100
            );

    }


    document.getElementById(
        "progressText"
    ).textContent =
        `${completed} / ${total}`;


    document.getElementById(
        "dailyProgress"
    ).style.width =
        percentage + "%";


    renderTodayList(
        due
    );

}



/* =========================================================
   TODAY LIST
========================================================= */

function renderTodayList(
    cards
) {

    const container =
        document.getElementById(
            "todayList"
        );


    if (
        cards.length === 0
    ) {

        container.innerHTML = `

            <div class="empty">

                <div class="empty-icon">
                    ✅
                </div>

                <h3>
                    Сейчас повторений нет
                </h3>

                <p>
                    Можешь добавить новую тему
                    из своей тетради.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        cards
            .slice(
                0,
                5
            )
            .map(card => {

                const page =
                    card.page
                        ? `
                            📖 стр.
                            ${escapeHTML(
                            card.page
                        )
                        }
                        `
                        : "📖 страница не указана";


                const exam =
                    card.examDate
                        ? `
                            <span class="exam-tag">

                                🎯
                                ${formatDate(
                            card.examDate
                        )
                        }

                            </span>
                        `
                        : "";


                return `

                    <div class="today-item">

                        <div>

                            <div class="subject">

                                ${escapeHTML(
                    card.subject
                )
                    }

                            </div>


                            <h4>

                                ${escapeHTML(
                        card.title
                    )
                    }

                            </h4>


                            <div class="meta">

                                ${page}

                                ${exam}

                            </div>

                        </div>


                        <button
                            class="button secondary today-review-button"
                        >
                            Повторить
                        </button>

                    </div>

                `;

            })
            .join("");


    document
        .querySelectorAll(
            ".today-review-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                openReview
            );

        });

}



/* =========================================================
   UPCOMING
========================================================= */

function renderUpcoming() {

    const container =
        document.getElementById(
            "upcomingList"
        );


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const limit =
        new Date(today);


    limit.setDate(
        limit.getDate() +
        14
    );


    const future =
        data.cards
            .filter(card => {

                const due =
                    new Date(
                        card.due
                    );


                return (
                    due >= today &&
                    due <= limit
                );

            })
            .sort(
                (a, b) =>
                    new Date(a.due) -
                    new Date(b.due)
            );


    if (
        future.length === 0
    ) {

        container.innerHTML = `

            <div class="empty">

                <div class="empty-icon">
                    🗓️
                </div>

                <h3>
                    Пока пусто
                </h3>

                <p>
                    Добавь материал -
                    здесь появится расписание.
                </p>

            </div>

        `;

        return;

    }


    const groups = {};


    future.forEach(card => {

        const key =
            getDateKeyFromDate(
                new Date(
                    card.due
                )
            );


        if (!groups[key]) {

            groups[key] = [];

        }


        groups[key].push(
            card
        );

    });


    container.innerHTML =
        Object
            .entries(groups)
            .map(
                ([date, cards]) => {

                    return `

                        <div class="upcoming-day">

                            <div class="upcoming-day-title">

                                ${formatHumanDate(
                        date
                    )
                        }

                                ·

                                ${cards.length
                        }

                            </div>


                            ${cards
                            .map(card => {

                                return `

                                            <div class="upcoming-card">

                                                <strong>

                                                    ${escapeHTML(
                                    card.subject
                                )
                                    }

                                                    —

                                                    ${escapeHTML(
                                        card.title
                                    )
                                    }

                                                </strong>


                                                <p>

                                                    ${card.page
                                        ? `
                                                                📖 стр.
                                                                ${escapeHTML(
                                            card.page
                                        )
                                        }
                                                            `
                                        : ""
                                    }

                                                    ${card.examDate
                                        ? `
                                                                · 🎯 экзамен
                                                                ${formatDate(
                                            card.examDate
                                        )
                                        }
                                                            `
                                        : ""
                                    }

                                                </p>

                                            </div>

                                        `;

                            })
                            .join("")
                        }

                        </div>

                    `;

                }
            )
            .join("");

}



/* =========================================================
   SUBJECT FILTER
========================================================= */

document
    .getElementById(
        "subjectFilter"
    )
    .addEventListener(
        "change",
        renderCards
    );


function renderSubjectFilter() {

    const select =
        document.getElementById(
            "subjectFilter"
        );


    const selected =
        select.value;


    const subjects =
        [
            ...new Set(
                data.cards
                    .map(
                        card =>
                            card.subject
                    )
            )
        ]
            .sort();


    select.innerHTML = `

        <option value="">
            Все темы
        </option>

        ${subjects
            .map(subject => {

                return `

                        <option
                            value="${escapeHTML(
                    subject
                )
                    }"
                        >

                            ${escapeHTML(
                        subject
                    )
                    }

                        </option>

                    `;

            })
            .join("")
        }

    `;


    if (
        subjects.includes(
            selected
        )
    ) {

        select.value =
            selected;

    }

}



/* =========================================================
   MATERIALS
========================================================= */

function renderCards() {

    const container =
        document.getElementById(
            "cardsList"
        );


    const filter =
        document.getElementById(
            "subjectFilter"
        ).value;


    const cards =
        filter
            ? data.cards
                .filter(
                    card =>
                        card.subject ===
                        filter
                )
            : data.cards;


    document.getElementById(
        "materialsCount"
    ).textContent =
        `${data.cards.length} материалов`;


    if (
        cards.length === 0
    ) {

        container.innerHTML = `

            <div class="empty">

                <div class="empty-icon">
                    📚
                </div>

                <h3>
                    Материалов пока нет
                </h3>

            </div>

        `;

        return;

    }


    container.innerHTML =
        cards
            .map(card => {

                const accuracy =
                    card.reviews > 0
                        ? Math.round(
                            card.correctReviews /
                            card.reviews *
                            100
                        )
                        : 0;


                return `

                    <div class="memory-card">

                        <div class="memory-card-content">

                            <div class="subject">

                                ${escapeHTML(
                    card.subject
                )
                    }

                            </div>


                            <h4>

                                ${escapeHTML(
                        card.title
                    )
                    }

                            </h4>


                            <p>

                                ${escapeHTML(
                        card.question
                    )
                    }

                            </p>


                            <div class="meta">

                                ${card.page
                        ? `
                                            📖 стр.
                                            ${escapeHTML(
                            card.page
                        )
                        }
                                            ·
                                        `
                        : ""
                    }

                                🧠
                                ${formatNextReview(
                        card.due
                    )
                    }

                                ·

                                точность
                                ${accuracy}%

                                ${card.examDate
                        ? `
                                            · 🎯
                                            ${formatDate(
                            card.examDate
                        )
                        }
                                        `
                        : ""
                    }

                            </div>

                        </div>


                        <button
                            class="delete-btn"
                            data-delete-id="${card.id}"
                        >
                            Удалить
                        </button>

                    </div>

                `;

            })
            .join("");


    document
        .querySelectorAll(
            "[data-delete-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteCard(
                        Number(
                            button.dataset
                                .deleteId
                        )
                    );

                }
            );

        });

}



/* =========================================================
   DELETE
========================================================= */

function deleteCard(id) {

    const confirmed =
        confirm(
            "Удалить этот материал?"
        );


    if (!confirmed) {
        return;
    }


    data.cards =
        data.cards
            .filter(
                card =>
                    card.id !== id
            );


    data.todayCardIds =
        data.todayCardIds
            .filter(
                cardId =>
                    cardId !== id
            );


    data.completedToday =
        data.completedToday
            .filter(
                cardId =>
                    cardId !== id
            );


    saveData();


    updateEverything();

}



/* =========================================================
   FORMATTING
========================================================= */

function formatNextReview(
    date
) {

    const diff =
        new Date(date) -
        new Date();


    if (
        diff <= 0
    ) {

        return "сейчас";

    }


    const minutes =
        Math.ceil(
            diff /
            60000
        );


    if (
        minutes < 60
    ) {

        return `через ${minutes} мин`;

    }


    const hours =
        Math.ceil(
            minutes /
            60
        );


    if (
        hours < 24
    ) {

        return `через ${hours} ч`;

    }


    const days =
        Math.ceil(
            hours /
            24
        );


    if (
        days === 1
    ) {

        return "завтра";

    }


    return `через ${days} дн.`;

}


function formatDate(
    dateString
) {

    const date =
        new Date(
            dateString +
            (
                dateString.includes("T")
                    ? ""
                    : "T00:00:00"
            )
        );


    return date
        .toLocaleDateString(
            "ru-RU",
            {
                day: "numeric",
                month: "short"
            }
        );

}


function getDateKeyFromDate(
    date
) {

    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            ),

        String(
            date.getDate()
        )
            .padStart(
                2,
                "0"
            )

    ].join("-");

}


function formatHumanDate(
    key
) {

    const today =
        getTodayKey();


    if (
        key === today
    ) {

        return "Сегодня";

    }


    const date =
        new Date(
            key +
            "T00:00:00"
        );


    const tomorrow =
        new Date();


    tomorrow.setDate(
        tomorrow.getDate() +
        1
    );


    if (
        getDateKeyFromDate(
            tomorrow
        ) === key
    ) {

        return "Завтра";

    }


    return date
        .toLocaleDateString(
            "ru-RU",
            {
                weekday: "short",
                day: "numeric",
                month: "short"
            }
        );

}



/* =========================================================
   SAFE HTML
========================================================= */

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            text ?? ""
        );


    return div.innerHTML;

}



/* =========================================================
   NAVIGATION
========================================================= */

document
    .querySelectorAll(
        ".nav-btn"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const page =
                    button.dataset.page;


                switchPage(
                    page
                );


                if (
                    page === "review"
                ) {

                    startReview();

                }

            }
        );

    });


function switchPage(
    pageName
) {

    document
        .querySelectorAll(
            ".page"
        )
        .forEach(page => {

            page.classList
                .remove(
                    "active"
                );

        });


    document
        .querySelectorAll(
            ".nav-btn"
        )
        .forEach(button => {

            button.classList
                .remove(
                    "active"
                );

        });


    document
        .getElementById(
            pageName
        )
        .classList
        .add(
            "active"
        );


    const button =
        document.querySelector(
            `[data-page="${pageName}"]`
        );


    if (button) {

        button.classList
            .add(
                "active"
            );

    }


    updateEverything();

}



/* =========================================================
   GREETING
========================================================= */

function updateGreeting() {

    const hour =
        new Date()
            .getHours();


    let greeting;


    if (
        hour < 12
    ) {

        greeting =
            "Доброе утро 👋";

    }

    else if (
        hour < 18
    ) {

        greeting =
            "Добрый день 👋";

    }

    else {

        greeting =
            "Добрый вечер 👋";

    }


    document
        .getElementById(
            "greeting"
        )
        .textContent =
        greeting;

}



/* =========================================================
   MAIN BUTTON
========================================================= */

document
    .getElementById(
        "startReviewButton"
    )
    .addEventListener(
        "click",
        openReview
    );



/* =========================================================
   UPDATE
========================================================= */

function updateEverything() {

    updateGreeting();

    prepareToday();

    updateDashboard();

    renderSubjectFilter();

    renderCards();

    renderUpcoming();

}



/* =========================================================
   SERVICE WORKER
========================================================= */

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator
                .serviceWorker
                .register(
                    "./sw.js"
                )
                .catch(error => {

                    console.error(
                        "Service Worker:",
                        error
                    );

                });

        }
    );

}

/* =========================================================
   AI GENERATOR
========================================================= */

const generateAICardsButton =
    document.getElementById(
        "generateAICardsButton"
    );


if (generateAICardsButton) {

    generateAICardsButton.addEventListener(
        "click",
        generateAICards
    );

}



async function generateAICards() {

    const notes =
        document
            .getElementById(
                "aiNotesInput"
            )
            .value
            .trim();


    const status =
        document.getElementById(
            "aiStatus"
        );


    const preview =
        document.getElementById(
            "aiCardsPreview"
        );


    if (notes.length < 30) {

        status.className =
            "ai-status error";


        status.textContent =
            "Конспект слишком короткий.";

        return;

    }


    if (notes.length > 12000) {

        status.className =
            "ai-status error";


        status.textContent =
            "Конспект слишком большой. Раздели его на части.";

        return;

    }


    status.className =
        "ai-status loading";


    status.textContent =
        "✨ AI создаёт карточки...";


    preview.innerHTML = "";


    generateAICardsButton.disabled =
        true;


    generateAICardsButton.textContent =
        "Создаю...";


    try {

        const response =
            await fetch(
                AI_API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            notes
                        })
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "AI error"
            );

        }


        if (
            !Array.isArray(
                result.cards
            )
        ) {

            throw new Error(
                "AI вернул неправильный формат."
            );

        }


        generatedAICards =
            result.cards
                .filter(card => {

                    return (
                        typeof card.question ===
                        "string" &&
                        typeof card.answer ===
                        "string"
                    );

                })
                .slice(0, 5);


        status.className =
            "ai-status success";


        status.textContent =
            `✓ Создано ${generatedAICards.length} карточек`;


        renderAICardsPreview();

    }

    catch (error) {

        console.error(
            "AI:",
            error
        );


        status.className =
            "ai-status error";


        status.textContent =
            "Не удалось создать карточки. Попробуй ещё раз.";

    }

    finally {

        generateAICardsButton.disabled =
            false;


        generateAICardsButton.textContent =
            "✨ Создать 5 карточек";

    }

}



/* =========================================================
   AI PREVIEW
========================================================= */

function renderAICardsPreview() {

    const container =
        document.getElementById(
            "aiCardsPreview"
        );


    if (
        generatedAICards.length === 0
    ) {

        container.innerHTML = "";

        return;

    }


    container.innerHTML = `

        ${
            generatedAICards
                .map(
                    (card, index) => {

                        return `

                            <div class="ai-generated-card">

                                <div class="ai-generated-number">

                                    КАРТОЧКА ${index + 1}

                                </div>


                                <div class="ai-generated-question">

                                    ${
                                        escapeHTML(
                                            card.question
                                        )
                                    }

                                </div>


                                <div class="ai-generated-answer">

                                    ${
                                        escapeHTML(
                                            card.answer
                                        )
                                    }

                                </div>


                                <button
                                    class="ai-remove-button"
                                    data-ai-remove="${index}"
                                >
                                    Удалить эту карточку
                                </button>

                            </div>

                        `;

                    }
                )
                .join("")
        }


        <div class="ai-actions">

            <button
                class="button"
                id="saveAICardsButton"
            >
                + Добавить все в Recall
            </button>


            <button
                class="button secondary"
                id="regenerateAICardsButton"
            >
                ↻ Создать заново
            </button>

        </div>

    `;


    document
        .querySelectorAll(
            "[data-ai-remove]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset
                                .aiRemove
                        );


                    generatedAICards.splice(
                        index,
                        1
                    );


                    renderAICardsPreview();

                }
            );

        });


    document
        .getElementById(
            "saveAICardsButton"
        )
        .addEventListener(
            "click",
            saveGeneratedAICards
        );


    document
        .getElementById(
            "regenerateAICardsButton"
        )
        .addEventListener(
            "click",
            generateAICards
        );

}



/* =========================================================
   SAVE AI CARDS
========================================================= */

function saveGeneratedAICards() {

    if (
        generatedAICards.length === 0
    ) {

        return;

    }


    const subject =
        document
            .getElementById(
                "aiSubjectInput"
            )
            .value
            .trim() ||
        "Без предмета";


    const title =
        document
            .getElementById(
                "aiTitleInput"
            )
            .value
            .trim() ||
        "AI-конспект";


    const page =
        document
            .getElementById(
                "aiPageInput"
            )
            .value
            .trim();


    const examDate =
        document
            .getElementById(
                "aiExamInput"
            )
            .value ||
        null;


    generatedAICards.forEach(
        (aiCard, index) => {

            const id =
                Date.now() +
                index;


            const card = {

                id,

                subject,

                title,

                page,

                examDate,

                question:
                    aiCard.question.trim(),

                answer:
                    aiCard.answer.trim(),

                interval: 0,

                stability: 1,

                repetitions: 0,

                reviews: 0,

                correctReviews: 0,

                due:
                    new Date()
                        .toISOString(),

                createdAt:
                    new Date()
                        .toISOString(),

                source:
                    "ai"

            };


            data.cards.push(
                card
            );


            addCardToToday(
                id
            );

        }
    );


    saveData();


    const count =
        generatedAICards.length;


    generatedAICards =
        [];


    document.getElementById(
        "aiNotesInput"
    ).value = "";


    document.getElementById(
        "aiCardsPreview"
    ).innerHTML = "";


    document.getElementById(
        "aiStatus"
    ).className =
        "ai-status success";


    document.getElementById(
        "aiStatus"
    ).textContent =
        `✓ ${count} карточек добавлено в Recall`;


    updateEverything();

}

/* =========================================================
   START APP
========================================================= */

loadData();

prepareToday();

updateEverything();
