// --- DATA ---
let products = [];
let debts = [];
let sales = [];
let cart = [];

function loadAllData() {
        products = JSON.parse(localStorage.getItem('j&lb_v2_products')) || [
            { id: 1, name: 'Kopiko Blanca', category: 'Beverage', serving: 'Per Pack', price: 16, stock: 24 },
            { id: 2, name: 'Coca Cola', category: 'Beverage', serving: 'Per Can', price: 20, stock: 30 },
            { id: 3, name: 'Pepsi', category: 'Beverage', serving: 'Per Can', price: 20, stock: 25 }
        ];
    debts = JSON.parse(localStorage.getItem('j&lb_v2_debts')) || [];
    sales = JSON.parse(localStorage.getItem('j&lb_v2_sales')) || [];
    renderPosProducts();
    updateCartUI();
}

function saveAllData() {
    localStorage.setItem('j&lb_v1_products', JSON.stringify(products));
    localStorage.setItem('j&lb_v1_debts', JSON.stringify(debts));
    localStorage.setItem('j&lb_v1_sales', JSON.stringify(sales));
}

function switchTab(tab) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
    document.getElementById(`section-${tab}`).classList.remove('hidden');
    document.getElementById(`tab-${tab}`).classList.add('active-tab');
    if (tab === 'pos') renderPosProducts();
    if (tab === 'inventory') renderInventory();
    if (tab === 'debt') renderDebts();
    if (tab === 'sales') renderSales();
}

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = msg;
    toast.className = `fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 z-50 flex items-center gap-3 ${type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`;
    toast.style.transform = 'translateY(0)';
    setTimeout(() => toast.style.transform = 'translateY(100px)', 3000);
}

