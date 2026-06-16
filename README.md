# 🚀 EVOZXa FUTURE — Professional Token Launchpad

![EVOZXA Banner](https://img.shields.io/badge/Network-EVOZ%20Mainnet-2563eb?style=for-the-badge&logo=ethereum&logoColor=fff)
![Ethers.js](https://img.shields.io/badge/Ethers.js-v6.13.5-ffd700?style=for-the-badge&logo=javascript&logoColor=000)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**EVOZXa FUTURE** adalah platform Desentralisasi (DApp) mutakhir yang dirancang khusus untuk mendeploy, memverifikasi, dan mengelola Smart Contract Token profesional secara instan langsung di atas jaringan **EVOZ Mainnet**. 

Dengan antarmuka pengguna (UI) futuristik bertema cyberpunk gelap, platform ini memungkinkan pengembang maupun proyek kripto baru untuk meluncurkan token standar ERC-20 yang disesuaikan dengan fitur-fitur canggih (Advanced Settings) hanya dalam beberapa klik, tanpa perlu keahlian menulis kode Solidity dari nol.

---

## ✨ Fitur Utama

*   **⚡ One-Click Token Deployment:** Buat dan luncurkan token kustom Anda langsung ke EVOZ Mainnet secara instan.
*   **🛠️ Modular Token Features:** Aktifkan fitur-fitur token standar industri seperti *Burnable*, *Mintable*, dan *Ownership Control*.
*   **📂 Multi-Level Group Accordion UI:** Tata letak konfigurasi input yang intuitif, memisahkan manajemen Metadata Proyek dengan Pengaturan Lanjut (*Advanced Settings*).
*   **🛡️ Advanced Anti-Whale & Tax Security:** 
    *   Pengaturan pembatasan transaksi (*Max TX %*) dan dompet (*Max Wallet %*).
    *   Sistem pemotongan pajak beli & jual otomatis (*Buy/Sell Tax %*).
    *   Alokasi pembagian pajak pembakaran (*Burn Tax Share*) serta dompet khusus *Marketing* & *Development*.
*   **💼 Web3 Wallet Integration:** Sinkronisasi saldo native token `EVOZ` dan token tata kelola `EVOZX` secara *real-time* via Ethers.js v6.

---

## 🛠️ Tech Stack & Arsitektur

DApp ini dirancang menggunakan pendekatan **Vanilla & Modern Hybrid**, memastikan kecepatan pemuatan halaman yang sangat cepat tanpa dependensi berat.

*   **Frontend:** HTML5 Semantik & CSS3 Modern (Menggunakan fitur mutakhir `:has()` untuk kontrol akordion murni tanpa JavaScript berlebih).
*   **Web3 Library:** [Ethers.js v6.13.5 (UMD)](https://cdn.jsdelivr.net/npm/ethers@6.13.5/dist/ethers.umd.min.js) untuk interaksi blockchain yang aman dan stabil.
*   **Font Asset:** *Plus Jakarta Sans* via Google Fonts untuk tipografi premium.

---

## 📂 Struktur Direktori Proyek

```text
evozxa-future-main/
│
├── README.md
│   └── Panduan verifikasi smart contract di EVOZ Explorer
│
├── index.html
│   └── Halaman utama aplikasi EVOZXa FUTURE
│
├── verification-guide.html
│   └── Halaman panduan verifikasi kontrak untuk pengguna
│
├── abi/
│   │
│   ├── evozx.json
│   │   └── ABI token EVOZX
│   │
│   ├── exchange.json
│   │   └── ABI smart contract exchange
│   │
│   ├── factory.json
│   │   └── ABI smart contract factory deployment token
│   │
│   └── token.json
│       └── ABI template token yang dihasilkan
│
├── assets/
│   │
│   ├── EvozXUltimateFactory.sol
│   │   └── Smart contract factory utama
│   │
│   ├── LaunchKitToken.sol
│   │   └── Template smart contract token
│   │
│   ├── LaunchKitTypes.sol
│   │   └── Definisi struct, enum, dan tipe data
│   │
│   └── standard-input.json
│       └── Solidity Standard JSON Input untuk verifikasi kontrak
│
├── css/
│   │
│   └── app.css
│       └── Seluruh styling UI aplikasi
│
├── images/
│   │
│   └── logo.png
│       └── Logo EVOZXa FUTURE
│
└── js/
    │
    ├── app.js
    │   └── Inisialisasi aplikasi dan integrasi modul
    │
    ├── balance.js
    │   └── Mengambil saldo EVOZ & EVOZX wallet
    │
    ├── config.js
    │   └── Konfigurasi jaringan dan alamat kontrak
    │
    ├── deploy.js
    │   └── Logika deploy token baru
    │
    ├── exchange.js
    │   └── Integrasi swap/pembelian token melalui exchange
    │
    ├── main.js
    │   └── Entry point aplikasi frontend
    │
    └── wallet.js
        └── Koneksi wallet (MetaMask/EVM Wallet)

---

License

EVOZXa FUTURE is open-source software released under the MIT License.

Copyright © 2026 EVOZXLabs.
