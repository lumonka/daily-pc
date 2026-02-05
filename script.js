// URL сервера
const API_URL = 'https://daily-pc.onrender.com/api';

// Установка текущей даты
const now = new Date();
const options = { year: 'numeric', month: 'long', day: 'numeric' };
document.getElementById('currentDate').textContent = now.toLocaleDateString('ru-RU', options);

// Глобальная переменная для хранения актуальных цен
let currentPrices = {
    cpu: {},
    gpu: {},
    ram: { perGB: 500 },
    storage: { perGB: 3 },
    mb: {},
    psu: { per100W: 1500 },
    case: {},
    laptopCpu: {},
    laptopRam: { perGB: 600 },
    laptopStorage: { perGB: 4 },
    laptopDisplay: { '14': 15000, '15.6': 18000, '16': 22000, '17.3': 25000 },
    laptopGpu: {},
    laptopBrand: {}
};

// Функция получения всех цен с сервера
async function fetchAllPrices() {
    try {
        const response = await fetch(`${API_URL}/all-prices`);
        const data = await response.json();
        
        if (data.status === 'success') {
            currentPrices = {
                ...currentPrices,
                ...data.prices
            };
            
            // Обновляем отображение цен
            updateAllPricesDisplay();
            
            // 🔥 НОВОЕ: Заполняем селекты новыми компонентами
            populateSelects();
            
            console.log('✅ Цены успешно загружены с сервера');
            showNotification('Цены обновлены успешно!', 'success');
        }
    } catch (error) {
        console.error('❌ Ошибка при загрузке цен:', error);
        showNotification('Не удалось загрузить актуальные цены. Используются базовые значения.', 'error');
    }
}

function getComponentPrice(category, id) {
    if (!id) return 0;
    
    const item = currentPrices[category]?.[id];
    if (!item) return 0;
    
    // Для laptopDisplay, ram, storage, psu, laptopRam, laptopStorage - это простые числа
    const simpleCategories = ['laptopDisplay', 'ram', 'storage', 'psu', 'laptopRam', 'laptopStorage'];
    
    if (simpleCategories.includes(category)) {
        return typeof item === 'object' ? item.price : item;
    }
    
    // Для остальных категорий (cpu, gpu, mb, case, laptopCpu, laptopGpu, laptopBrand)
    if (typeof item === 'object' && item !== null) {
        return item.price || 0;
    }
    
    // Старый формат (просто число)
    return item || 0;
}

function populateSelects() {
    const categoryMap = {
        'cpu': 'cpu',
        'gpu': 'gpu', 
        'mb': 'mb',
        'case': 'case',
        'laptopCpu': 'laptopCpu',
        'laptopGpu': 'laptopGpu',
        'laptopBrand': 'laptopBrand'
    };

    Object.entries(categoryMap).forEach(([selectId, category]) => {
        const select = document.getElementById(selectId);
        if (!select) return;

        // Очищаем селект
        select.innerHTML = '<option value="">Выберите...</option>';

        // Заполняем опциями из currentPrices
        const items = currentPrices[category] || {};
        Object.entries(items).forEach(([id, item]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = getComponentDisplayName(id, category);
            select.appendChild(option);
        });
    });
}

function getComponentDisplayName(id, category) {
    // Попробуем красиво отформатировать ID
    let name = id
        .replace(/-/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2') // rtx3060 → rtx 3060
        .replace(/\b\w/g, l => l.toUpperCase()); // Первая буква каждого слова — заглавная
    
    // Добавим префиксы по категориям
    const prefixes = {
        cpu: '',
        gpu: 'Видеокарта ',
        mb: 'Материнская плата ',
        case: 'Корпус ',
        laptopCpu: 'Процессор ноутбука ',
        laptopGpu: 'Видеокарта ноутбука ',
        laptopBrand: 'Бренд '
    };
    
    return (prefixes[category] || '') + name;
}

// Функция обновления отображения всех цен
function updateAllPricesDisplay() {
    // Обновляем цены для ПК
    document.querySelectorAll('#pcCalculator select').forEach(select => {
        const id = select.id;
        const value = select.value;
        
        if (value && currentPrices[id]) {
            const price = getComponentPrice(id, value); // Используем правильную функцию
            updatePrice(`${id}Price`, price);
        }
    });
    
    // Обновляем цены для ноутбуков
    document.querySelectorAll('#laptopCalculator select').forEach(select => {
        const id = select.id;
        const value = select.value;
        
        if (value && currentPrices[id]) {
            const price = getComponentPrice(id, value); // Используем правильную функцию
            updatePrice(`${id}Price`, price);
        }
    });
    
    // Обновляем цены для полей с расчетом
    updateRamPrice();
    updateStoragePrice();
    updatePsuPrice();
    updateLaptopRamPrice();
    updateLaptopStoragePrice();
}

// Функция обновления цены
function updatePrice(elementId, price) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = `₽ ${price.toLocaleString('ru-RU')}`;
    }
}

