/* =========================================
   FINWISE DASHBOARD JAVASCRIPT
   ========================================= */


/* =========================================
   INITIAL DATA
   ========================================= */

const defaultTransactions = [
    {
        id: 1,
        name: "Swiggy",
        category: "Food & Dining",
        type: "expense",
        amount: 420,
        date: "2025-04-18"
    },
    {
        id: 2,
        name: "Netflix",
        category: "Subscriptions",
        type: "expense",
        amount: 649,
        date: "2025-04-17"
    },
    {
        id: 3,
        name: "Amazon",
        category: "Shopping",
        type: "expense",
        amount: 1250,
        date: "2025-04-16"
    },
    {
        id: 4,
        name: "Salary",
        category: "Income",
        type: "income",
        amount: 75000,
        date: "2025-04-15"
    },
    {
        id: 5,
        name: "Travel (Metro Card)",
        category: "Travel",
        type: "expense",
        amount: 300,
        date: "2025-04-14"
    }
];


const defaultBills = [
    {
        id: 1,
        name: "Electricity Bill",
        amount: 1200,
        status: "Due in 2 days"
    },
    {
        id: 2,
        name: "Internet",
        amount: 999,
        status: "Paid"
    },
    {
        id: 3,
        name: "Netflix",
        amount: 649,
        status: "Due in 2 days"
    },
    {
        id: 4,
        name: "Mobile Recharge",
        amount: 299,
        status: "Paid"
    },
    {
        id: 5,
        name: "House Rent",
        amount: 12000,
        status: "Paid"
    }
];


const defaultGoals = [
    {
        id: 1,
        name: "Travel the World",
        saved: 25000,
        target: 50000,
        icon: "✈",
        color: "blue"
    },
    {
        id: 2,
        name: "Buy Gold",
        saved: 15000,
        target: 40000,
        icon: "◆",
        color: "orange"
    },
    {
        id: 3,
        name: "New Laptop",
        saved: 30000,
        target: 60000,
        icon: "▰",
        color: "purple"
    },
    {
        id: 4,
        name: "Emergency Fund",
        saved: 20000,
        target: 100000,
        icon: "✚",
        color: "green"
    }
];


/* =========================================
   LOAD AND SAVE DATA
   ========================================= */

function loadData(key, defaultValue) {
    try {
        const saved = localStorage.getItem(key);

        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error("Could not load saved data:", error);
    }

    return defaultValue.map(item => ({ ...item }));
}


function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error("Could not save data:", error);
    }
}


let transactions = loadData("finwiseTransactions", defaultTransactions);
let bills = loadData("finwiseBills", defaultBills);
let goals = loadData("finwiseGoals", defaultGoals);

let monthlyBudget = Number(
    localStorage.getItem("finwiseBudget")
) || 50000;

let dailyBudget = Number(
    localStorage.getItem("finwiseDailyBudget")
) || 1000;

let currentAction = "transaction";
let showAllTransactions = false;
let showAllBills = false;
let showAllGoals = false;
let showAllAlerts = false;


/* =========================================
   ELEMENTS
   ========================================= */

const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const formFields = document.getElementById("formFields");
const actionForm = document.getElementById("actionForm");
const formError = document.getElementById("formError");


/* =========================================
   FORMAT HELPERS
   ========================================= */

function formatMoney(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}


function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}


/* =========================================
   CALCULATE TOTALS
   ========================================= */

function calculateTotals() {
    const income = transactions
        .filter(item => item.type === "income")
        .reduce((total, item) => total + Number(item.amount), 0);

    const expenses = transactions
        .filter(item => item.type === "expense")
        .reduce((total, item) => total + Number(item.amount), 0);

    const savings = Math.max(0, income - expenses);

    const balance = income - expenses - savings;

    document.getElementById("totalIncome").textContent = formatMoney(income);
    document.getElementById("totalExpenses").textContent = formatMoney(expenses);
    document.getElementById("totalSavings").textContent = formatMoney(savings);
    document.getElementById("totalBalance").textContent = formatMoney(balance);

    document.getElementById("donutTotal").textContent = formatMoney(expenses);
    document.getElementById("budgetSpent").textContent = formatMoney(expenses);
    document.getElementById("monthlyBudget").textContent = formatMoney(monthlyBudget);
    document.getElementById("dailyBudget").textContent = formatMoney(dailyBudget);

    updateBudgetRisk(expenses);
    updateInsights(income, expenses, savings);
    updateSpendingChart(expenses);
}


