require('./setting')
const express = require('express');
const axios = require('axios');
const { v4: uuid } = require('uuid');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const fileUpload = require('express-fileupload');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
}));

// MongoDB Connection
const mongoURI = global.mongodbURI || 'mongodb+srv://website:admin67@cluster0.fbdbmwx.mongodb.net/?appName=Cluster0';

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Session Configuration
app.use(session({
    secret: 'fathirsthore-secret-session',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongoURI }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
    }
}));

// ==================== SCHEMAS ====================

// Product Schema (Script/File)
const productSchema = new mongoose.Schema({
    nama: { type: String, required: true },
    deks: { type: String },
    fulldesk: { type: String },
    imageurl: { type: String },
    linkorder: { type: String },
    type: { type: String, default: 'digital' }, // digital, script, panel
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    filePath: { type: String }, // For script files
    fileName: { type: String },
    tanggal: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
});

const Product = mongoose.model('Product', productSchema);

// Panel Product Schema
const panelProductSchema = new mongoose.Schema({
    nama: { type: String, required: true },
    price: { type: Number, required: true },
    ram: { type: Number, required: true },
    cpu: { type: Number, required: true },
    disk: { type: Number, required: true },
    description: { type: String },
    panelEnabled: { type: Boolean, default: true },
    tanggal: { type: Date, default: Date.now }
});

const PanelProduct = mongoose.model('PanelProduct', panelProductSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
    nominalDeposit: { type: Number, default: 0 },
    saldoDiterima: { type: Number, default: 0 },
    idDeposit: { type: String },
    statusDeposit: { type: String, default: 'menunggu_pembayaran' },
    hargaProduk: { type: Number, default: 0 },
    idOrder: { type: String },
    statusOrder: { type: String, default: 'pending' },
    tujuan: { type: String },
    untung: { type: Number, default: 0 },
    internalTrxId: { type: String, required: true, unique: true },
    productCode: { type: String },
    productType: { type: String, default: 'topup' }, // topup, script, panel
    paymentProvider: { type: String, default: 'atlantik' }, // atlantik, pakasir
    tanggal: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Panel Account Schema
const panelAccountSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    serverId: { type: String },
    panelProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'PanelProduct' },
    ram: { type: Number },
    cpu: { type: Number },
    disk: { type: Number },
    status: { type: String, default: 'active' },
    tanggal: { type: Date, default: Date.now }
});

const PanelAccount = mongoose.model('PanelAccount', panelAccountSchema);

// Settings Schema
const settingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed },
    updatedAt: { type: Date, default: Date.now }
});

const Settings = mongoose.model('Settings', settingsSchema);

// Visit Statistics Schema
const visitStatSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    ip: { type: String },
    userAgent: { type: String },
    path: { type: String }
});

const VisitStat = mongoose.model('VisitStat', visitStatSchema);

// Withdrawal Schema
const withdrawalSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true },
    status: { type: String, default: 'pending' }, // pending, success, failed
    tanggal: { type: Date, default: Date.now }
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

// ==================== MIDDLEWARE ====================

function isLoggedIn(req, res, next) {
    if (req.session && req.session.admin) {
        return next();
    } else {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
}

// Track visits middleware
async function trackVisit(req, res, next) {
    try {
        // Skip tracking for static files and API calls
        if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.includes('.')) {
            return next();
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Check if already visited today from this IP
        const existingVisit = await VisitStat.findOne({
            ip: req.ip,
            date: { $gte: today }
        });
        
        if (!existingVisit) {
            await VisitStat.create({
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                path: req.path
            });
        }
    } catch (error) {
        console.error('Track visit error:', error);
    }
    next();
}

app.use(trackVisit);

// ==================== ROUTES - PAGES ====================

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/mutasi', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mutasi.html'));
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'produk.html'));
});

app.get('/payment', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'payment.html'));
});

app.get('/panduan', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'panduan.html'));
});

app.get('/status', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'status.html'));
});

app.get('/panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'panel.html'));
});

app.get('/withdrawal', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'withdrawal.html'));
});

