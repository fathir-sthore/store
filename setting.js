// ============================================
// FATHIR STHORE DIGITAL OFFICE - SETTINGS
// ============================================

// Admin Credentials
global.adminUsername = 'fathirsthore'
global.adminPassword = 'DX#55asDf'

// MongoDB URI
global.mongodbURI = 'mongodb+srv://website:038jYER6jKUDqxqC@cluster0.2c2cpjd.mongodb.net/?appName=Cluster0

// Payment API Configuration
// QRIS A - Atlantik
global.atlantikApiKey = '56j5JPPoiibcmyEQ5FOPsrPj8UnsXxId' // Isi di admin panel
global.atlantikBaseURL = 'https://atlantik.top/api'

// QRIS B - Pakasir
global.pakasirApiKey = 'RjKJLZZ85o3xlTSlNOiR85mI6b2UZgHF0gUI9pKsegqMDPTI5SYyLebs7Lsy1GpW5LHtG47IFC6eDrK1dDNWNmE3Q3WdStDGjzEC' // Isi di admin panel
global.pakasirBaseURL = 'https://pakasir.com/api'

// Default Payment Provider (atlantik / pakasir)
global.defaultPaymentProvider = 'atlantik'

// Panel Pterodactyl Configuration
global.plta = '' // API Key Panel - Isi di admin panel
global.pltc = '' // Client API Key - Isi di admin panel
global.domain = '' // Domain Panel - Isi di admin panel
global.loc = '1' // Location ID
global.eggs = '1' // Egg ID

// Fee Configuration
global.feenya = 500 // Fee transaksi

// Contact Information
global.storeName = 'Fathir Sthore Digital Office'
global.storeEmail = 'fathirsthore@yahoo.com'
global.storeWhatsApp = '+62882003493812'
global.storeTelegram = 't.me/fathirsthore'

console.log('✅ Settings loaded for Fathir Sthore Digital Office')
