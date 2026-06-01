let appData = JSON.parse(localStorage.getItem('momcare_ultra_v4')) || { tasks: [], notes: [] };
if (!appData.water) appData.water = { date: getTodayString(), count: 0 };

let activeTab = 'tasks';
let audioActive = false;
let lastCheckedMinute = -1;
let showCompleted = false;
let breatherInterval;
let summaryTimeouts = []; // Controle dos slides do Resumo

function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getTodayString() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - offset)).toISOString().slice(0, -1);
    return localISOTime.split('T')[0];
}

function checkNewDay() {
    const todayStr = getTodayString();
    const todayDOW = new Date().getDay(); 
    let lastOpened = localStorage.getItem('momcare_last_opened') || todayStr;
    
    appData.tasks = appData.tasks.map(t => {
        if (t.recurring === true) {
            t.recurringDays = [0, 1, 2, 3, 4, 5, 6];
            delete t.recurring;
        }
        return t;
    });

    if (lastOpened !== todayStr) {
        appData.tasks = appData.tasks.map(t => {
            if (t.recurringDays && t.recurringDays.includes(todayDOW)) {
                return { ...t, date: todayStr, done: false, alerted: false };
            }
            return t;
        });
        
        appData.water.count = 0;
        appData.water.date = todayStr;

        localStorage.setItem('momcare_last_opened', todayStr);
        save();
    } else if (!localStorage.getItem('momcare_last_opened')) {
        localStorage.setItem('momcare_last_opened', todayStr);
    }
}

function startApp() {
    document.querySelectorAll('audio').forEach(a => { 
        a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(e => console.log('Áudio bloqueado'));
    });
    audioActive = true;
    document.getElementById('unlock-screen').classList.add('opacity-0', 'pointer-events-none');
    
    checkNewDay(); 
    render();
}

function changeTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + tab).classList.add('active');
    
    document.getElementById('tab-tasks-content').classList.toggle('hidden', tab !== 'tasks');
    document.getElementById('tab-notes-content').classList.toggle('hidden', tab !== 'notes');
    document.getElementById('tab-stats-content').classList.toggle('hidden', tab !== 'stats');
    render();
}

function toggleCompleted() {
    showCompleted = !showCompleted;
    render();
}

function updateTime() {
    const now = new Date();
    const currentMinute = now.getMinutes();
    const tStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    document.getElementById('top-clock').innerText = tStr;
    document.getElementById('top-date').innerText = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

    const h = now.getHours();
    const gTxt = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
    document.getElementById('greeting-txt').innerText = gTxt;
    document.getElementById('user-icon').innerText = h < 6 || h > 18 ? "🌙" : "🌸";

    if (currentMinute !== lastCheckedMinute) {
        lastCheckedMinute = currentMinute;
        const todayStr = getTodayString();
        
        if (localStorage.getItem('momcare_last_opened') !== todayStr) {
            checkNewDay();
            render();
        }

        appData.tasks.forEach(t => {
            if (t.date === todayStr && t.time === tStr && !t.done && !t.alerted) {
                triggerNotif(t);
            }
        });
    }
}
setInterval(updateTime, 1000);

// ====== LÓGICA DO RESUMO DA SUPERMÃE (NOVO) ======
function openSummary() {
    // Calcula as estatísticas
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const limitDateStr = sevenDaysAgo.toISOString().split('T')[0];

    const recentTasks = appData.tasks.filter(t => t.date >= limitDateStr);
    const totalDoneWeek = recentTasks.filter(t => t.done).length;
    const totalPearls = appData.notes.filter(n => n.isPearl).length;

    // Atualiza os números nos slides
    document.getElementById('sum-tasks').innerText = totalDoneWeek;
    document.getElementById('sum-pearls').innerText = totalPearls;

    // Abre o Modal
    document.getElementById('summary-modal').classList.replace('hidden', 'flex');
    if(audioActive) document.getElementById('done-sound').play();

    // Reseta todos os slides
    summaryTimeouts.forEach(clearTimeout);
    summaryTimeouts = [];
    [1, 2, 3, 4].forEach(s => hideSlide(s));
    
    // Inicia a apresentação cronometrada
    showSlide(1);
    
    summaryTimeouts.push(setTimeout(() => { hideSlide(1); showSlide(2); }, 3500));
    summaryTimeouts.push(setTimeout(() => { hideSlide(2); showSlide(3); }, 8000));
    summaryTimeouts.push(setTimeout(() => { 
        hideSlide(3); 
        showSlide(4); 
        // Explosão premium de confetes!
        confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 }, zIndex: 9999 });
    }, 12500));
}

