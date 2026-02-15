# Fathir Sthore Digital Office

E-commerce platform dengan integrasi Panel Pterodactyl dan Payment Gateway (Atlantik & Pakasir).

## Fitur Utama

### 1. Tampilan Profesional (WoodMart Theme)
- Typography bold dengan font Montserrat, Poppins, dan Inter
- High-quality mockups untuk produk digital
- White space yang optimal
- Micro-animations pada hover dan transisi
- Dark/Light mode toggle

### 2. Sistem Payment Gateway
- **QRIS A (Atlantik)** - Konfigurasi melalui admin panel
- **QRIS B (Pakasir)** - Konfigurasi melalui admin panel
- User dapat memilih provider saat pembayaran

### 3. Statistik Website
- Kunjungan per minggu, bulan, tahun (hanya tampil jika data tersedia)
- Pemasukan dan pengeluaran
- Grafik transaksi real-time

### 4. Manajemen Produk
- **Produk Digital** - Nama, harga, stok, diskon, deskripsi
- **Script/File** - Upload file ZIP/RAR dengan form lengkap
- **Produk Panel** - Konfigurasi RAM, CPU, Disk, harga, toggle on/off

### 5. Panel Pterodactyl Integration
- Create server otomatis
- Data panel bisa disalin atau didownload
- Support multiple paket (1GB - 8GB RAM)

### 6. Struk Pembayaran
- Tampilan struk profesional
- Bisa dicetak atau didownload
- Status transaksi real-time

### 7. Penarikan Saldo (WD)
- Support Bank (BCA, BRI, Mandiri, BNI)
- Support E-Wallet (DANA, OVO, GoPay, ShopeePay)
- Approval system oleh admin

## Struktur Project

```
├── index.js              # Main server file
├── setting.js            # Configuration file
├── package.json          # Dependencies
├── vercel.json           # Vercel deployment config
├── public/               # Static files
│   ├── index.html        # Homepage
│   ├── login.html        # Admin login
│   ├── admin.html        # Admin dashboard
│   ├── produk.html       # Products page
│   ├── panel.html        # Panel server page
│   ├── payment.html      # Payment page
│   ├── status.html       # Order status page
│   ├── receipt.html      # Payment receipt
│   ├── panduan.html      # User guide
│   ├── mutasi.html       # Transaction history
│   ├── withdrawal.html   # Withdrawal page
│   └── uploads/          # Uploaded files
│       └── scripts/      # Script files
```

## Konfigurasi

### 1. Settings (`setting.js`)
```javascript
global.adminUsername = 'fathirsthore'      // Username admin
global.adminPassword = 'fathirsthore123'   // Password admin
global.mongodbURI = '...'                   // MongoDB connection string
global.atlantikApiKey = ''                  // API Key Atlantik
global.pakasirApiKey = ''                   // API Key Pakasir
global.plta = ''                            // Pterodactyl API Key
global.domain = ''                          // Panel domain
global.feenya = 500                         // Transaction fee
```

### 2. Environment Variables (Vercel)
- Set MongoDB URI dan API keys melalui environment variables untuk keamanan

## API Endpoints

### Authentication
- `POST /login` - Admin login
- `GET /logout` - Admin logout

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Add digital product
- `POST /api/products/script` - Upload script file
- `DELETE /api/products/:id` - Delete product

### Panel Products
- `GET /api/panel-products` - Get active panel products
- `GET /api/panel-products/all` - Get all panel products (admin)
- `POST /api/panel-products` - Add panel product
- `PUT /api/panel-products/:id` - Update panel product
- `DELETE /api/panel-products/:id` - Delete panel product

### Panel Creation
- `POST /api/panel/create` - Create panel account

### Payment
- `POST /api/create-payment` - Create payment
- `GET /api/check-payment` - Check payment status

### Transactions
- `GET /api/mutasi` - Get all transactions
- `GET /api/receipt/:trxId` - Get receipt data

### Withdrawal
- `POST /api/withdrawal` - Create withdrawal request
- `GET /api/withdrawal` - Get all withdrawals
- `PUT /api/withdrawal/:id` - Update withdrawal status

### Statistics
- `GET /api/statistics` - Get website statistics

### Settings
- `GET /api/settings` - Get all settings
- `POST /api/settings` - Update setting
- `GET /api/settings/payment` - Get payment settings

## Contact

- **Nama**: Fathir Sthore Digital Office
- **Email**: fathirsthore@yahoo.com
- **WhatsApp**: +62882003493812
- **Telegram**: t.me/fathirsthore

## Deployment

### Vercel
1. Push code ke GitHub
2. Connect repository ke Vercel
3. Set environment variables
4. Deploy

### Local Development
```bash
npm install
npm run dev
```

## License

MIT License