/* =========================================
   BUDGET RISK
   ========================================= */

function updateBudgetRisk(expenses) {
    const monthlyPercentage = monthlyBudget > 0
        ? (expenses / monthlyBudget) * 100
        : 0;

    const dailySpent = transactions
        .filter(item => {
            return item.type === "expense" &&
                item.date === getTodayString();
        })
        .reduce((total, item) => total + Number(item.amount), 0);

    document.getElementById("dailySpent").textContent = formatMoney(dailySpent);

    const dailyPercentage = dailyBudget > 0
        ? (dailySpent / dailyBudget) * 100
        : 0;

    document.getElementById("dailyProgress").style.width =
        Math.min(dailyPercentage, 100) + "%";

    document.getElementById("monthlyProgress").style.width =
        Math.min(monthlyPercentage, 100) + "%";

    if (dailySpent > dailyBudget) {
        document.getElementById("dailyRiskMessage").textContent =
            "Over budget by " + formatMoney(dailySpent - dailyBudget);
    } else {
        document.getElementById("dailyRiskMessage").textContent =
            "Remaining daily budget: " + formatMoney(dailyBudget - dailySpent);
    }

    if (expenses > monthlyBudget) {
        document.getElementById("monthlyRiskMessage").textContent =
            "Over budget by " + formatMoney(expenses - monthlyBudget);
    } else {
        document.getElementById("monthlyRiskMessage").textContent =
            "Remaining monthly budget: " + formatMoney(monthlyBudget - expenses);
    }
}


function getTodayString() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* =========================================
   TRANSACTIONS
   ========================================= */

function renderTransactions() {
    const list = document.getElementById("transactionList");

    const sorted = [...transactions].sort((a, b) => {
        return b.date.localeCompare(a.date) || b.id - a.id;
    });

    const visible = showAllTransactions ? sorted : sorted.slice(0, 5);

    if (visible.length === 0) {
        list.innerHTML = "<p>No transactions available.</p>";
        return;
    }

    list.innerHTML = visible.map(item => {
        const isIncome = item.type === "income";

        const iconClass = isIncome
            ? "salary"
            : getCategoryClass(item.category);

        const amountClass = isIncome ? "positive" : "negative";
        const sign = isIncome ? "+" : "-";

        return `
            <div class="transaction-row">
                <div class="transaction-icon ${iconClass}">
                    ${isIncome ? "₹" : escapeHTML(item.name.charAt(0).toUpperCase())}
                </div>

                <div class="transaction-info">
                    <strong>${escapeHTML(item.name)}</strong>
                    <span>${escapeHTML(item.category)}</span>
                </div>

                <div class="transaction-amount">
                    <strong class="${amountClass}">
                        ${sign} ${formatMoney(item.amount)}
                    </strong>
                    <span>${formatDate(item.date)}</span>
                </div>
            </div>
        `;
    }).join("");
}


function getCategoryClass(category) {
    const classes = {
        "Food & Dining": "swiggy",
        "Shopping": "amazon",
        "Travel": "travel",
        "Entertainment": "netflix",
        "Bills & Utilities": "travel",
        "Subscriptions": "netflix",
        "Others": "amazon"
    };

    return classes[category] || "travel";
}


/* =========================================
   SPENDING CHART
   ========================================= */