function showSlide(num) {
    const el = document.getElementById(`summary-slide-${num}`);
    el.classList.add('opacity-100');
    el.classList.remove('opacity-0', 'pointer-events-none');
}

function hideSlide(num) {
    const el = document.getElementById(`summary-slide-${num}`);
    el.classList.remove('opacity-100');
    el.classList.add('opacity-0', 'pointer-events-none');
}

function closeSummary() {
    summaryTimeouts.forEach(clearTimeout);
    document.getElementById('summary-modal').classList.replace('flex', 'hidden');
}


// ====== MODAL DA RECOMPENSA ======
function openRewardModal() {
    const frases = [
        "Você é incrível, mamãe! Um gole de água por favor?",
        "Tudo o que você faz é especial. Momento de pausa!",
        "Um carinho em forma de descanso para você.",
        "Você merece esse momento. Beba uma aguinha!",
        "Você está cuidando de tudo com tanto amor. Agora é sua vez."
    ];
    
    document.getElementById('reward-msg').innerText = frases[Math.floor(Math.random() * frases.length)];
    
    renderWater(); 
    document.getElementById('reward-modal').classList.replace('hidden', 'flex');
}

function closeRewardModal() {
    document.getElementById('reward-modal').classList.replace('flex', 'hidden');
}

// ====== LÓGICA DE ÁGUA ======
function toggleWater(index) {
    if (appData.water.count === index + 1) {
        appData.water.count = index; 
    } else {
        appData.water.count = index + 1;
    }
    
    if (appData.water.count === 8) {
        confetti({ particleCount: 50, spread: 40, colors: ['#60A5FA', '#3B82F6', '#93C5FD'] });
    }
    
    save();
    renderWater();
}

function renderWater() {
    const container = document.getElementById('water-glasses-container');
    if (!container) return;
    container.innerHTML = '';
    
    for (let i = 0; i < 8; i++) {
        const isFilled = i < appData.water.count;
        const btn = document.createElement('button');
        btn.className = `text-2xl transition-all duration-300 transform active:scale-75 ${isFilled ? 'scale-110 drop-shadow-md' : 'grayscale opacity-30 hover:opacity-60'}`;
        btn.innerText = '💧';
        btn.onclick = () => toggleWater(i);
        container.appendChild(btn);
    }
    document.getElementById('water-count-text').innerText = `${appData.water.count}/8 copos`;
}

// ====== LÓGICA DE PAUSA (BREATHER) ======
const breatherQuotes = [
    "Você não precisa dar conta de tudo hoje.",
    "Sua saúde mental é tão importante quanto a da sua família.",
    "Respire fundo. Você está fazendo um trabalho incrível.",
    "Tudo bem pedir ajuda. Você não está sozinha.",
    "Feche os olhos, relaxe os ombros e respire devagar.",
    "Um passo de cada vez. Uma hora de cada vez.",
    "Ame a si mesma com a mesma intensidade que ama seus filhos."
];

function openBreather() {
    closeRewardModal(); 
    
    document.getElementById('breather-modal').classList.replace('hidden', 'flex');
    document.getElementById('breather-quote').innerText = `"${breatherQuotes[Math.floor(Math.random() * breatherQuotes.length)]}"`;
    
    let timeLeft = 300; 
    updateBreatherDisplay(timeLeft);
    
    breatherInterval = setInterval(() => {
        timeLeft--;
        updateBreatherDisplay(timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(breatherInterval);
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            document.getElementById('breather-timer').innerText = "Concluído!";
            if (audioActive) document.getElementById('done-sound').play();
        }
    }, 1000);
}

function updateBreatherDisplay(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    document.getElementById('breather-timer').innerText = `${m}:${s}`;
}

function closeBreather() {
    clearInterval(breatherInterval);
    document.getElementById('breather-modal').classList.replace('flex', 'hidden');
}

// ====== INTERAÇÃO DE TAREFAS ======
function toggleTask(id) {
    let justCompleted = false;

    appData.tasks = appData.tasks.map(t => {
        if (t.id === id) {
            if (!t.done) {
                if (audioActive) document.getElementById('done-sound').play();
                confetti({ particleCount: 60, spread: 50, origin: { y: 0.9 }, colors: ['#FF85A2', '#B794F4'] });
                justCompleted = true;
            }
            return { ...t, done: !t.done };
        }
        return t;
    });
    
    save(); 
    render();

    if (justCompleted) {
        setTimeout(() => {
            openRewardModal();
        }, 1000);
    }
}

// ====== CRUD E TELAS ======
function triggerNotif(task) {
    document.getElementById('notif-title').innerHTML = sanitizeHTML(task.name);
    document.getElementById('notif-modal').classList.replace('hidden', 'flex');
    if (audioActive) document.getElementById('notif-sound').play();
    task.alerted = true;
    save();
}