// --- POS ---
function renderPosProducts() {
    const query = document.getElementById('search-pos').value.toLowerCase();
    const grid = document.getElementById('pos-product-grid');
    grid.innerHTML = '';
    products.filter(p => p.name.toLowerCase().includes(query)).forEach(p => {
        const card = document.createElement('div');
        card.className = `glass-panel p-4 rounded-2xl cursor-pointer card-hover flex flex-col gap-2 ${p.stock <= 0 ? 'opacity-50' : ''}`;
        card.onclick = () => p.stock > 0 && addToCart(p);
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <span class="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded uppercase font-bold">${p.category}</span>
                <span class="text-[10px] text-slate-500">Stk: ${p.stock}</span>
            </div>
            <h3 class="font-bold text-sm text-slate-100">${p.name}</h3>
            <p class="text-blue-400 font-bold">₱${p.price}</p>
        `;
        grid.appendChild(card);
    });
}

function addToCart(p) {
    const item = cart.find(i => i.id === p.id);
    if (item) {
        if (item.qty < p.stock) item.qty++;
        else return showToast("Out of stock", "error");
    } else {
        cart.push({ ...p, qty: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cart-items');
    container.innerHTML = cart.length ? '' : '<div class="text-center py-10 text-slate-500 italic">Cart is empty</div>';
    let total = 0;
    cart.forEach((item, idx) => {
        total += item.price * item.qty;
        const el = document.createElement('div');
        el.className = "flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-700/50";
        el.innerHTML = `<div class="flex-1"><p class="text-sm font-medium">${item.name}</p><p class="text-[10px] text-slate-400">₱${item.price} x ${item.qty}</p></div>
            <div class="flex items-center gap-2"><button onclick="changeQty(${idx},-1)" class="w-6 h-6 rounded bg-slate-700">-</button><span class="text-xs font-bold">${item.qty}</span><button onclick="changeQty(${idx},1)" class="w-6 h-6 rounded bg-slate-700">+</button></div>`;
        container.appendChild(el);
    });
    document.getElementById('cart-total').innerText = `₱${total.toLocaleString()}`;
}

function changeQty(idx, d) {
    const p = products.find(prod => prod.id === cart[idx].id);
    if (d > 0 && cart[idx].qty >= p.stock) return showToast("Max stock", "error");
    cart[idx].qty += d;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    updateCartUI();
}

function clearCart() { 
    cart = []; 
    document.getElementById('customer-name').value = '';
    document.getElementById('initial-payment').value = '';
    document.getElementById('payment-method').value = 'cash';
    toggleCustomerField();
    updateCartUI(); 
}

function toggleCustomerField() {
    const m = document.getElementById('payment-method').value;
    document.getElementById('customer-info').classList.toggle('hidden', m === 'cash');
    document.getElementById('initial-payment').classList.toggle('hidden', m !== 'installment');
}

function checkout() {
    if (!cart.length) return showToast("Cart empty", "error");
    const method = document.getElementById('payment-method').value;
    const name = document.getElementById('customer-name').value.trim();
    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const initCash = parseFloat(document.getElementById('initial-payment').value) || 0;
    if (method !== 'cash' && !name) return showToast("Name required for debt", "error");
    const items = cart.map(i => ({ name: i.name, qty: i.qty, subtotal: i.price * i.qty }));
    cart.forEach(item => { products.find(p => p.id === item.id).stock -= item.qty; });
    if (method !== 'cash') {
        const bal = total - (method === 'installment' ? initCash : 0);
        let debt = debts.find(d => d.customer.toLowerCase() === name.toLowerCase() && d.status !== 'Paid');
        if (debt) {
            debt.total += total;
            debt.balance += bal;
            items.forEach(ni => {
                const found = debt.items.find(ei => ei.name === ni.name);
                if(found) found.qty += ni.qty; else debt.items.push({...ni});
            });
        } else {
            debts.push({ id: Date.now(), customer: name, total, balance: bal, status: 'Unpaid', date: new Date().toISOString(), items: [...items] });
        }
    }
    // Sales Log: Amount collected TODAY
    const collected = method === 'cash' ? total : (method === 'installment' ? initCash : 0);
    sales.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        items: items,
        total: collected, // Cash in hand
        actualTotal: total, // Value of items
        method: method,
        customer: name || 'Walk-in',
        type: 'Sale'
    });
    saveAllData();
    clearCart();
    renderPosProducts();
    showToast("Sale logged & stock updated");
}

// --- DEBT TRACKER ---
function renderDebts() {
    const body = document.getElementById('debt-table-body');
    body.innerHTML = '';
    debts.sort((a,b) => (a.status === 'Paid') - (b.status === 'Paid')).forEach(d => {
        const isPaid = d.status === 'Paid';
        const itemsHtml = (d.items || []).map(i => `<span class="item-tag">${i.qty}x ${i.name}</span>`).join('');
        const row = document.createElement('tr');
        row.className = isPaid ? 'opacity-40' : '';
        row.innerHTML = `
            <td class="px-6 py-4 font-bold ${isPaid ? 'paid-line-through' : ''}">${d.customer}</td>
            <td class="px-6 py-4 flex flex-wrap gap-1">${itemsHtml}</td>
            <td class="px-6 py-4 font-bold ${d.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}">₱${d.balance.toLocaleString()}</td>
            <td class="px-6 py-4"><span class="text-[10px] px-2 py-0.5 rounded font-bold ${isPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}">${d.status}</span></td>
            <td class="px-6 py-4 text-right">
                ${!isPaid ? `<button onclick="openPaymentModal(${d.id})" class="bg-emerald-600 px-3 py-1 rounded text-xs font-bold">PAY</button>` : ''}
            </td>`;
        body.appendChild(row);
    });
}

function openPaymentModal(id) {
    const d = debts.find(i => i.id === id);
    if (!d) return;
    document.getElementById('payment-debt-id').value = id;
    document.getElementById('payment-modal-subtitle').innerText = `${d.customer}'s Remaining Balance: ₱${d.balance.toLocaleString()}`;
    const list = document.getElementById('payment-items-list');
    list.innerHTML = `<p class="text-[10px] uppercase font-bold text-slate-500 mb-2">Debt History:</p>`;
    (d.items || []).forEach(i => { list.innerHTML += `<div class="flex justify-between text-xs text-slate-300"><span>${i.qty}x ${i.name}</span></div>`; });
    document.getElementById('payment-amt').value = d.balance;
    openModal('payment-modal');
}

function processDebtPayment() {
    const id = Number(document.getElementById('payment-debt-id').value);
    const amt = parseFloat(document.getElementById('payment-amt').value);
    const d = debts.find(i => i.id === id);
    if (!d || isNaN(amt)) return;
    // 1. Update Debt record
    d.balance -= amt;
    if (d.balance <= 0) { d.balance = 0; d.status = 'Paid'; }
    // 2. IMPORTANT: Generate Sales Entry for the Payment
    sales.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        items: [{ name: `Payment for Debt (${d.customer})`, qty: 1, subtotal: amt }],
        total: amt, // The cash we just received
        method: 'debt-payment',
        customer: d.customer,
        type: 'Debt Payment' // Distinguish from normal sales
    });
    saveAllData();
    closeModal('payment-modal');
    renderDebts();
    showToast("Payment received & added to Sales Report");
}

