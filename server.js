const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ========== ФАЙЛ С ЦЕНАМИ (можно редактировать вручную) ==========
const PRICES_FILE = path.join(__dirname, 'prices.json');

// Загрузка цен из файла (или создание демо-версии)
function loadPrices() {
    try {
        if (fs.existsSync(PRICES_FILE)) {
            const data = fs.readFileSync(PRICES_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Ошибка загрузки prices.json:', error);
    }
    
    // Если файла нет - создаём демо-версию
    return createDemoPrices();
}

// Создание демо-цен (актуально на февраль 2026)
function createDemoPrices() {
    return {
        cpu: {
            'i3-13100': 14500,
            'i5-13400': 24800,
            'i5-13600k': 34500,
            'i7-13700k': 44900,
            'ryzen5-7600': 21800,
            'ryzen7-7800x3d': 41500
        },
        gpu: {
            'rtx3060': 34800,
            'rtx4060': 39500,
            'rtx4070': 64800,
            'rx7600': 31800,
            'rx7800xt': 54500
        },
        mb: {
            'b660': 11800,
            'b760': 14800,
            'b650': 12900,
            'x670': 17800
        },
        case: {
            'budget': 4800,
            'mid': 7800,
            'premium': 14800
        },
        laptopCpu: {
            'i5-1335u': 19800,
            'i7-1360p': 34500,
            'ryzen5-7530u': 21800,
            'ryzen7-7730u': 31800
        },
        laptopGpu: {
            'integrated': 0,
            'mx550': 7800,
            'rtx3050': 19800,
            'rtx4060': 34800
        },
        laptopBrand: {
            'asus': 4800,
            'lenovo': 3800,
            'hp': 4300,
            'dell': 5800,
            'acer': 3300,
            'msi': 6800
        },
        ram: { perGB: 480 },
        storage: { perGB: 2.8 },
        psu: { per100W: 1450 },
        laptopRam: { perGB: 580 },
        laptopStorage: { perGB: 3.8 },
        laptopDisplay: { 
            '14': 14800, 
            '15.6': 17800, 
            '16': 21800, 
            '17.3': 24800 
        },
        metadata: {
            lastUpdated: new Date().toISOString(),
            source: 'demo-prices (февраль 2026)',
            version: '1.0'
        }
    };
}

// Сохранение цен в файл
function savePrices(prices) {
    try {
        fs.writeFileSync(PRICES_FILE, JSON.stringify(prices, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Ошибка сохранения prices.json:', error);
        return false;
    }
}

let currentPrices = loadPrices();

// ========== API ЭНДПОИНТЫ ==========
app.get('/api/all-prices', (req, res) => {
    res.json({
        prices: currentPrices,
        timestamp: new Date().toISOString(),
        status: 'success',
        source: currentPrices.metadata?.source || 'demo-prices'
    });
});

// Эндпоинт для обновления цен (админ-панель)
app.post('/api/update-prices', (req, res) => {
    try {
        const { category, productId, price } = req.body;
        
        if (!category || !productId || price === undefined) {
            return res.status(400).json({ 
                error: 'Требуются параметры: category, productId, price' 
            });
        }
        
        if (!currentPrices[category]) {
            currentPrices[category] = {};
        }
        
        currentPrices[category][productId] = price;
        currentPrices.metadata = {
            ...currentPrices.metadata,
            lastUpdated: new Date().toISOString(),
            source: 'ручное обновление'
        };
        
        // Сохраняем в файл
        if (savePrices(currentPrices)) {
            res.json({ 
                success: true, 
                message: `Цена ${category}/${productId} обновлена на ₽${price}`,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({ error: 'Ошибка сохранения файла' });
        }
        
    } catch (error) {
        console.error('Ошибка обновления цены:', error);
        res.status(500).json({ error: error.message });
    }
});

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Админ-панель для обновления цен
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Обработка 404
app.get('*', (req, res) => {
    res.status(404).send('Страница не найдена');
});

// Запуск сервера
app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log(`║  🚀 СЕРВЕР ЗАПУЩЕН:  http://localhost:${PORT}              ║`);
    console.log(`║  📡 API цены:        http://localhost:${PORT}/api/all-prices║`);
    console.log(`║  👨‍💼 Админ-панель:    http://localhost:${PORT}/admin          ║`);
    console.log(`║  📁 Файл цен:        ${PRICES_FILE}                        ║`);
    console.log('║                                                            ║');
    console.log('║  💡 Цены загружаются из файла prices.json                 ║');
    console.log('║  ✏️  Обновляйте цены через админ-панель или вручную       ║');
    console.log('║  📊 Данные автоматически сохраняются в файл               ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 Текущие цены:');
    console.log(`   Последнее обновление: ${currentPrices.metadata?.lastUpdated || 'неизвестно'}`);
    console.log(`   Источник: ${currentPrices.metadata?.source || 'demo'}`);
});