function dismissNotif() {
    document.getElementById('notif-modal').classList.replace('flex', 'hidden');
    document.getElementById('notif-sound').pause();
    render();
}

function toggleDay(btn) {
    btn.classList.toggle('active-day');
    btn.classList.toggle('text-gray-400');
}

function resetDays() {
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.classList.remove('active-day');
        btn.classList.add('text-gray-400');
    });
}

function setDays(daysArray) {
    resetDays();
    if (!daysArray) return;
    document.querySelectorAll('.day-btn').forEach(btn => {
        const dayVal = parseInt(btn.getAttribute('data-day'));
        if (daysArray.includes(dayVal)) {
            btn.classList.add('active-day');
            btn.classList.remove('text-gray-400');
        }
    });
}

function openEditTask(id) {
    const task = appData.tasks.find(t => t.id === id);
    if (!task) return;
    
    document.getElementById('edit-task-id').value = task.id;
    document.getElementById('in-name').value = task.name;
    document.getElementById('in-time').value = task.time;
    document.getElementById('in-cat').value = task.cat || 'casa';
    document.getElementById('in-priority').checked = task.prio || false;
    
    setDays(task.recurringDays || []);
    
    document.getElementById('modal-task-title').innerText = "Editar Atividade";
    activeTab = 'tasks';
    
    document.getElementById('modal-form').classList.replace('hidden', 'flex');
    document.getElementById('fields-task').classList.remove('hidden');
    document.getElementById('fields-note').classList.add('hidden');
}

function openInput() {
    document.getElementById('edit-task-id').value = '';
    if(document.getElementById('modal-task-title')) {
        document.getElementById('modal-task-title').innerText = "Nova Atividade";
    }
    document.getElementById('in-name').value = '';
    document.getElementById('in-time').value = '';
    document.getElementById('in-priority').checked = false;
    document.getElementById('in-pearl').checked = false; 
    
    resetDays(); 

    document.getElementById('modal-form').classList.replace('hidden', 'flex');
    document.getElementById('fields-task').classList.toggle('hidden', activeTab !== 'tasks');
    document.getElementById('fields-note').classList.toggle('hidden', activeTab !== 'notes');
}

function closeInput() { 
    document.getElementById('modal-form').classList.replace('flex', 'hidden'); 
}

function handleSave() {
    if (activeTab === 'tasks') {
        const rawName = document.getElementById('in-name').value;
        const time = document.getElementById('in-time').value;
        const cat = document.getElementById('in-cat').value;
        const prio = document.getElementById('in-priority').checked;
        const editId = document.getElementById('edit-task-id').value;
        
        const recurringDays = [];
        document.querySelectorAll('.day-btn.active-day').forEach(b => {
            recurringDays.push(parseInt(b.getAttribute('data-day')));
        });
        
        if (!rawName || !time) return;
        
        if (editId) {
            appData.tasks = appData.tasks.map(t => {
                if (t.id == editId) {
                    return { ...t, name: rawName, time: time, cat: cat, prio: prio, recurringDays: recurringDays };
                }
                return t;
            });
        } else {
            appData.tasks.push({ 
                id: Date.now(), 
                name: rawName, 
                time, 
                date: getTodayString(),
                cat, 
                prio,
                recurringDays: recurringDays,
                done: false, 
                alerted: false 
            });
        }
    } else {
        const rawNote = document.getElementById('in-note').value;
        const isPearl = document.getElementById('in-pearl').checked;
        
        if (!rawNote) return;
        
        const colors = ['#FFF5F5', '#F3F0FF', '#EBFBEE', '#FFF9DB'];
        appData.notes.push({ 
            id: Date.now(), 
            content: rawNote, 
            color: colors[Math.floor(Math.random() * colors.length)],
            isPearl: isPearl 
        });
        
        document.getElementById('in-note').value = '';
        document.getElementById('in-pearl').checked = false;
    }
    
    save(); 
    render(); 
    closeInput();
}

function deleteItem(id, type) {
    appData[type] = appData[type].filter(i => i.id !== id);
    save(); 
    render();
}

function save() { 
    localStorage.setItem('momcare_ultra_v4', JSON.stringify(appData)); 
}