app.get('/receipt', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'receipt.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== AUTH ROUTES ====================

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === global.adminUsername && password === global.adminPassword) {
        req.session.admin = { username };
        return res.json({ success: true, message: 'Login berhasil' });
    }
    res.status(401).json({ success: false, message: 'Username/password salah' });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true, message: 'Logout berhasil' });
    });
});

// ==================== SETTINGS ROUTES ====================

// Get settings
app.get('/api/settings', isLoggedIn, async (req, res) => {
    try {
        const settings = await Settings.find({});
        const settingsObj = {};
        settings.forEach(s => {
            settingsObj[s.key] = s.value;
        });
        res.json({ success: true, data: settingsObj });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update settings
app.post('/api/settings', isLoggedIn, async (req, res) => {
    try {
        const { key, value } = req.body;
        await Settings.findOneAndUpdate(
            { key },
            { key, value, updatedAt: new Date() },
            { upsert: true }
        );
        res.json({ success: true, message: 'Settings updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get payment settings
app.get('/api/settings/payment', async (req, res) => {
    try {
        const atlantikKey = await Settings.findOne({ key: 'atlantikApiKey' });
        const pakasirKey = await Settings.findOne({ key: 'pakasirApiKey' });
        const defaultProvider = await Settings.findOne({ key: 'defaultPaymentProvider' });
        
        res.json({
            success: true,
            data: {
                atlantikEnabled: !!(atlantikKey && atlantikKey.value),
                pakasirEnabled: !!(pakasirKey && pakasirKey.value),
                defaultProvider: defaultProvider?.value || 'atlantik'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== STATISTICS ROUTES ====================

// Get website statistics
app.get('/api/statistics', isLoggedIn, async (req, res) => {
    try {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        
        // Get first visit to determine website age
        const firstVisit = await VisitStat.findOne().sort({ date: 1 });
        const websiteAge = firstVisit ? new Date() - firstVisit.date : 0;
        
        // Weekly stats
        const weeklyVisits = websiteAge >= 7 * 24 * 60 * 60 * 1000 
            ? await VisitStat.countDocuments({ date: { $gte: oneWeekAgo } })
            : null;
        
        // Monthly stats
        const monthlyVisits = websiteAge >= 30 * 24 * 60 * 60 * 1000
            ? await VisitStat.countDocuments({ date: { $gte: oneMonthAgo } })
            : null;
        
        // Yearly stats
        const yearlyVisits = websiteAge >= 365 * 24 * 60 * 60 * 1000
            ? await VisitStat.countDocuments({ date: { $gte: oneYearAgo } })
            : null;
        
        // Total stats
        const totalVisits = await VisitStat.countDocuments();
        
        // Revenue stats
        const weeklyRevenue = websiteAge >= 7 * 24 * 60 * 60 * 1000
            ? await Transaction.aggregate([
                { $match: { tanggal: { $gte: oneWeekAgo }, statusOrder: 'success' } },
                { $group: { _id: null, total: { $sum: '$hargaProduk' } } }
            ])
            : null;
        
        const monthlyRevenue = websiteAge >= 30 * 24 * 60 * 60 * 1000
            ? await Transaction.aggregate([
                { $match: { tanggal: { $gte: oneMonthAgo }, statusOrder: 'success' } },
                { $group: { _id: null, total: { $sum: '$hargaProduk' } } }
            ])
            : null;
        
        const yearlyRevenue = websiteAge >= 365 * 24 * 60 * 60 * 1000
            ? await Transaction.aggregate([
                { $match: { tanggal: { $gte: oneYearAgo }, statusOrder: 'success' } },
                { $group: { _id: null, total: { $sum: '$hargaProduk' } } }
            ])
            : null;
        
        // Profit stats
        const weeklyProfit = websiteAge >= 7 * 24 * 60 * 60 * 1000
            ? await Transaction.aggregate([
                { $match: { tanggal: { $gte: oneWeekAgo }, statusOrder: 'success' } },
                { $group: { _id: null, total: { $sum: '$untung' } } }
            ])
            : null;
        
        const monthlyProfit = websiteAge >= 30 * 24 * 60 * 60 * 1000
            ? await Transaction.aggregate([
                { $match: { tanggal: { $gte: oneMonthAgo }, statusOrder: 'success' } },
                { $group: { _id: null, total: { $sum: '$untung' } } }
            ])
            : null;
        
        const yearlyProfit = websiteAge >= 365 * 24 * 60 * 60 * 1000
            ? await Transaction.aggregate([
                { $match: { tanggal: { $gte: oneYearAgo }, statusOrder: 'success' } },
                { $group: { _id: null, total: { $sum: '$untung' } } }
            ])
            : null;
        
        res.json({
            success: true,
            data: {
                websiteAge: websiteAge,
                visits: {
                    weekly: weeklyVisits,
                    monthly: monthlyVisits,
                    yearly: yearlyVisits,
                    total: totalVisits
                },
                revenue: {
                    weekly: weeklyRevenue?.[0]?.total || 0,
                    monthly: monthlyRevenue?.[0]?.total || 0,
                    yearly: yearlyRevenue?.[0]?.total || 0
                },
                profit: {
                    weekly: weeklyProfit?.[0]?.total || 0,
                    monthly: monthlyProfit?.[0]?.total || 0,
                    yearly: yearlyProfit?.[0]?.total || 0
                }
            }
        });
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== PRODUCT ROUTES ====================

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({ isActive: true }).sort({ tanggal: -1 });
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add product (digital)
app.post('/api/products', isLoggedIn, async (req, res) => {
    try {
        const product = new Product(req.body);
        const saved = await product.save();
        res.status(201).json({ success: true, data: saved });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Upload script/file product
app.post('/api/products/script', isLoggedIn, async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        const file = req.files.file;
        const fileName = `${Date.now()}_${file.name}`;
        const uploadPath = path.join(__dirname, 'public', 'uploads', 'scripts', fileName);
        
        await file.mv(uploadPath);
        
        const product = new Product({
            nama: req.body.nama,
            price: parseInt(req.body.price),
            stock: parseInt(req.body.stock) || 1,
            discount: parseInt(req.body.discount) || 0,
            deks: req.body.description,
            type: 'script',
            filePath: `/uploads/scripts/${fileName}`,
            fileName: file.name
        });
        
        const saved = await product.save();
        res.json({ success: true, data: saved });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete product
app.delete('/api/products/:id', isLoggedIn, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
        }
        
        // Delete file if exists
        if (product.filePath) {
            const filePath = path.join(__dirname, 'public', product.filePath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Produk berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== PANEL PRODUCT ROUTES ====================

// Get all panel products
app.get('/api/panel-products', async (req, res) => {
    try {
        const products = await PanelProduct.find({ panelEnabled: true }).sort({ tanggal: -1 });
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all panel products (admin)
app.get('/api/panel-products/all', isLoggedIn, async (req, res) => {
    try {
        const products = await PanelProduct.find().sort({ tanggal: -1 });
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add panel product
app.post('/api/panel-products', isLoggedIn, async (req, res) => {
    try {
        const product = new PanelProduct(req.body);
        const saved = await product.save();
        res.json({ success: true, data: saved });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update panel product
app.put('/api/panel-products/:id', isLoggedIn, async (req, res) => {
    try {
        const updated = await PanelProduct.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete panel product
app.delete('/api/panel-products/:id', isLoggedIn, async (req, res) => {
    try {
        await PanelProduct.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Produk panel berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== PANEL CREATION ROUTES ====================

// Create panel account
app.post('/api/panel/create', async (req, res) => {
    try {
        const { username, panelProductId } = req.body;
        
        const panelProduct = await PanelProduct.findById(panelProductId);
        if (!panelProduct) {
            return res.status(404).json({ success: false, message: 'Produk panel tidak ditemukan' });
        }
        
        // Get panel settings
        const plta = global.plta || (await Settings.findOne({ key: 'plta' }))?.value;
        const domain = global.domain || (await Settings.findOne({ key: 'panelDomain' }))?.value;
        const loc = global.loc || (await Settings.findOne({ key: 'panelLoc' }))?.value || '1';
        const egg = global.eggs || (await Settings.findOne({ key: 'panelEgg' }))?.value || '1';
        
        if (!plta || !domain) {
            return res.status(500).json({ success: false, message: 'Panel settings not configured' });
        }
        
        const name = `${username}${panelProduct.ram}gb`;
        const email = `${username}@buyer.fathirsthore`;
        const password = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10).toUpperCase();
        
        const memo = String(panelProduct.ram * 1024);
        const cpu = String(panelProduct.ram * 30);
        const disk = String(panelProduct.ram * 1024);
        
        const spc = 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/${CMD_RUN}';
        
        // Create user
        const userResponse = await fetch(`${domain}/api/application/users`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${plta}`
            },
            body: JSON.stringify({
                email: email,
                username: username,
                first_name: username,
                last_name: username,
                language: 'en',
                password: password
            })
        });
        
        const userData = await userResponse.json();
        
        if (userData.errors) {
            if (userData.errors[0].meta?.rule === 'unique') {
                return res.status(400).json({ success: false, message: 'Username sudah ada di panel' });
            }
            return res.status(500).json({ success: false, message: userData.errors[0].detail || 'Gagal membuat user' });
        }
        
        const user = userData.attributes;
        
        // Create server
        const serverResponse = await fetch(`${domain}/api/application/servers`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${plta}`
            },
            body: JSON.stringify({
                name: name,
                description: `Panel ${panelProduct.ram}GB - Fathir Sthore`,
                user: user.id,
                egg: parseInt(egg),
                docker_image: 'ghcr.io/parkervcp/yolks:nodejs_20',
                startup: spc,
                environment: {
                    INST: 'npm',
                    USER_UPLOAD: '0',
                    AUTO_UPDATE: '0',
                    CMD_RUN: 'npm start'
                },
                limits: {
                    memory: parseInt(memo),
                    swap: 0,
                    disk: parseInt(disk),
                    io: 500,
                    cpu: parseInt(cpu)
                },
                feature_limits: {
                    databases: 5,
                    backups: 5,
                    allocations: 1
                },
                deploy: {
                    locations: [parseInt(loc)],
                    dedicated_ip: false,
                    port_range: []
                }
            })
        });
        
        const serverData = await serverResponse.json();
        
        if (serverData.errors) {
            return res.status(500).json({ success: false, message: 'Gagal membuat server' });
        }
        
        const server = serverData.attributes;
        
        // Save panel account
        const panelAccount = new PanelAccount({
            username: username,
            email: email,
            password: password,
            serverId: server.id,
            panelProductId: panelProductId,
            ram: panelProduct.ram,
            cpu: panelProduct.cpu,
            disk: panelProduct.disk
        });
        
        await panelAccount.save();
        
        res.json({
            success: true,
            data: {
                domain: domain,
                username: user.username,
                email: email,
                password: password,
                serverId: server.id,
                memory: server.limits.memory,
                disk: server.limits.disk,
                cpu: server.limits.cpu
            }
        });
        
    } catch (error) {
        console.error('Panel creation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== PAYMENT API ROUTES ====================

// Get payment providers config
function getPaymentConfig() {
    return {
        atlantik: {
            baseURL: global.atlantikBaseURL || 'https://atlantik.top/api',
            apiKey: global.atlantikApiKey
        },
        pakasir: {
            baseURL: global.pakasirBaseURL || 'https://pakasir.com/api',
            apiKey: global.pakasirApiKey
        }
    };
}

// Create payment
app.post('/api/create-payment', async (req, res) => {
    try {
        const { amount, provider } = req.body;
        const internalTrxId = uuid();
        
        const config = getPaymentConfig();
        const selectedProvider = provider || 'atlantik';
        
        let paymentResponse;
        
        if (selectedProvider === 'atlantik' && config.atlantik.apiKey) {
            // Atlantik API
            paymentResponse = await axios.post(
                `${config.atlantik.baseURL}/deposit/create`,
                { nominal: amount },
                { headers: { 'Authorization': `Bearer ${config.atlantik.apiKey}` } }
            );
        } else if (selectedProvider === 'pakasir' && config.pakasir.apiKey) {
            // Pakasir API
            paymentResponse = await axios.post(
                `${config.pakasir.baseURL}/deposit/create`,
                { nominal: amount },
                { headers: { 'Authorization': `Bearer ${config.pakasir.apiKey}` } }
            );
        } else {
            return res.status(400).json({ success: false, message: 'Payment provider not available' });
        }
        
        if (paymentResponse.data && paymentResponse.data.success) {
            const depositData = paymentResponse.data.data;
            
            const transaction = new Transaction({
                internalTrxId: internalTrxId,
                idDeposit: depositData.id,
                nominalDeposit: amount,
                paymentProvider: selectedProvider,
                statusDeposit: 'pending'
            });
            
            await transaction.save();
            
            res.json({
                success: true,
                internalTrxId: internalTrxId,
                paymentDetails: depositData
            });
        } else {
            res.status(500).json({ success: false, message: paymentResponse.data.message || 'Gagal membuat pembayaran' });
        }
        
    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Check payment status
app.get('/api/check-payment', async (req, res) => {
    try {
        const { trxId } = req.query;
        
        const transaction = await Transaction.findOne({ internalTrxId: trxId });
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
        }
        
        const config = getPaymentConfig();
        const provider = transaction.paymentProvider;
        
        let statusResponse;
        
        if (provider === 'atlantik' && config.atlantik.apiKey) {
            statusResponse = await axios.get(
                `${config.atlantik.baseURL}/deposit/status?id=${transaction.idDeposit}`,
                { headers: { 'Authorization': `Bearer ${config.atlantik.apiKey}` } }
            );
        } else if (provider === 'pakasir' && config.pakasir.apiKey) {
            statusResponse = await axios.get(
                `${config.pakasir.baseURL}/deposit/status?id=${transaction.idDeposit}`,
                { headers: { 'Authorization': `Bearer ${config.pakasir.apiKey}` } }
            );
        } else {
            return res.status(400).json({ success: false, message: 'Payment provider not available' });
        }
        
        const status = statusResponse.data?.data?.status || 'pending';
        transaction.statusDeposit = status;
        
        if (status === 'success') {
            transaction.saldoDiterima = statusResponse.data.data.nominal || transaction.nominalDeposit;
        }
        
        await transaction.save();
        
        res.json({
            success: true,
            status: status,
            transaction: transaction
        });
        
    } catch (error) {
        console.error('Check payment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== MUTASI ROUTES ====================

app.get('/api/mutasi', isLoggedIn, async (req, res) => {
    try {
        const history = await Transaction.find({}).sort({ tanggal: -1 });
        res.json({ success: true, data: history });
    } catch (error) {
        console.error('[ERROR] Gagal mengambil data mutasi:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengambil riwayat transaksi.' });
    }
});

// ==================== WITHDRAWAL ROUTES ====================

// Create withdrawal
app.post('/api/withdrawal', isLoggedIn, async (req, res) => {
    try {
        const { amount, bankName, accountNumber, accountName } = req.body;
        
        const withdrawal = new Withdrawal({
            amount: parseInt(amount),
            bankName,
            accountNumber,
            accountName,
            status: 'pending'
        });
        
        await withdrawal.save();
        res.json({ success: true, data: withdrawal });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all withdrawals
app.get('/api/withdrawal', isLoggedIn, async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find().sort({ tanggal: -1 });
        res.json({ success: true, data: withdrawals });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update withdrawal status
app.put('/api/withdrawal/:id', isLoggedIn, async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await Withdrawal.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== RECEIPT ROUTES ====================

// Get receipt data
app.get('/api/receipt/:trxId', async (req, res) => {
    try {
        const transaction = await Transaction.findOne({ internalTrxId: req.params.trxId });
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
        }
        
        res.json({ success: true, data: transaction });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`🚀 Server Fathir Sthore berjalan di http://localhost:${PORT}`);
    console.log(`📧 Contact: fathirsthore@yahoo.com`);
    console.log(`📱 WhatsApp: +62882003493812`);
});