// Вспомогательные функции для расчета цен
function updateRamPrice() {
    const ramValue = document.getElementById('ram')?.value || 0;
    const price = ramValue * getComponentPrice('ram', 'perGB');
    updatePrice('ramPrice', price);
}

function updateStoragePrice() {
    const storageValue = document.getElementById('storage')?.value || 0;
    const price = storageValue * getComponentPrice('storage', 'perGB');
    updatePrice('storagePrice', price);
}

function updatePsuPrice() {
    const psuValue = document.getElementById('psu')?.value || 0;
    const price = Math.ceil(psuValue / 100) * getComponentPrice('psu', 'per100W');
    updatePrice('psuPrice', price);
}

function updateLaptopRamPrice() {
    const ramValue = document.getElementById('laptopRam')?.value || 0;
    const price = ramValue * getComponentPrice('laptopRam', 'perGB');
    updatePrice('laptopRamPrice', price);
}

function updateLaptopStoragePrice() {
    const storageValue = document.getElementById('laptopStorage')?.value || 0;
    const price = storageValue * getComponentPrice('laptopStorage', 'perGB');
    updatePrice('laptopStoragePrice', price);
}

// Переключение вкладок
const tabBtns = document.querySelectorAll('.tab-btn');
const calculatorContents = document.querySelectorAll('.calculator-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        
        tabBtns.forEach(b => b.classList.remove('active'));
        calculatorContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`${tabName}Calculator`).classList.add('active');
        setTimeout(populateSelects, 100);
    });
});

// Обработчики изменений для ПК
document.getElementById('cpu')?.addEventListener('change', function() {
    const price = this.value ? getComponentPrice('cpu', this.value) : 0;
    updatePrice('cpuPrice', price);
});

document.getElementById('gpu')?.addEventListener('change', function() {
    const price = this.value ? getComponentPrice('gpu', this.value) : 0;
    updatePrice('gpuPrice', price);
});

document.getElementById('ram')?.addEventListener('input', updateRamPrice);

document.getElementById('storage')?.addEventListener('input', updateStoragePrice);

document.getElementById('mb')?.addEventListener('change', function() {
    const price = this.value ? getComponentPrice('mb', this.value) : 0;
    updatePrice('mbPrice', price);
});

document.getElementById('psu')?.addEventListener('input', updatePsuPrice);

document.getElementById('case')?.addEventListener('change', function() {
    const price = this.value ? getComponentPrice('case', this.value) : 0;
    updatePrice('casePrice', price);
});

// Обработчики изменений для ноутбуков
document.getElementById('laptopCpu')?.addEventListener('change', function() {
    const price = this.value ? getComponentPrice('laptopCpu', this.value) : 0;
    updatePrice('laptopCpuPrice', price);
});

document.getElementById('laptopRam')?.addEventListener('input', updateLaptopRamPrice);

document.getElementById('laptopStorage')?.addEventListener('input', updateLaptopStoragePrice);

document.getElementById('laptopDisplay')?.addEventListener('change', function() {
    const price = this.value ? currentPrices.laptopDisplay[this.value] || 0 : 0;
    updatePrice('laptopDisplayPrice', price);
});

document.getElementById('laptopGpu')?.addEventListener('change', function() {
    const price = this.value ? getComponentPrice('laptopGpu', this.value) : 0;
    updatePrice('laptopGpuPrice', price);
});

document.getElementById('laptopBrand')?.addEventListener('change', function() {
    const price = this.value ? getComponentPrice('laptopBrand', this.value) : 0;
    updatePrice('laptopBrandPrice', price);
});