// --- SALES REPORT ---
function renderSales() {
    const body = document.getElementById('sales-table-body');
    body.innerHTML = '';
    let revenue = 0;
    sales.forEach(s => {
        revenue += s.total;
        const itemsHtml = (s.items || []).map(i => `<span class="item-tag ${s.type === 'Debt Payment' ? 'tag-debt-pay' : ''}">${i.qty}x ${i.name}</span>`).join('');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 text-[10px] text-slate-400">${new Date(s.timestamp).toLocaleString()}</td>
            <td class="px-6 py-4"><p class="text-xs font-bold">${s.customer}</p><div class="flex flex-wrap gap-1">${itemsHtml}</div></td>
            <td class="px-6 py-4"><span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded ${s.type === 'Debt Payment' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}">${s.type || 'Sale'}</span></td>
            <td class="px-6 py-4 font-bold text-emerald-400">₱${s.total.toLocaleString()}</td>`;
        body.appendChild(row);
    });
    document.getElementById('total-revenue').innerText = `₱${revenue.toLocaleString()}`;
}

// --- INVENTORY ---
function renderInventory() {
    const body = document.getElementById('inventory-table-body');
    body.innerHTML = '';
    products.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `<td class="px-6 py-4 font-medium">${p.name}</td><td class="px-6 py-4 text-xs text-slate-400">${p.category} | ${p.serving}</td>
            <td class="px-6 py-4 font-bold">₱${p.price}</td><td class="px-6 py-4"><span class="px-2 py-0.5 rounded bg-slate-800 text-xs">${p.stock}</span></td>
            <td class="px-6 py-4 text-right"><button onclick="editProduct(${p.id})" class="text-blue-400 text-xs mr-2">Edit</button><button onclick="deleteProduct(${p.id})" class="text-rose-400 text-xs">Delete</button></td>`;
        body.appendChild(row);
    });
}

function saveProduct() {
    const id = document.getElementById('edit-id').value;
    const item = { id: id ? Number(id) : Date.now(), name: document.getElementById('p-name').value, category: document.getElementById('p-cat').value, serving: document.getElementById('p-serving').value, price: parseFloat(document.getElementById('p-price').value), stock: parseInt(document.getElementById('p-stock').value) };
    if (!item.name || isNaN(item.price)) return;
    if (id) products = products.map(p => p.id === item.id ? item : p); else products.push(item);
    saveAllData(); closeModal('product-modal'); renderInventory(); showToast("Inventory saved");
}

function editProduct(id) {
    const p = products.find(i => i.id === id);
    document.getElementById('edit-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-cat').value = p.category;
    document.getElementById('p-serving').value = p.serving;
    document.getElementById('p-price').value = p.price;         
    document.getElementById('p-stock').value = p.stock;
    openModal('product-modal');
}

function deleteProduct(id) { products = products.filter(p => p.id !== id); saveAllData(); renderInventory(); }
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

window.onload = loadAllData;