function updateSpendingChart(expenses) {
    const categories = [
        "Food & Dining",
        "Shopping",
        "Travel",
        "Entertainment",
        "Bills & Utilities",
        "Subscriptions",
        "Others"
    ];

    const colors = [
        "#2864e8",
        "#f3a72e",
        "#15a58d",
        "#ec4b8b",
        "#6e50d8",
        "#a3d957",
        "#9d80ed"
    ];

    const filter = document.getElementById("spendingFilter").value;

    const expenseTransactions = transactions.filter(item => {
        return item.type === "expense";
    });

    const categoryTotals = categories.map(category => {
        return expenseTransactions
            .filter(item => item.category === category)
            .reduce((sum, item) => sum + Number(item.amount), 0);
    });

    const total = categoryTotals.reduce((sum, value) => sum + value, 0);

    const categoryList = document.getElementById("categoryList");

    if (total === 0) {
        document.getElementById("spendingDonut").style.background = "#e9edf4";
        categoryList.innerHTML = "<p>No expense data available yet.</p>";
        return;
    }

    let currentPercentage = 0;
    const segments = [];

    categoryTotals.forEach((amount, index) => {
        if (amount <= 0) return;

        const percentage = (amount / total) * 100;
        const start = currentPercentage;
        currentPercentage += percentage;

        segments.push(
            `${colors[index]} ${start}% ${currentPercentage}%`
        );
    });

    document.getElementById("spendingDonut").style.background =
        `conic-gradient(${segments.join(", ")})`;

    categoryList.innerHTML = categories.map((category, index) => {
        const amount = categoryTotals[index];

        if (amount === 0) return "";

        const percentage = Math.round((amount / total) * 100);

        return `
            <div class="category-row">
                <span class="category-name">
                    <i class="dot" style="background:${colors[index]}"></i>
                    ${escapeHTML(category)}
                </span>
                <span>${percentage}%</span>
                <strong>${formatMoney(amount)}</strong>
            </div>
        `;
    }).join("");

    document.getElementById("donutTotal").textContent = formatMoney(total);
}


/* =========================================
   BILLS
   ========================================= */


function renderBills() {
    const billList = document.getElementById("billList");

    const visibleBills = showAllBills ? bills : bills.slice(0, 5);

    if (visibleBills.length === 0) {
        billList.innerHTML = "<p>No bills added yet.</p>";
        return;
    }

    billList.innerHTML = visibleBills.map(bill => {
        const paid = bill.status === "Paid";

        return `
            <div class="bill-row">
                <span>${escapeHTML(bill.name)}</span>
                <span>${formatMoney(bill.amount)}</span>

                <span class="bill-status-cell">
                    ${
                        paid
                        ? ""
                        : `<input
                            type="checkbox"
                            class="bill-paid-checkbox"
                            onchange="markAsPaid(${bill.id}, this)"
                          >`
                    }

                    <i class="status ${paid ? "paid" : "due"}">
                        ${escapeHTML(bill.status)}
                    </i>
                </span>
            </div>
        `;
    }).join("");
}

/* =========================================
   FINANCIAL GOALS
   ========================================= */

function renderGoals() {
    const goalsList = document.getElementById("goalsList");

    const visibleGoals = showAllGoals ? goals : goals.slice(0, 4);

    if (visibleGoals.length === 0) {
        goalsList.innerHTML = "<p>No goals added yet.</p>";
        return;
    }

    goalsList.innerHTML = visibleGoals.map(goal => {
        const percentage = goal.target > 0
            ? Math.min((goal.saved / goal.target) * 100, 100)
            : 0;

        return `
            <article class="goal-card">
                <div class="goal-icon ${escapeHTML(goal.color)}">
                    ${escapeHTML(goal.icon)}
                </div>

                <div class="goal-info">
                    <h4>${escapeHTML(goal.name)}</h4>
                    <p>${formatMoney(goal.saved)} / ${formatMoney(goal.target)}</p>

                    <div class="progress-track">
                        <div class="progress-fill ${escapeHTML(goal.color)}-fill"
                             style="width:${percentage}%"></div>
                    </div>
                </div>

                <strong>${Math.round(percentage)}%</strong>
            </article>
        `;
    }).join("");
}


/* =========================================
   ALERTS
   ========================================= */