// Расчет стоимости ПК
document.getElementById('pcForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const cpuPrice = getComponentPrice('cpu', document.getElementById('cpu').value);
    const gpuPrice = getComponentPrice('gpu', document.getElementById('gpu').value);
    const ramPrice = document.getElementById('ram').value * getComponentPrice('ram', 'perGB');
    const storagePrice = document.getElementById('storage').value * getComponentPrice('storage', 'perGB');
    const mbPrice = getComponentPrice('mb', document.getElementById('mb').value);
    const psuPrice = Math.ceil(document.getElementById('psu').value / 100) * getComponentPrice('psu', 'per100W');
    const casePrice = getComponentPrice('case', document.getElementById('case').value);
    
    const totalPrice = cpuPrice + gpuPrice + ramPrice + storagePrice + mbPrice + psuPrice + casePrice;
    
    // Отображение результата
    document.getElementById('pcTotal').textContent = `₽ ${totalPrice.toLocaleString('ru-RU')}`;
    
    const breakdown = document.getElementById('pcBreakdown');
    if (breakdown) {
        breakdown.innerHTML = `
            <div><span>Процессор:</span><span>₽ ${cpuPrice.toLocaleString('ru-RU')}</span></div>
            <div><span>Видеокарта:</span><span>₽ ${gpuPrice.toLocaleString('ru-RU')}</span></div>
            <div><span>Оперативная память:</span><span>₽ ${ramPrice.toLocaleString('ru-RU')}</span></div>
            <div><span>Накопитель:</span><span>₽ ${storagePrice.toLocaleString('ru-RU')}</span></div>
            <div><span>Материнская плата:</span><span>₽ ${mbPrice.toLocaleString('ru-RU')}</span></div>
            <div><span>Блок питания:</span><span>₽ ${psuPrice.toLocaleString('ru-RU')}</span></div>
            <div><span>Корпус:</span><span>₽ ${casePrice.toLocaleString('ru-RU')}</span></div>
            <div style="border-top: 2px solid #667eea; padding-top: 10px; margin-top: 10px; font-weight: bold;">
                <span>ИТОГО:</span><span>₽ ${totalPrice.toLocaleString('ru-RU')}</span>
            </div>
        `;
    }
    
    showNotification(`Расчет выполнен! Общая стоимость: ₽${totalPrice.toLocaleString('ru-RU')}`, 'success');
});

// Расчет стоимости ноутбука
document.getElementById('laptopForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const cpuPrice = getComponentPrice('laptopCpu', document.getElementById('laptopCpu').value);
    const ramPrice = document.getElementById('laptopRam').value * getComponentPrice('laptopRam', 'perGB');
    const storagePrice = document.getElementById('laptopStorage').value * getComponentPrice('laptopStorage', 'perGB');
    const displayPrice = getComponentPrice('laptopDisplay', document.getElementById('laptopDisplay').value);
    const gpuPrice = getComponentPrice('laptopGpu', document.getElementById('laptopGpu').value);
    const brandPrice = getComponentPrice('laptopBrand', document.getElementById('laptopBrand').value);
    
    // Базовая стоимость сборки ноутбука
    const baseCost = 15000;
    
    const totalPrice = cpuPrice + ramPrice + storagePrice + displayPrice + gpuPrice + brandPrice + baseCost;
    
    // Отображение результата
    document.getElementById('laptopTotal').textContent = `₽ ${totalPrice.toLocaleString('ru-RU')}`;
    
    const breakdown = document.getElementById('laptopBreakdown');
    if (breakdown) {
        breakdown.innerHTML = `
            <div><span>Базовая сборка:</span><span>₽ ${baseCost.toLocaleString('ru-RU')}</span></div>
            <div><span>Процессор:</span><span>₽ ${cpuPrice.toLocaleString('ru-RU')}</span></div>
            <div><span>Оперативная память:</span><span>₽ ${ramPrice.toLocaleString('ru-RU')}</span></div>
            <div><span>Накопитель:</span><span>₽ ${storagePrice.toLocaleString('ru-RU')}</span></div>
            <div><span>Экран:</span><span>₽ ${displayPrice.toLocaleString('ru-RU')}</span></div>
            <div><span>Видеокарта:</span><span>₽ ${gpuPrice.toLocaleString('ru-RU')}</span></div>
            <div><span>Бренд:</span><span>₽ ${brandPrice.toLocaleString('ru-RU')}</span></div>
            <div style="border-top: 2px solid #667eea; padding-top: 10px; margin-top: 10px; font-weight: bold;">
                <span>ИТОГО:</span><span>₽ ${totalPrice.toLocaleString('ru-RU')}</span>
            </div>
        `;
    }
    
    showNotification(`Расчет выполнен! Ориентировочная стоимость: ₽${totalPrice.toLocaleString('ru-RU')}`, 'success');
});

// Функция показа уведомлений
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Добавляем в начало контейнера
    const container = document.querySelector('.container');
    container.insertBefore(notification, container.firstChild);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.classList.add('notification-hide');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Добавляем кнопку обновления цен
const header = document.querySelector('header');
const updateBtn = document.createElement('button');
updateBtn.className = 'update-prices-btn';
updateBtn.innerHTML = '🔄 Обновить цены';
updateBtn.onclick = async () => {
    showNotification('Загрузка актуальных цен...', 'info');
    await fetchAllPrices();
};
header.appendChild(updateBtn);

// Инициализация при загрузке страницы
window.addEventListener('load', async function() {
    console.log('🚀 Запуск калькулятора...');
    
    // Загружаем актуальные цены
    await fetchAllPrices();
    
    // Устанавливаем начальные цены
    updateRamPrice();
    updateStoragePrice();
    updatePsuPrice();
    updateLaptopRamPrice();
    updateLaptopStoragePrice();
});
