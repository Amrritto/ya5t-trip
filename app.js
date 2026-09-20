/* ==========================================================================
   Group Trip Organizer & Payment Tracker - JavaScript Logic & Dynamic Expenses
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // --- Admin Credentials ---
    const ADMIN_USER = 'amr';
    const ADMIN_PASS = 'Cairo@123123@';

    // --- Default Spreadsheet Data ---
    const DEFAULT_EXPENSES = [
        { id: 'exp_1', title: 'Ya5t (Yacht)', amount: 5700, icon: 'fa-ship' },
        { id: 'exp_2', title: 'Transportation', amount: 5000, icon: 'fa-bus' },
        { id: 'exp_3', title: 'Food & Drinks', amount: 3000, icon: 'fa-utensils' }
    ];

    const DEFAULT_PARTICIPANTS = [
        { id: 'p_1', name: 'Amr', target: 1245 },
        { id: 'p_2', name: 'Body', target: 1245 },
        { id: 'p_3', name: 'Abdullah', target: 1245 },
        { id: 'p_4', name: 'Mohamed', target: 1245 },
        { id: 'p_5', name: 'Nasr', target: 1245 },
        { id: 'p_6', name: 'Reda', target: 1245 },
        { id: 'p_7', name: 'Ashraf', target: 1245 },
        { id: 'p_8', name: 'EL 3awadi', target: 1245 },
        { id: 'p_9', name: 'Saqr', target: 1245 },
        { id: 'p_10', name: 'Mohamed 2', target: 1245 },
        { id: 'p_11', name: 'Hatm', target: 1245 }
    ];

    // Seed 200 EGP APPROVED payments for each participant (Total = 2,200 EGP)
    const DEFAULT_PAYMENTS = DEFAULT_PARTICIPANTS.map((p, idx) => ({
        id: 'pay_' + (idx + 1),
        participantId: p.id,
        amount: 200,
        reason: 'Initial Deposit',
        method: 'InstaPay / Bank',
        date: new Date().toISOString().split('T')[0],
        status: 'APPROVED'
    }));

    // --- State Management ---
    let state = {
        expenses: JSON.parse(localStorage.getItem('trip_expenses')) || DEFAULT_EXPENSES,
        participants: JSON.parse(localStorage.getItem('trip_participants')) || DEFAULT_PARTICIPANTS,
        payments: JSON.parse(localStorage.getItem('trip_payments')) || DEFAULT_PAYMENTS,
        pendingPayments: JSON.parse(localStorage.getItem('trip_pending_payments')) || [],
        isAdmin: sessionStorage.getItem('trip_is_admin') === 'true',
        theme: localStorage.getItem('trip_theme') || 'dark'
    };

    let isSyncing = false;

    // --- Dynamic Auto-Distribution Function ---
    // Sums all trip expenses, counts participants, and divides equally per person!
    function autoDistributeExpenses() {
        const totalExpenses = state.expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        const count = state.participants.length;
        if (count > 0 && totalExpenses >= 0) {
            const sharePerPerson = Math.round(totalExpenses / count);
            state.participants.forEach(p => {
                p.target = sharePerPerson;
            });
        }
    }

    // Run auto-distribution on startup
    autoDistributeExpenses();

    // --- DOM Elements ---
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');

    // Admin Auth Elements
    const adminRoleStatus = document.getElementById('adminRoleStatus');
    const roleBadge = document.getElementById('roleBadge');
    const adminLoginTriggerBtn = document.getElementById('adminLoginTriggerBtn');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const adminLoginModal = document.getElementById('adminLoginModal');
    const closeAdminLoginModal = document.getElementById('closeAdminLoginModal');
    const cancelAdminLoginBtn = document.getElementById('cancelAdminLoginBtn');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminUsernameInput = document.getElementById('adminUsernameInput');
    const adminPasswordInput = document.getElementById('adminPasswordInput');
    const loginErrorMsg = document.getElementById('loginErrorMsg');
    const formRoleNotice = document.getElementById('formRoleNotice');

    // Pending Banner & Modal Elements
    const pendingApprovalsBanner = document.getElementById('pendingApprovalsBanner');
    const pendingCountText = document.getElementById('pendingCountText');
    const openPendingModalBtn = document.getElementById('openPendingModalBtn');
    const pendingModal = document.getElementById('pendingModal');
    const closePendingModal = document.getElementById('closePendingModal');
    const closePendingModalBtn = document.getElementById('closePendingModalBtn');
    const pendingListContainer = document.getElementById('pendingListContainer');

    // KPI Elements
    const kpiTotalTarget = document.getElementById('kpiTotalTarget');
    const kpiTotalCollected = document.getElementById('kpiTotalCollected');
    const kpiTotalRemaining = document.getElementById('kpiTotalRemaining');
    const kpiParticipantCount = document.getElementById('kpiParticipantCount');
    const kpiCollectedPercentage = document.getElementById('kpiCollectedPercentage');
    const kpiUnpaidCount = document.getElementById('kpiUnpaidCount');
    const mainProgressPercent = document.getElementById('mainProgressPercent');
    const mainProgressRatio = document.getElementById('mainProgressRatio');
    const mainProgressBar = document.getElementById('mainProgressBar');

    // Expenses Elements
    const expensesGrid = document.getElementById('expensesGrid');
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const expenseModal = document.getElementById('expenseModal');
    const closeExpenseModal = document.getElementById('closeExpenseModal');
    const cancelExpenseBtn = document.getElementById('cancelExpenseBtn');
    const expenseForm = document.getElementById('expenseForm');
    const expenseModalTitle = document.getElementById('expenseModalTitle');
    const editExpenseId = document.getElementById('editExpenseId');

    // Participant Table Elements
    const participantBadgeCount = document.getElementById('participantBadgeCount');
    const participantsTableBody = document.getElementById('participantsTableBody');
    const participantSearchInput = document.getElementById('participantSearchInput');
    const statusFilterSelect = document.getElementById('statusFilterSelect');
    const addParticipantBtn = document.getElementById('addParticipantBtn');
    const participantModal = document.getElementById('participantModal');
    const closeParticipantModal = document.getElementById('closeParticipantModal');
    const cancelParticipantBtn = document.getElementById('cancelParticipantBtn');
    const participantForm = document.getElementById('participantForm');
    const participantModalTitle = document.getElementById('participantModalTitle');
    const editParticipantId = document.getElementById('editParticipantId');

    // Payment Form & Ledger Elements
    const paymentForm = document.getElementById('paymentForm');
    const paymentParticipantSelect = document.getElementById('paymentParticipantSelect');
    const paymentAmountInput = document.getElementById('paymentAmountInput');
    const paymentReasonSelect = document.getElementById('paymentReasonSelect');
    const customReasonGroup = document.getElementById('customReasonGroup');
    const paymentCustomReasonInput = document.getElementById('paymentCustomReasonInput');
    const paymentMethodSelect = document.getElementById('paymentMethodSelect');
    const paymentDateInput = document.getElementById('paymentDateInput');
    const presetRemainingBtn = document.getElementById('presetRemainingBtn');
    const ledgerList = document.getElementById('ledgerList');
    const ledgerCountBadge = document.getElementById('ledgerCountBadge');
    const toastContainer = document.getElementById('toastContainer');

    paymentDateInput.value = new Date().toISOString().split('T')[0];

    // Initialize Theme & Role
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeButtonUI();
    updateRoleUI();

    // --- State Persistence ---
    function getSharedState() {
        return {
            expenses: state.expenses,
            participants: state.participants,
            payments: state.payments,
            pendingPayments: state.pendingPayments
        };
    }

    function cacheSharedState() {
        localStorage.setItem('trip_expenses', JSON.stringify(state.expenses));
        localStorage.setItem('trip_participants', JSON.stringify(state.participants));
        localStorage.setItem('trip_payments', JSON.stringify(state.payments));
        localStorage.setItem('trip_pending_payments', JSON.stringify(state.pendingPayments));
    }

    async function saveState() {
        autoDistributeExpenses(); // Automatically recalculate equal shares whenever state changes!
        cacheSharedState();
        localStorage.setItem('trip_theme', state.theme);
        sessionStorage.setItem('trip_is_admin', state.isAdmin ? 'true' : 'false');
        render();

        try {
            const response = await fetch('/api/state', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(getSharedState())
            });
            if (!response.ok) throw new Error('Shared state save failed');
        } catch (error) {
            showToast('Saved on this device, but the shared server is unavailable.', 'danger');
        }
    }

    async function syncStateFromServer() {
        if (isSyncing) return;
        isSyncing = true;
        try {
            const response = await fetch('/api/state', { cache: 'no-store' });
            if (response.status === 404) {
                await saveState();
                return;
            }
            if (!response.ok) throw new Error('Shared state load failed');
            const sharedState = await response.json();
            state.expenses = sharedState.expenses;
            state.participants = sharedState.participants;
            state.payments = sharedState.payments;
            state.pendingPayments = sharedState.pendingPayments;
            autoDistributeExpenses();
            cacheSharedState();
            render();
        } catch (error) {
            console.warn('Shared state sync unavailable:', error);
        } finally {
            isSyncing = false;
        }
    }

    function getParticipantCollected(participantId) {
        return state.payments
            .filter(p => p.participantId === participantId && p.status === 'APPROVED')
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    }

    function formatMoney(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    }

    // --- Role & UI Updates ---
    function updateRoleUI() {
        if (state.isAdmin) {
            adminRoleStatus.className = 'role-status admin-mode';
            roleBadge.innerHTML = `<i class="fa-solid fa-user-shield"></i> Admin (${ADMIN_USER})`;
            adminLoginTriggerBtn.classList.add('hidden');
            adminLogoutBtn.classList.remove('hidden');
            formRoleNotice.textContent = 'Auto-Approved (Admin)';
            formRoleNotice.className = 'badge badge-success';
            document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
        } else {
            adminRoleStatus.className = 'role-status public-mode';
            roleBadge.innerHTML = `<i class="fa-solid fa-eye"></i> Public View`;
            adminLoginTriggerBtn.classList.remove('hidden');
            adminLogoutBtn.classList.add('hidden');
            formRoleNotice.textContent = 'Needs Admin Approval';
            formRoleNotice.className = 'badge badge-primary';
            document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
        }
    }

    // --- Main Render Function ---
    function render() {
        updateRoleUI();

        // 1. Calculate Totals
        const totalExpenses = state.expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        const participantCount = state.participants.length;
        const sharePerPerson = participantCount > 0 ? Math.round(totalExpenses / participantCount) : 0;
        const totalTarget = totalExpenses;
        
        const totalCollected = state.payments
            .filter(p => p.status === 'APPROVED')
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

        const totalRemaining = Math.max(0, totalTarget - totalCollected);
        const progressPct = totalTarget > 0 ? ((totalCollected / totalTarget) * 100).toFixed(1) : 0;

        let unpaidCount = 0;
        state.participants.forEach(p => {
            const col = getParticipantCollected(p.id);
            if (col < p.target) unpaidCount++;
        });

        // Update KPI UI
        kpiTotalTarget.innerHTML = `${formatMoney(totalTarget)} <small>EGP</small>`;
        kpiTotalCollected.innerHTML = `${formatMoney(totalCollected)} <small>EGP</small>`;
        kpiTotalRemaining.innerHTML = `${formatMoney(totalRemaining)} <small>EGP</small>`;
        kpiParticipantCount.textContent = participantCount;
        kpiCollectedPercentage.textContent = `${progressPct}%`;
        kpiUnpaidCount.textContent = unpaidCount;
        mainProgressPercent.textContent = `${Math.min(100, Math.round(progressPct))}%`;
        mainProgressRatio.textContent = `${formatMoney(totalCollected)} / ${formatMoney(totalTarget)} EGP`;
        mainProgressBar.style.width = `${Math.min(100, progressPct)}%`;

        // Update KPI Subtext with dynamic split info
        const kpiSubtext = document.querySelector('.total-budget .kpi-subtext');
        if (kpiSubtext) {
            kpiSubtext.innerHTML = `<span id="kpiParticipantCount">${participantCount}</span> Participants • <strong>${formatMoney(sharePerPerson)} EGP</strong> / person`;
        }

        // 2. Pending Approvals Banner
        const pendingCount = state.pendingPayments.length;
        pendingCountText.textContent = pendingCount;
        if (pendingCount > 0) {
            pendingApprovalsBanner.classList.remove('hidden');
        } else {
            pendingApprovalsBanner.classList.add('hidden');
        }

        // 3. Render Expenses Grid
        expensesGrid.innerHTML = state.expenses.map(exp => `
            <div class="expense-item-card">
                <div class="expense-icon">
                    <i class="fa-solid ${exp.icon || 'fa-tag'}"></i>
                </div>
                <div class="expense-details">
                    <div class="expense-title">${exp.title}</div>
                    <div class="expense-amount">${formatMoney(exp.amount)} <small style="font-size:0.75rem; font-weight:400; color:var(--text-muted);">EGP</small></div>
                </div>
                ${state.isAdmin ? `
                    <div style="display:flex; gap:0.2rem;">
                        <button class="ledger-delete-btn" onclick="openEditExpense('${exp.id}')" title="Edit Expense">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="ledger-delete-btn" onclick="deleteExpense('${exp.id}')" title="Delete Expense">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');

        // 4. Render Participant Dropdown for Payment Form
        paymentParticipantSelect.innerHTML = '<option value="" disabled selected>-- Select Member --</option>' +
            state.participants.map(p => {
                const col = getParticipantCollected(p.id);
                const rem = p.target - col;
                return `<option value="${p.id}">${p.name} (Rem: ${formatMoney(Math.max(0, rem))} EGP)</option>`;
            }).join('');

        // 5. Render Participant Table
        participantBadgeCount.textContent = `${state.participants.length} Members`;
        const searchTerm = participantSearchInput.value.toLowerCase().trim();
        const statusFilter = statusFilterSelect.value;

        const filteredParticipants = state.participants.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm);
            const collected = getParticipantCollected(p.id);
            const vs = p.target - collected;

            let status = 'UNPAID';
            if (vs <= 0) status = 'PAID';
            else if (collected > 0) status = 'PARTIAL';

            const matchesStatus = (statusFilter === 'ALL') || (statusFilter === status);

            return matchesSearch && matchesStatus;
        });

        participantsTableBody.innerHTML = filteredParticipants.map(p => {
            const collected = getParticipantCollected(p.id);
            const vs = p.target - collected;
            const pct = p.target > 0 ? Math.min(100, (collected / p.target) * 100).toFixed(0) : 0;
            
            let statusBadge = '<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> Unpaid</span>';
            if (vs <= 0) {
                statusBadge = '<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Paid</span>';
            } else if (collected > 0) {
                statusBadge = '<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Partial</span>';
            }

            const initialLetter = p.name.charAt(0).toUpperCase();

            return `
                <tr>
                    <td>
                        <div class="participant-cell">
                            <div class="avatar">${initialLetter}</div>
                            <span>${p.name}</span>
                        </div>
                    </td>
                    <td><strong>${formatMoney(p.target)}</strong> EGP</td>
                    <td class="success-text"><strong>${formatMoney(collected)}</strong> EGP</td>
                    <td class="${vs > 0 ? 'warning-text' : 'success-text'}">
                        <strong>${formatMoney(Math.max(0, vs))}</strong> EGP
                    </td>
                    <td>
                        <div style="width: 100px;">
                            <div style="font-size:0.75rem; display:flex; justify-content:space-between; margin-bottom:2px;">
                                <span>${pct}%</span>
                            </div>
                            <div class="progress-bar-container" style="height:6px;">
                                <div class="progress-bar-fill" style="width:${pct}%;"></div>
                            </div>
                        </div>
                    </td>
                    <td>${statusBadge}</td>
                    <td class="text-right">
                        <button class="btn btn-sm btn-outline" onclick="quickPayFor('${p.id}')" title="Log Payment">
                            <i class="fa-solid fa-plus"></i> Pay
                        </button>
                        ${state.isAdmin ? `
                            <button class="ledger-delete-btn" onclick="openEditParticipant('${p.id}')" title="Edit Participant" style="margin-left: 0.25rem;">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="ledger-delete-btn" onclick="deleteParticipant('${p.id}')" title="Delete Participant" style="margin-left: 0.25rem;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');

        if (filteredParticipants.length === 0) {
            participantsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                        No participants found matching filter criteria.
                    </td>
                </tr>
            `;
        }

        // 6. Render Approved Payments Ledger
        const approvedPayments = state.payments.filter(p => p.status === 'APPROVED');
        ledgerCountBadge.textContent = `${approvedPayments.length} Payments`;
        const sortedPayments = [...approvedPayments].reverse();

        ledgerList.innerHTML = sortedPayments.map(pay => {
            const p = state.participants.find(part => part.id === pay.participantId) || { name: 'Unknown' };
            return `
                <div class="ledger-item">
                    <div class="ledger-info">
                        <div class="ledger-name">${p.name}</div>
                        <div class="ledger-reason">${pay.reason} • <span style="color:var(--text-dim);">${pay.method}</span></div>
                        <div class="ledger-meta"><i class="fa-solid fa-calendar"></i> ${pay.date}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div class="ledger-amount">+${formatMoney(pay.amount)} EGP</div>
                        ${state.isAdmin ? `
                            <button class="ledger-delete-btn" onclick="deletePayment('${pay.id}')" title="Delete Transaction">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        if (sortedPayments.length === 0) {
            ledgerList.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 2rem 1rem;">
                    No approved transactions yet.
                </div>
            `;
        }

        // 7. Render Pending Approvals List in Modal
        renderPendingModal();
    }

    function renderPendingModal() {
        if (state.pendingPayments.length === 0) {
            pendingListContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 2rem 1rem;">
                    <i class="fa-solid fa-circle-check" style="font-size:2rem; color:var(--success); margin-bottom:0.5rem;"></i>
                    <p>No pending payments awaiting approval.</p>
                </div>
            `;
            return;
        }

        pendingListContainer.innerHTML = state.pendingPayments.map(pay => {
            const p = state.participants.find(part => part.id === pay.participantId) || { name: 'Unknown' };
            return `
                <div class="pending-item">
                    <div class="ledger-info">
                        <div class="ledger-name" style="font-size:1rem;">${p.name}</div>
                        <div class="ledger-reason"><strong>${formatMoney(pay.amount)} EGP</strong> • ${pay.reason} (${pay.method})</div>
                        <div class="ledger-meta"><i class="fa-solid fa-calendar"></i> Submitted: ${pay.date}</div>
                    </div>
                    <div class="pending-actions">
                        ${state.isAdmin ? `
                            <button class="btn-success-sm" onclick="approvePendingPayment('${pay.id}')">
                                <i class="fa-solid fa-check"></i> Approve
                            </button>
                            <button class="btn-danger-sm" onclick="rejectPendingPayment('${pay.id}')">
                                <i class="fa-solid fa-xmark"></i> Reject
                            </button>
                        ` : `
                            <span class="badge badge-warning"><i class="fa-solid fa-lock"></i> Needs Amr Login</span>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- Admin Auth Modal Logic ---
    adminLoginTriggerBtn.addEventListener('click', () => {
        loginErrorMsg.classList.add('hidden');
        adminLoginModal.classList.add('active');
        adminUsernameInput.focus();
    });

    closeAdminLoginModal.addEventListener('click', () => adminLoginModal.classList.remove('active'));
    cancelAdminLoginBtn.addEventListener('click', () => adminLoginModal.classList.remove('active'));

    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = adminUsernameInput.value.trim();
        const pass = adminPasswordInput.value.trim();

        if (user === ADMIN_USER && pass === ADMIN_PASS) {
            state.isAdmin = true;
            saveState();
            adminLoginModal.classList.remove('active');
            adminLoginForm.reset();
            showToast('Welcome back, Admin (amr)!', 'success');
        } else {
            loginErrorMsg.classList.remove('hidden');
        }
    });

    adminLogoutBtn.addEventListener('click', () => {
        state.isAdmin = false;
        saveState();
        showToast('Logged out of Admin mode.', 'success');
    });

    // --- Pending Modal Trigger ---
    openPendingModalBtn.addEventListener('click', () => {
        pendingModal.classList.add('active');
    });
    closePendingModal.addEventListener('click', () => pendingModal.classList.remove('active'));
    closePendingModalBtn.addEventListener('click', () => pendingModal.classList.remove('active'));

    // --- Admin Approval Actions ---
    window.approvePendingPayment = function(paymentId) {
        if (!state.isAdmin) return;
        const index = state.pendingPayments.findIndex(p => p.id === paymentId);
        if (index !== -1) {
            const approvedPay = state.pendingPayments.splice(index, 1)[0];
            approvedPay.status = 'APPROVED';
            state.payments.push(approvedPay);
            saveState();
            showToast('Payment approved & added to total collected!', 'success');
            try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } }); } catch (err) {}
        }
    };

    window.rejectPendingPayment = function(paymentId) {
        if (!state.isAdmin) return;
        state.pendingPayments = state.pendingPayments.filter(p => p.id !== paymentId);
        saveState();
        showToast('Payment submission rejected.', 'danger');
    };

    // --- Payment Submission Handler ---
    paymentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pId = paymentParticipantSelect.value;
        const amount = parseFloat(paymentAmountInput.value);

        if (!pId) {
            showToast('Please select a participant', 'danger');
            return;
        }

        if (!amount || amount <= 0) {
            showToast('Please enter a valid amount', 'danger');
            return;
        }

        let reason = paymentReasonSelect.value;
        if (reason === 'Custom') {
            reason = paymentCustomReasonInput.value.trim() || 'Custom Payment';
        }

        const p = state.participants.find(part => part.id === pId);

        if (state.isAdmin) {
            // Admin payment is auto-approved instantly
            const newPayment = {
                id: 'pay_' + Date.now(),
                participantId: pId,
                amount: amount,
                reason: reason,
                method: paymentMethodSelect.value,
                date: paymentDateInput.value || new Date().toISOString().split('T')[0],
                status: 'APPROVED'
            };
            state.payments.push(newPayment);
            saveState();
            showToast(`Payment of ${formatMoney(amount)} EGP logged & approved for ${p.name}!`, 'success');
            try { confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } }); } catch (err) {}
        } else {
            // Public payment goes to pending queue
            const newPending = {
                id: 'pay_' + Date.now(),
                participantId: pId,
                amount: amount,
                reason: reason,
                method: paymentMethodSelect.value,
                date: paymentDateInput.value || new Date().toISOString().split('T')[0],
                status: 'PENDING'
            };
            state.pendingPayments.push(newPending);
            saveState();
            showToast(`Payment submitted! Pending approval from Admin (amr).`, 'success');
        }

        paymentAmountInput.value = '';
    });

    // --- Theme & Presets ---
    themeToggleBtn.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', state.theme);
        updateThemeButtonUI();
        saveState();
    });

    function updateThemeButtonUI() {
        if (state.theme === 'dark') {
            themeToggleBtn.innerHTML = `<i class="fa-solid fa-sun"></i> <span>Light Mode</span>`;
        } else {
            themeToggleBtn.innerHTML = `<i class="fa-solid fa-moon"></i> <span>Dark Mode</span>`;
        }
    }

    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.id === 'presetRemainingBtn') {
                const selectedPartId = paymentParticipantSelect.value;
                if (!selectedPartId) {
                    showToast('Please select a participant first!', 'danger');
                    return;
                }
                const p = state.participants.find(part => part.id === selectedPartId);
                const col = getParticipantCollected(selectedPartId);
                const rem = Math.max(0, p.target - col);
                paymentAmountInput.value = rem;
            } else {
                paymentAmountInput.value = e.target.getAttribute('data-amount');
            }
        });
    });

    paymentReasonSelect.addEventListener('change', () => {
        if (paymentReasonSelect.value === 'Custom') customReasonGroup.classList.remove('hidden');
        else customReasonGroup.classList.add('hidden');
    });

    paymentParticipantSelect.addEventListener('change', () => {
        const pId = paymentParticipantSelect.value;
        const p = state.participants.find(part => part.id === pId);
        if (p) {
            const col = getParticipantCollected(pId);
            const rem = Math.max(0, p.target - col);
            presetRemainingBtn.textContent = `Full (${formatMoney(rem)})`;
        }
    });

    // --- Participant Edit / Delete Handlers (Admin Only) ---
    window.quickPayFor = function(participantId) {
        paymentParticipantSelect.value = participantId;
        const p = state.participants.find(part => part.id === participantId);
        if (p) {
            const col = getParticipantCollected(participantId);
            const rem = Math.max(0, p.target - col);
            paymentAmountInput.value = rem > 0 ? rem : 200;
        }
        document.getElementById('paymentFormSection').scrollIntoView({ behavior: 'smooth' });
    };

    window.openEditParticipant = function(participantId) {
        if (!state.isAdmin) return;
        const p = state.participants.find(part => part.id === participantId);
        if (p) {
            editParticipantId.value = p.id;
            document.getElementById('participantNameInput').value = p.name;
            document.getElementById('participantTargetInput').value = p.target;
            participantModalTitle.innerHTML = `<i class="fa-solid fa-pen"></i> Edit Participant: ${p.name}`;
            participantModal.classList.add('active');
        }
    };

    window.deleteParticipant = function(participantId) {
        if (!state.isAdmin) {
            showToast('Only Admin (amr) can delete participants!', 'danger');
            return;
        }
        const p = state.participants.find(part => part.id === participantId);
        if (confirm(`Delete participant "${p.name}" and all associated payment records?`)) {
            state.participants = state.participants.filter(part => part.id !== participantId);
            state.payments = state.payments.filter(pay => pay.participantId !== participantId);
            state.pendingPayments = state.pendingPayments.filter(pay => pay.participantId !== participantId);
            saveState();
            showToast(`Participant ${p.name} removed & shares recalculated!`, 'success');
        }
    };

    window.deletePayment = function(paymentId) {
        if (!state.isAdmin) {
            showToast('Only Admin (amr) can delete transactions!', 'danger');
            return;
        }
        if (confirm('Are you sure you want to delete this payment entry?')) {
            state.payments = state.payments.filter(pay => pay.id !== paymentId);
            saveState();
            showToast('Transaction deleted.', 'success');
        }
    };

    // Participant Modal Submit (Add or Edit)
    addParticipantBtn.addEventListener('click', () => {
        if (!state.isAdmin) return;
        editParticipantId.value = '';
        participantForm.reset();
        document.getElementById('participantTargetInput').value = '1245';
        participantModalTitle.innerHTML = `<i class="fa-solid fa-user-plus"></i> Add Trip Participant`;
        participantModal.classList.add('active');
    });

    closeParticipantModal.addEventListener('click', () => participantModal.classList.remove('active'));
    cancelParticipantBtn.addEventListener('click', () => participantModal.classList.remove('active'));

    participantForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pId = editParticipantId.value;
        const name = document.getElementById('participantNameInput').value.trim();
        const target = parseFloat(document.getElementById('participantTargetInput').value) || 1245;

        if (!name) return;

        if (pId) {
            // Edit existing
            const p = state.participants.find(part => part.id === pId);
            if (p) {
                p.name = name;
                p.target = target;
                showToast(`Updated participant ${name}!`, 'success');
            }
        } else {
            // Add new
            state.participants.push({
                id: 'p_' + Date.now(),
                name: name,
                target: target
            });
            showToast(`Participant ${name} added & shares recalculated!`, 'success');
        }

        saveState();
        participantModal.classList.remove('active');
    });

    // --- Expense Edit / Delete Handlers (Admin Only) ---
    window.openEditExpense = function(expenseId) {
        if (!state.isAdmin) return;
        const exp = state.expenses.find(e => e.id === expenseId);
        if (exp) {
            editExpenseId.value = exp.id;
            document.getElementById('expenseTitleInput').value = exp.title;
            document.getElementById('expenseAmountInput').value = exp.amount;
            document.getElementById('expenseIconInput').value = exp.icon || 'fa-tag';
            expenseModalTitle.innerHTML = `<i class="fa-solid fa-pen"></i> Edit Expense: ${exp.title}`;
            expenseModal.classList.add('active');
        }
    };

    window.deleteExpense = function(expenseId) {
        if (!state.isAdmin) {
            showToast('Only Admin (amr) can delete expenses!', 'danger');
            return;
        }
        if (confirm('Delete this expense item?')) {
            state.expenses = state.expenses.filter(e => e.id !== expenseId);
            saveState();
            showToast('Expense item removed & shares recalculated!', 'success');
        }
    };

    addExpenseBtn.addEventListener('click', () => {
        if (!state.isAdmin) return;
        editExpenseId.value = '';
        expenseForm.reset();
        expenseModalTitle.innerHTML = `<i class="fa-solid fa-plus-circle"></i> Add Trip Expense Item`;
        expenseModal.classList.add('active');
    });

    closeExpenseModal.addEventListener('click', () => expenseModal.classList.remove('active'));
    cancelExpenseBtn.addEventListener('click', () => expenseModal.classList.remove('active'));

    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const expId = editExpenseId.value;
        const title = document.getElementById('expenseTitleInput').value.trim();
        const amount = parseFloat(document.getElementById('expenseAmountInput').value) || 0;
        const icon = document.getElementById('expenseIconInput').value;

        if (!title || amount <= 0) return;

        if (expId) {
            const exp = state.expenses.find(e => e.id === expId);
            if (exp) {
                exp.title = title;
                exp.amount = amount;
                exp.icon = icon;
                showToast(`Updated expense "${title}" & recalculated per-person shares!`, 'success');
            }
        } else {
            state.expenses.push({
                id: 'exp_' + Date.now(),
                title: title,
                amount: amount,
                icon: icon
            });
            showToast(`Expense "${title}" added & recalculated per-person shares!`, 'success');
        }

        saveState();
        expenseModal.classList.remove('active');
    });

    // Search & Filter
    participantSearchInput.addEventListener('input', render);
    statusFilterSelect.addEventListener('change', render);

    // CSV Export
    exportCsvBtn.addEventListener('click', () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "YA5T TRIP 2026 - FINANCIAL REPORT\n\n";

        const totalTarget = state.expenses.reduce((s, e) => s + e.amount, 0);
        const totalCollected = state.payments.filter(p => p.status === 'APPROVED').reduce((s, p) => s + p.amount, 0);
        csvContent += `Total Budget Target,${totalTarget} EGP\n`;
        csvContent += `Total Collected (Approved),${totalCollected} EGP\n`;
        csvContent += `Total Outstanding (VS),${totalTarget - totalCollected} EGP\n\n`;

        csvContent += "EXPENSES BREAKDOWN\nCategory,Amount (EGP)\n";
        state.expenses.forEach(e => csvContent += `"${e.title}",${e.amount}\n`);
        csvContent += "\n";

        csvContent += "PARTICIPANT BALANCES\nName,Target Share (EGP),Collected (EGP),Remaining Balance (EGP),Status\n";
        state.participants.forEach(p => {
            const col = getParticipantCollected(p.id);
            const vs = Math.max(0, p.target - col);
            let status = 'UNPAID';
            if (vs <= 0) status = 'PAID';
            else if (col > 0) status = 'PARTIAL';
            csvContent += `"${p.name}",${p.target},${col},${vs},${status}\n`;
        });
        csvContent += "\n";

        csvContent += "APPROVED TRANSACTIONS\nDate,Participant,Amount (EGP),Reason,Method\n";
        state.payments.filter(p => p.status === 'APPROVED').forEach(pay => {
            const p = state.participants.find(part => part.id === pay.participantId) || { name: 'Unknown' };
            csvContent += `"${pay.date}","${p.name}",${pay.amount},"${pay.reason}","${pay.method}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Ya5t_Trip_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Exported report to CSV successfully!', 'success');
    });

    // Toast
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const icon = type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation';
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    render();
    syncStateFromServer();
    setInterval(syncStateFromServer, 3000);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) syncStateFromServer();
    });
});