function renderAlerts() {
    const alertList = document.getElementById("alertList");

    const unpaidBills = bills.filter(bill => bill.status !== "Paid");

    let alerts = unpaidBills.map(bill => ({
        type: "danger",
        symbol: "!",
        text: `${bill.name} is ${bill.status.toLowerCase()} (${formatMoney(bill.amount)})`
    }));

    const expenses = transactions
        .filter(item => item.type === "expense")
        .reduce((sum, item) => sum + Number(item.amount), 0);

    if (expenses >= monthlyBudget) {
        alerts.push({
            type: "warning",
            symbol: "!",
            text: "You have reached or exceeded your monthly budget."
        });
    }

    if (alerts.length === 0) {
        alerts.push({
            type: "success",
            symbol: "✓",
            text: "No unpaid bills or budget alerts right now."
        });
    }

    const visibleAlerts = showAllAlerts ? alerts : alerts.slice(0, 3);

    alertList.innerHTML = visibleAlerts.map(alert => `
        <div class="alert-item">
            <span class="alert-symbol ${alert.type}">
                ${alert.symbol}
            </span>
            <p>${escapeHTML(alert.text)}</p>
        </div>
    `).join("");

    const riskBills = document.getElementById("riskBills");

    if (unpaidBills.length === 0) {
        riskBills.innerHTML = "<li>No upcoming unpaid bills.</li>";
    } else {
        riskBills.innerHTML = unpaidBills.slice(0, 4).map(bill => `
            <li>${escapeHTML(bill.name)} - ${formatMoney(bill.amount)}</li>
        `).join("");
    }
}


/* =========================================
   FINANCIAL INSIGHTS
   ========================================= */

function updateInsights(income, expenses, savings) {
    const insightText = document.getElementById("insightText");
    const coachMessage = document.getElementById("coachMessage");

    if (income === 0 && expenses === 0) {
        insightText.textContent =
            "Add your income and expenses to begin reviewing your finances.";

        coachMessage.textContent =
            "Welcome! Start by recording your transactions and setting a budget.";

        return;
    }

    if (expenses > monthlyBudget) {
        insightText.textContent =
            `Your expenses are ${formatMoney(expenses - monthlyBudget)} above your monthly budget. ` +
            "Review your spending categories and consider adjusting your plan.";

        coachMessage.textContent =
            "Your recorded expenses are above your budget. Review your transactions and upcoming bills.";

    } else {
        insightText.textContent =
            `You have recorded ${formatMoney(income)} in income and ${formatMoney(expenses)} in expenses. ` +
            `Your remaining amount after expenses is ${formatMoney(savings)}.`;

        coachMessage.textContent =
            "Keep recording your transactions and checking your budget to stay informed about your money.";
    }

    document.getElementById("personalityDescription").textContent =
        expenses <= monthlyBudget
            ? "Your recorded spending is within your current monthly budget. Keep reviewing your expenses and goals."
            : "Your recorded spending is above your current monthly budget. Reviewing your categories may help you plan your next steps.";
}


/* =========================================
   MODAL FORM FIELDS
   ========================================= */

function field(label, name, type = "text", extra = "") {
    return `
        <div class="form-field">
            <label for="${name}">${label}</label>
            <input type="${type}" id="${name}" name="${name}"
                   ${extra} required>
        </div>
    `;
}


function selectField(label, name, options) {
    return `
        <div class="form-field">
            <label for="${name}">${label}</label>
            <select id="${name}" name="${name}" required>
                ${options.map(option => `
                    <option value="${escapeHTML(option.value)}">
                        ${escapeHTML(option.label)}
                    </option>
                `).join("")}
            </select>
        </div>
    `;
}


