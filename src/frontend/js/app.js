// --- DATA ---
let products = [];
let debts = [];
let sales = [];
let cart = []
function loadAllData() {
    products = JSON.parse(localStorage.getItem('nova_v8_products')) || [
        { id: 1, name: 'Pork Adobo', category: 'Dish', serving: 'Plate', price: 75, stock: 20 },
        { id: 2, name: 'Mountain Dew', category: 'Beverage', serving: 'Bottle (M)', price: 20, stock: 48 }
    ];
    debts = JSON.parse(localStorage.getItem('nova_v8_debts')) || [];
    sales = JSON.parse(localStorage.getItem('nova_v8_sales')) || [];
    renderPosProducts();
    updateCartUI();
    updateServingChoices();
}

function saveAllData() {
    localStorage.setItem('nova_v8_products', JSON.stringify(products));
    localStorage.setItem('nova_v8_debts', JSON.stringify(debts));
    localStorage.setItem('nova_v8_sales', JSON.stringify(sales));
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-nav-menu');
    menu.classList.toggle('active');
}

function switchTab(tab) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
    
    // Show specific section
    document.getElementById(`section-${tab}`).classList.remove('hidden');
    
    // Set desktop active tab
    const desktopTab = document.getElementById(`tab-${tab}`);
    if (desktopTab) desktopTab.classList.add('active-tab')
    // Close mobile menu
    document.getElementById('mobile-nav-menu').classList.remove('active');
    
    // Close cart sidebar if switching tab on mobile
    document.getElementById('cart-sidebar').classList.remove('active');
    
    if (tab === 'pos') renderPosProducts();
    if (tab === 'inventory') renderInventory();
    if (tab === 'debt') renderDebts();
    if (tab === 'sales') renderSales();
}

function toggleCartMobile() {
    const sidebar = document.getElementById('cart-sidebar');
    sidebar.classList.toggle('active');
}

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = msg;
    toast.className = `fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 z- flex items-center gap-3 ${type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`;
    toast.style.transform = 'translateY(0)';
    setTimeout(() => toast.style.transform = 'translateY(100px)', 3000);
}

function updateServingChoices() {
    const cat = document.getElementById('p-cat').value;
    const servingSelect = document.getElementById('p-serving');
    servingSelect.innerHTML = '';
    let options = [];
    if (cat === 'Dish') options = ['Plate', 'Bowl', '1 Kaldero', 'Per Piece', 'Small Tub', 'Large Tub'];
    else if (cat === 'Beverage') options = ['Bottle (M)', 'Bottle (L)', 'Can', 'Glass', 'Pitcher'];
    else options = ['Piece', 'Pack', 'Box', 'Order'];
    options.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt; o.text = opt;
        servingSelect.appendChild(o);
    });
}