function createTaskCard(t, container) {
    const safeName = sanitizeHTML(t.name);
    const card = document.createElement('div');
    
    const borderColor = t.done ? 'border-gray-200' : (t.prio ? 'priority-pulse border-pink-400' : 'border-pink-300');
    const bgClass = t.done ? 'bg-white/50' : 'glass';
    const textColor = t.done ? 'text-gray-400' : 'text-gray-800';
    const timeColor = t.done ? 'text-gray-400' : 'text-pink-500';
    const strikethrough = t.done ? 'line-through' : '';

    let recStr = '';
    if (t.recurringDays && t.recurringDays.length > 0) {
        if (t.recurringDays.length === 7) {
            recStr = `<span class="text-[9px] text-blue-500 font-bold ml-1 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">🔁 Todo dia</span>`;
        } else {
            const dayNamesShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const names = t.recurringDays.map(d => dayNamesShort[d]).join(', ');
            recStr = `<span class="text-[9px] text-blue-500 font-bold ml-1 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">🔁 ${names}</span>`;
        }
    }

    card.className = `${bgClass} p-6 rounded-[2rem] flex items-center justify-between border-l-[10px] ${borderColor} shadow-soft transition-all`;
    
    card.innerHTML = `
        <div onclick="toggleTask(${t.id})" class="flex-1 cursor-pointer pr-4">
            <div class="flex items-center gap-3">
                <span class="text-xs font-black ${timeColor}">${t.time}</span>
                <div>
                    <h4 class="font-bold ${textColor} ${strikethrough}">
                        ${t.prio ? '⭐ ' : ''}${safeName}
                    </h4>
                    ${recStr ? `<div class="mt-1">${recStr}</div>` : ''}
                </div>
            </div>
        </div>
        <div class="flex items-center gap-3 border-l border-gray-100 pl-4">
            <button onclick="openEditTask(${t.id})" class="text-gray-300 hover:text-blue-400 text-lg transition-colors pb-1">✏️</button>
            <button onclick="deleteItem(${t.id}, 'tasks')" class="text-gray-300 hover:text-red-400 text-xl transition-colors">✕</button>
        </div>
    `;
    container.appendChild(card);
}

function render() {
    const today = getTodayString();

    if (activeTab === 'tasks') {
        const container = document.getElementById('list-tasks');
        const completedContainer = document.getElementById('list-tasks-completed');
        const toggleBtn = document.getElementById('btn-toggle-completed');
        
        container.innerHTML = '';
        completedContainer.innerHTML = '';
        
        const todayTasks = appData.tasks.filter(t => t.date === today);
        const pendingTasks = todayTasks.filter(t => !t.done);
        const completedTasks = todayTasks.filter(t => t.done);

        pendingTasks.sort((a, b) => a.time.localeCompare(b.time)).forEach(t => {
            createTaskCard(t, container);
        });

        completedTasks.sort((a, b) => a.time.localeCompare(b.time)).forEach(t => {
            createTaskCard(t, completedContainer);
        });

        if (completedTasks.length > 0) {
            toggleBtn.classList.remove('hidden');
            toggleBtn.innerText = showCompleted ? 'Ocultar Concluídas' : 'Mostrar Concluídas';
            completedContainer.classList.toggle('hidden', !showCompleted);
        } else {
            toggleBtn.classList.add('hidden');
            completedContainer.classList.add('hidden');
            showCompleted = false; 
        }
        
        const doneCount = completedTasks.length;
        const prc = todayTasks.length ? Math.round((doneCount / todayTasks.length) * 100) : 0;
        document.getElementById('perc-bar').style.width = prc + '%';
        document.getElementById('perc-num').innerText = prc + '%';
    } 
    else if (activeTab === 'notes') {
        const container = document.getElementById('list-notes');
        container.innerHTML = '';
        document.getElementById('note-count').innerText = `${appData.notes.length} itens`;
        
 appData.notes.forEach(n => {
            const safeContent = sanitizeHTML(n.content);
            const el = document.createElement('div');
            
            if (n.isPearl) {
                el.className = "p-6 rounded-[2rem] shadow-sm flex justify-between items-start border border-yellow-200 bg-gradient-to-tr from-yellow-50 to-orange-50 relative overflow-hidden";
                el.innerHTML = `
                    <div class="absolute -right-3 -top-3 text-7xl opacity-20">🧸</div>
                    <div class="flex-1 z-10 pr-4">
                        <span class="text-[9px] font-black text-yellow-500 uppercase tracking-widest mb-2 block">✨ Pérola Inesquecível</span>
                        <p class="font-bold text-yellow-900 whitespace-pre-wrap">${safeContent}</p>
                    </div>
                    <button onclick="deleteItem(${n.id}, 'notes')" class="text-yellow-400 opacity-60 hover:opacity-100 ml-2 z-10 text-xl">✕</button>
                `;
            } else {
                el.className = "p-6 rounded-[2rem] shadow-sm flex justify-between items-start 