function openModal(action) {
    currentAction = action;
    formError.textContent = "";

    modalOverlay.classList.add("show");

    if (action === "transaction") {
        modalTitle.textContent = "Add Transaction";

        formFields.innerHTML =
            field("Transaction Name", "itemName") +

            selectField("Transaction Type", "itemType", [
                { value: "expense", label: "Expense" },
                { value: "income", label: "Income" }
            ]) +

            selectField("Category", "itemCategory", [
                { value: "Food & Dining", label: "Food & Dining" },
                { value: "Shopping", label: "Shopping" },
                { value: "Travel", label: "Travel" },
                { value: "Entertainment", label: "Entertainment" },
                { value: "Bills & Utilities", label: "Bills & Utilities" },
                { value: "Subscriptions", label: "Subscriptions" },
                { value: "Others", label: "Others" },
                { value: "Income", label: "Income" }
            ]) +

            field("Amount (₹)", "itemAmount", "number",
                'min="0.01" step="0.01"') +

            field("Date", "itemDate", "date",
                `value="${getTodayString()}"`);
    }

    else if (action === "budget") {
        modalTitle.textContent = "Set Monthly Budget";

        formFields.innerHTML =
            field("Monthly Budget (₹)", "budgetAmount", "number",
                `min="1" step="0.01" value="${monthlyBudget}"`) +

            field("Daily Budget (₹)", "dailyBudgetAmount", "number",
                `min="1" step="0.01" value="${dailyBudget}"`);
    }

    else if (action === "bill") {
        modalTitle.textContent = "Add Bill";

        formFields.innerHTML =
            field("Bill Name", "billName") +

            field("Amount (₹)", "billAmount", "number",
                'min="0.01" step="0.01"') +

            selectField("Payment Status", "billStatus", [
                { value: "Due in 2 days", label: "Due in 2 days" },
                { value: "Due in 5 days", label: "Due in 5 days" },
                { value: "Due in 7 days", label: "Due in 7 days" },
                { value: "Paid", label: "Paid" }
            ]);
    }

    else if (action === "goal") {
        modalTitle.textContent = "Set Financial Goal";

        formFields.innerHTML =
            field("Goal Name", "goalName") +

            field("Current Savings (₹)", "goalSaved", "number",
                'min="0" step="0.01" value="0"') +

            field("Target Amount (₹)", "goalTarget", "number",
                'min="1" step="0.01"');
    }
}


function closeModal() {
    modalOverlay.classList.remove("show");
    actionForm.reset();
    formFields.innerHTML = "";
    formError.textContent = "";
}


/* =========================================
   FORM SUBMISSION
   ========================================= */

actionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    formError.textContent = "";

    if (!actionForm.reportValidity()) {
        return;
    }

    const data = new FormData(actionForm);

    if (currentAction === "transaction") {
        const name = String(data.get("itemName")).trim();
        const type = data.get("itemType");
        const category = data.get("itemCategory");
        const amount = Number(data.get("itemAmount"));
        const date = data.get("itemDate");

        if (!name || amount <= 0 || !date) {
            formError.textContent = "Please enter valid transaction details.";
            return;
        }

        transactions.push({
            id: Date.now(),
            name,
            type,
            category: type === "income" ? "Income" : category,
            amount,
            date
        });

        saveData("finwiseTransactions", transactions);
    }


    else if (currentAction === "budget") {
        const newMonthlyBudget = Number(data.get("budgetAmount"));
        const newDailyBudget = Number(data.get("dailyBudgetAmount"));

        if (newMonthlyBudget <= 0 || newDailyBudget <= 0) {
            formError.textContent = "Budget amounts must be greater than zero.";
            return;
        }

        monthlyBudget = newMonthlyBudget;
        dailyBudget = newDailyBudget;

        localStorage.setItem("finwiseBudget", monthlyBudget);
        localStorage.setItem("finwiseDailyBudget", dailyBudget);
    }


    else if (currentAction === "bill") {
        const name = String(data.get("billName")).trim();
        const amount = Number(data.get("billAmount"));
        const status = data.get("billStatus");

        if (!name || amount <= 0) {
            formError.textContent = "Please enter a valid bill name and amount.";
            return;
        }

        bills.push({
            id: Date.now(),
            name,
            amount,
            status
        });

        saveData("finwiseBills", bills);
    }


    else if (currentAction === "goal") {
        const name = String(data.get("goalName")).trim();
        const saved = Number(data.get("goalSaved"));
        const target = Number(data.get("goalTarget"));

        if (!name || saved < 0 || target <= 0) {
            formError.textContent = "Please enter valid goal details.";
            return;
        }

        goals.push({
            id: Date.now(),
            name,
            saved,
            target,
            icon: "◎",
            color: "blue"
        });

        saveData("finwiseGoals", goals);
    }


    closeModal();
    renderDashboard();
});


/* =========================================
   QUICK ACTION BUTTONS
   ========================================= */

