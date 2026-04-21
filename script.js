import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAJag0c2A_ZOmpp6dMcYG9V7knk_o4lGGU",
    authDomain: "finacas-e97ca.firebaseapp.com",
    projectId: "finacas-e97ca",
    storageBucket: "finacas-e97ca.firebasestorage.app",
    messagingSenderId: "667502781524",
    appId: "1:667502781524:web:cacb4843b456b56ab5f9c1",
    measurementId: "G-E7MBW1SFGM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const authOverlay = document.getElementById('auth-overlay');
const appContent = document.getElementById('app-content');
const ctx = document.getElementById('categoryChart').getContext('2d');

let categoryChart;
const GOAL_LIMIT = 5000;

function initChart() {
    // Destrói o gráfico anterior se ele já existir para evitar erro de Canvas
    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Lazer', 'Alimentação', 'Transporte', 'Contas'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: { 
            plugins: { 
                legend: { position: 'bottom', labels: { color: '#f8fafc', padding: 20 } } 
            } 
        }
    });
}

document.getElementById('login-btn').onclick = () => signInWithPopup(auth, provider);
document.getElementById('logout-btn').onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    if (user) {
        authOverlay.style.display = 'none';
        appContent.style.display = 'block';
        initChart();
        syncData(user.uid);
    } else {
        authOverlay.style.display = 'flex';
        appContent.style.display = 'none';
    }
});

document.getElementById('transaction-form').onsubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('amount').value);
    
    try {
        await addDoc(collection(db, "transactions"), {
            uid: auth.currentUser.uid,
            description: document.getElementById('desc').value,
            amount: amount,
            category: document.getElementById('category').value,
            createdAt: serverTimestamp()
        });
        e.target.reset();
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar no banco de dados. Verifique as regras do Firebase.");
    }
};

function syncData(uid) {
    const q = query(collection(db, "transactions"), where("uid", "==", uid));
    
    onSnapshot(q, (snapshot) => {
        let income = 0;
        let expense = 0;
        let cats = { Lazer: 0, Alimentação: 0, Transporte: 0, Contas: 0 };

        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.amount > 0) {
                income += data.amount;
            } else {
                expense += Math.abs(data.amount);
                if (cats[data.category] !== undefined) {
                    cats[data.category] += Math.abs(data.amount);
                }
            }
        });

        updateDashboard(income, expense, cats);
    });
}

function updateDashboard(income, expense, cats) {
    const balance = income - expense;
    document.getElementById('total-income').innerText = `R$ ${income.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('total-expense').innerText = `R$ ${expense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('total-balance').innerText = `R$ ${balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;

    const progress = Math.min((balance / GOAL_LIMIT) * 100, 100);
    const bar = document.getElementById('goal-progress');
    bar.style.width = `${progress > 0 ? progress : 0}%`;
    bar.innerText = `${Math.floor(progress > 0 ? progress : 0)}%`;
    
    document.getElementById('financial-health').innerText = balance >= 0 ? "Saudável" : "Crítico";
    document.getElementById('financial-health').className = balance >= 0 ? "text-income" : "text-expense";
    document.getElementById('goal-value').innerText = `R$ ${balance.toFixed(0)} / R$ ${GOAL_LIMIT}`;

    if (categoryChart) {
        categoryChart.data.datasets[0].data = Object.values(cats);
        categoryChart.update();
    }
}
