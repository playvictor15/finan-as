let transactions = [];
const goal = 5000;

const ctx = document.getElementById('categoryChart').getContext('2d');
let categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: ['Lazer', 'Alimentação', 'Transporte', 'Contas'],
        datasets: [{
            data: [0, 0, 0, 0],
            backgroundColor: ['#bb86fc', '#03dac6', '#ffb74d', '#cf6679'],
            borderWidth: 0
        }]
    },
    options: { plugins: { legend: { labels: { color: 'white' } } } }
});

const form = document.getElementById('transaction-form');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('desc').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;

    transactions.push({ desc, amount, category });
    updateUI();
    form.reset();
});

function updateUI() {
    let income = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
    let expense = transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);
    let balance = income - expense;

    document.getElementById('total-income').innerText = `R$ ${income.toFixed(2)}`;
    document.getElementById('total-expense').innerText = `R$ ${expense.toFixed(2)}`;
    document.getElementById('total-balance').innerText = `R$ ${balance.toFixed(2)}`;

    // Barra de Progresso
    let progress = Math.min((balance / goal) * 100, 100);
    const progressBar = document.getElementById('goal-progress');
    progressBar.style.width = `${progress}%`;
    progressBar.innerText = `${Math.floor(progress)}%`;
    document.getElementById('goal-value').innerText = `R$ ${balance.toFixed(0)} / R$ ${goal}`;

    // Atualizar Gráfico
    const categories = ['Lazer', 'Alimentação', 'Transporte', 'Contas'];
    const categoryData = categories.map(cat => 
        transactions.filter(t => t.category === cat && t.amount < 0)
                    .reduce((acc, t) => acc + Math.abs(t.amount), 0)
    );
    
    categoryChart.data.datasets[0].data = categoryData;
    categoryChart.update();
}