document.querySelectorAll(".quick-action").forEach(button => {
    button.addEventListener("click", function () {
        openModal(this.dataset.action);
    });
});


document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);


modalOverlay.addEventListener("click", function (event) {
    if (event.target === modalOverlay) {
        closeModal();
    }
});


document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeModal();
    }
});


/* =========================================
   VIEW ALL BUTTONS
   ========================================= */

document.getElementById("viewTransactions").addEventListener("click", function () {
    showAllTransactions = !showAllTransactions;

    this.textContent = showAllTransactions ? "Show Less" : "View All";

    renderTransactions();
});


document.getElementById("viewBills").addEventListener("click", function () {
    showAllBills = !showAllBills;

    this.textContent = showAllBills ? "Show Less" : "View All";

    renderBills();
});


document.getElementById("viewGoals").addEventListener("click", function () {
    showAllGoals = !showAllGoals;

    this.textContent = showAllGoals ? "Show Less" : "View All";

    renderGoals();
});


document.getElementById("viewAlerts").addEventListener("click", function () {
    showAllAlerts = !showAllAlerts;

    this.textContent = showAllAlerts ? "Show Less" : "View All";

    renderAlerts();
});


/* =========================================
   PROFILE
   ========================================= */

document.getElementById("saveProfile").addEventListener("click", function () {
    const name = document.getElementById("userName").value.trim();

    if (!name) {
        alert("Please enter your name.");
        return;
    }

    localStorage.setItem("finwiseUserName", name);

    document.querySelector(".topbar h1").textContent =
        `Hello, ${name}! 👋`;

    document.getElementById("profileButton").textContent =
        name.charAt(0).toUpperCase();

    alert("Profile updated successfully.");
});


function loadProfile() {
    const savedName = localStorage.getItem("finwiseUserName");

    if (savedName) {
        document.getElementById("userName").value = savedName;

        document.querySelector(".topbar h1").textContent =
            `Hello, ${savedName}! 👋`;

        document.getElementById("profileButton").textContent =
            savedName.charAt(0).toUpperCase();
    }
}


/* =========================================
   OTHER BUTTONS
   ========================================= */

document.getElementById("coachButton").addEventListener("click", function () {
    document.getElementById("insights").scrollIntoView({
        behavior: "smooth"
    });
});


document.getElementById("notificationButton").addEventListener("click", function () {
    document.getElementById("alertsPanel");

    document.querySelector(".alerts-panel").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
});


document.getElementById("profileButton").addEventListener("click", function () {
    document.getElementById("settings").scrollIntoView({
        behavior: "smooth"
    });
});


/* =========================================
   NAVIGATION ACTIVE STATE
   ========================================= */

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", function () {
        document.querySelectorAll(".nav-link").forEach(item => {
            item.classList.remove("active");
        });

        this.classList.add("active");
    });
});


/* =========================================
   FILTER CONTROLS
   ========================================= */

document.getElementById("spendingFilter").addEventListener("change", function () {
    updateSpendingChart();
});


document.getElementById("chartFilter").addEventListener("change", function () {
    const count = Number(this.value);

    const groups = document.querySelectorAll(".bar-group");

    groups.forEach((group, index) => {
        group.style.display = index >= groups.length - count ? "flex" : "none";
    });
});


document.getElementById("monthSelect").addEventListener("change", function () {
    const selectedMonth = this.value;

    document.querySelector(".topbar > div:first-child p").textContent =
        `Here's your financial snapshot for ${selectedMonth}.`;
});


/* =========================================
   RENDER EVERYTHING
   ========================================= */

function renderDashboard() {
    calculateTotals();
    renderTransactions();
    renderBills();
    renderGoals();
    renderAlerts();
}


/* =========================================
   START DASHBOARD
   ========================================= */

loadProfile();
renderDashboard();

function markAsPaid(billId, checkbox) {
    const bill = bills.find(item => item.id === billId);

    if (!bill) return;

    bill.status = checkbox.checked ? "Paid" : "Due in 2 days";

    saveData("finwiseBills", bills);

    renderBills();
    renderAlerts();
}