function renderPosProducts() {
    const query = document.getElementById('search-pos').value.toLowerCase();
    const grid = document.getElementById('pos-product-grid');
    grid.innerHTML = '';
    products.filter(p => p.name.toLowerCase().includes(query)).forEach(p => {
        const card = document.createElement('div');
        card.className = `glass-panel p-4 rounded-2xl cursor-pointer card-hover flex flex-col gap-1 ${p.stock <= 0 ? 'opacity-50' : ''}`;
        card.onclick = () => p.stock > 0 && addToCart(p);
        card.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded uppercase font-bold">${p.category}</span>
                <span class="text-[9px] text-slate-500 font-medium">${p.stock} left</span>
            </div>
            <h3 class="font-bold text-xs md:text-sm text-slate-100 line-clamp-1">${p.name}</h3>
            <div class="flex justify-between items-center mt-2">
                <p class="text-blue-400 font-bold text-sm">₱${p.price}</p>
                <p class="text-[9px] text-slate-500 italic">${p.serving}</p>
            </div>
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
    const btn = document.getElementById('mobile-cart-btn');
    btn.classList.add('scale-110');
    setTimeout(() => btn.classList.remove('scale-110'), 200);
}

function updateCartUI() {
    const container = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    container.innerHTML = cart.length ? '' : '<div class="text-center py-20 text-slate-500 italic text-sm">No items in cart</div>';
    let total = 0;
    let count = 0;
    cart.forEach((item, idx) => {
        total += item.price * item.qty;
        count += item.qty;
        const el = document.createElement('div');
        el.className = "flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-700/50";
        el.innerHTML = `
            <div class="flex-1">
                <p class="text-xs font-semibold">${item.name}</p>
                <p class="text-[10px] text-slate-400">₱${item.price} x ${item.qty}</p>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="changeQty(${idx},-1)" class="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-xs">-</button>
                <span class="text-xs font-bold w-4 text-center">${item.qty}</span>
                <button onclick="changeQty(${idx},1)" class="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-xs">+</button>
            </div>`;
        container.appendChild(el);
    });
    document.getElementById('cart-total').innerText = `₱${total.toLocaleString()}`;
    if (cartCount) cartCount.innerText = count;
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
    if (!cart.length) return showToast("Cart is empty", "error");
    const method = document.getElementById('payment-method').value;
    const name = document.getElementById('customer-name').value.trim();
    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const initCash = parseFloat(document.getElementById('initial-payment').value) || 0
    if (method !== 'cash' && !name) return showToast("Name required", "error")
    const items = cart.map(i => ({ name: i.name, qty: i.qty, subtotal: i.price * i.qty }));
    cart.forEach(item => { products.find(p => p.id === item.id).stock -= item.qty; })
    if (method !== 'cash') {
        const bal = total - (method === 'installment' ? initCash : 0);
        let debt = debts.find(d => d.customer.toLowerCase() === name.toLowerCase() && d.status !== 'Paid');
        if (debt) {
            debt.total += total; debt.balance += bal;
            items.forEach(ni => {
                const found = debt.items.find(ei => ei.name === ni.name);
                if(found) found.qty += ni.qty; else debt.items.push({...ni});
            });
        } else {
            debts.push({ id: Date.now(), customer: name, total, balance: bal, status: 'Unpaid', date: new Date().toISOString(), items: [...items] });
        }
    
    sales.unshift({
        id: Date.now(), timestamp: new Date().toISOString(), items,
        total: method === 'cash' ? total : (method === 'installment' ? initCash : 0),
        customer: name || 'Walk-in', type: 'Sale'
    })
    saveAllData();
    clearCart();
    document.getElementById('cart-sidebar').classList.remove('active');
    renderPosProducts();
    showToast("Transaction Complete");
    }
}

function renderDebts() {
    const body = document.getElementById('debt-table-body');
    body.innerHTML = '';
    debts.filter(d => d.status !== 'Paid').forEach(d => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 font-bold text-sm">${d.customer}</td>
            <td class="px-6 py-4"><div class="flex flex-wrap gap-1">${d.items.map(i => `<span class="item-tag">${i.qty} ${i.name}</span>`).join('')}</div></td>
            <td class="px-6 py-4 font-bold text-rose-400 text-sm">₱${d.balance.toLocaleString()}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="openPaymentModal(${d.id})" class="bg-emerald-600 px-3 py-1 rounded text-[10px] font-bold">PAY</button>
            </td>`;
        body.appendChild(row);
    });
}

function openPaymentModal(id) {
    const d = debts.find(i => i.id === id);
    document.getElementById('payment-debt-id').value = id;
    document.getElementById('payment-modal-subtitle').innerText = `${d.customer}'s balance: ₱${d.balance.toLocaleString()}`;
    document.getElementById('payment-amt').value = d.balance;
    openModal('payment-modal');
}

function processDebtPayment() {
    const id = Number(document.getElementById('payment-debt-id').value);
    const amt = parseFloat(document.getElementById('payment-amt').value);
    const d = debts.find(i => i.id === id);
    if (!d || isNaN(amt)) return;
    d.balance -= amt;
    if (d.balance <= 0) { d.balance = 0; d.status = 'Paid'; }
    sales.unshift({
        id: Date.now(), timestamp: new Date().toISOString(),
        items: [{ name: `Payment for debt`, qty: 1, subtotal: amt }],
        total: amt, customer: d.customer, type: 'Debt Payment'
    });
    saveAllData(); closeModal('payment-modal'); renderDebts(); showToast("Payment Recorded");
}

function renderSales() {
    const body = document.getElementById('sales-table-body');
    body.innerHTML = '';
    let revenue = 0;
    sales.forEach(s => {
        revenue += s.total;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 text-[10px] text-slate-400">${new Date(s.timestamp).toLocaleDateString()}</td>
            <td class="px-6 py-4">
                <p class="text-xs font-bold text-slate-200">${s.customer}</p>
                <div class="flex flex-wrap gap-1 mt-1">${s.items.map(i => `<span class="item-tag ${s.type === 'Debt Payment' ? 'tag-debt-pay' : ''}">${i.qty}x ${i.name}</span>`).join('')}</div>
            </td>
            <td class="px-6 py-4 font-bold text-emerald-400 text-sm">₱${s.total.toLocaleString()}</td>`;
        body.appendChild(row);
    });
    document.getElementById('total-revenue').innerText = `₱${revenue.toLocaleString()}`;
}

function renderInventory() {
    const body = document.getElementById('inventory-table-body');
    body.innerHTML = '';
    products.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 font-medium text-sm">${p.name}</td>
            <td class="px-6 py-4 text-[10px] text-slate-400">${p.category} / ${p.serving}</td>
            <td class="px-6 py-4 font-bold text-sm">₱${p.price}</td>
            <td class="px-6 py-4"><span class="px-2 py-0.5 rounded bg-slate-800 text-xs">${p.stock}</span></td>
            <td class="px-6 py-4 text-right">
                <button onclick="editProduct(${p.id})" class="text-blue-400 text-[10px] mr-3">Edit</button>
                <button onclick="deleteProduct(${p.id})" class="text-rose-400 text-[10px]">Delete</button>
            </td>`;
        body.appendChild(row);
    });
}

function saveProduct() {
    const id = document.getElementById('edit-id').value;
    const item = { 
        id: id ? Number(id) : Date.now(), 
        name: document.getElementById('p-name').value, 
        category: document.getElementById('p-cat').value, 
        serving: document.getElementById('p-serving').value, 
        price: parseFloat(document.getElementById('p-price').value), 
        stock: parseInt(document.getElementById('p-stock').value) 
    };
    if (!item.name || isNaN(item.price)) return showToast("Check details", "error");
    if (id) products = products.map(p => p.id === item.id ? item : p); else products.push(item);
    saveAllData(); closeModal('product-modal'); renderInventory(); showToast("Saved");
}

function editProduct(id) {
    const p = products.find(i => i.id === id);
    document.getElementById('edit-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-cat').value = p.category;
    updateServingChoices();
    document.getElementById('p-serving').value = p.serving;
    document.getElementById('p-price').value = p.price;         
    document.getElementById('p-stock').value = p.stock;
    openModal('product-modal');
}

function deleteProduct(id) { 
    if(confirm("Remove item?")) {
        products = products.filter(p => p.id !== id); saveAllData(); renderInventory(); 
    }
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { 
    document.getElementById(id).classList.add('hidden'); 
    if(id === 'product-modal') document.getElementById('edit-id').value = '';
}

window.onload = loadAllData;