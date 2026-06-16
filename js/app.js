import {
connectWallet,
getSigner,
getAddress
} from "./wallet.js";

import {
loadBalances
} from "./balance.js";

import {
loadFactory,
loadEvozx,
buildTokenConfig,
validateConfig
} from "./deploy.js";

import {
CONFIG
} from "./config.js";

// =========================================================
// INTERSEPTOR POPUP MODAL MODERN (SUPPORT VERIFICATION LINK)
// =========================================================
const inisialisasiModalAlert = () => {
    window.alert = function(message, tokenDetails = null) {
        const modal = document.getElementById('customModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const confirmBtn = document.getElementById('modalConfirmBtn');
        const modalFooter = modal ? modal.querySelector('.modal-footer') : null;

        if (!modal || !modalMessage) {
            console.warn("Custom modal elements not found, using native alert.");
            console.log(message);
            return;
        }

        const oldDownloadBtn = document.getElementById('modalDownloadBtn');
        if (oldDownloadBtn) oldDownloadBtn.remove();

        const msgStr = String(message).toLowerCase();

        // 1. JIKA DEPLOY SUKSES (Popup Rincian + Tombol Verifikasi Unduhan)
        if (tokenDetails) {
            modalTitle.innerText = "Deployment Success!";
            modalTitle.style.color = "#00ff88"; 

            modalMessage.innerHTML = `
                <div style="text-align: left; background: rgba(255,255,255,0.05); padding: 14px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; border: 1px solid rgba(37, 99, 235, 0.2);">
                    <p style="margin-bottom: 8px;"><strong style="color: var(--gold);">Token Name:</strong> ${tokenDetails.name}</p>
                    <p style="margin-bottom: 8px;"><strong style="color: var(--gold);">Symbol:</strong> ${tokenDetails.symbol}</p>
                    <p style="margin-bottom: 8px;"><strong style="color: var(--gold);">Total Supply:</strong> ${tokenDetails.supply}</p>
                    <p style="word-break: break-all; margin-bottom: 0;"><strong style="color: var(--gold);">Contract Address:</strong> <br><span style="color: #00bef5; font-family: monospace; font-size: 12px;">${tokenDetails.address}</span></p>
                </div>
                <p style="font-size: 13px; color: var(--muted); margin-bottom: 12px; line-height: 1.4;">
                    Use the files below to verify your contract source code on EVOZ Explorer:
                </p>
            `;

            const downloadBtn = document.createElement('a');
            downloadBtn.id = 'modalDownloadBtn';
            downloadBtn.href = 'https://github.com/EVOZXLaunch/evozxa-future/tree/main/assets';
            downloadBtn.target = '_blank';
            downloadBtn.innerText = "DOWNLOAD VERIFICATION FILES";
            
            downloadBtn.style.display = "block";
            downloadBtn.style.width = "100%";
            downloadBtn.style.padding = "12px 24px";
            downloadBtn.style.marginBottom = "12px";
            downloadBtn.style.background = "linear-gradient(135deg, var(--gold), #b8860b)";
            downloadBtn.style.color = "#040814";
            downloadBtn.style.border = "none";
            downloadBtn.style.borderRadius = "10px";
            downloadBtn.style.fontSize = "13px";
            downloadBtn.style.fontWeight = "700";
            downloadBtn.style.letterSpacing = "0.5px";
            downloadBtn.style.textDecoration = "none";
            downloadBtn.style.textAlign = "center";
            downloadBtn.style.boxShadow = "var(--glow-gold)";

            if (modalFooter && confirmBtn) {
                modalFooter.insertBefore(downloadBtn, confirmBtn);
            }

        // 2. JIKA OPERASI ERROR / SISTEM NOTIFIKASI STANDARD
        } else {
            if (msgStr.includes('failed') || msgStr.includes('insufficient') || msgStr.includes('first') || msgStr.includes('required') || msgStr.includes('gagal')) {
                modalTitle.innerText = "Warning";
                modalTitle.style.color = "#ff4a4a"; 
            } else {
                modalTitle.innerText = "Notice";
                modalTitle.style.color = "#ffd700"; 
            }
            modalMessage.innerText = message;
        }

        modal.style.display = 'flex';
        if (confirmBtn) confirmBtn.innerText = "CLOSE";

        confirmBtn.onclick = function() {
            modal.style.display = 'none';
            const btnHapus = document.getElementById('modalDownloadBtn');
            if (btnHapus) btnHapus.remove();
        };
    };
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inisialisasiModalAlert);
} else {
    inisialisasiModalAlert();
}

// =========================================================
// EMBEDDED PRICING SYSTEM (FEE CALCULATOR)
// =========================================================
function calculateFee(features) {
    let fee = 10; // Base fee awal
    
    // Fitur Checkbox Dasar
    if (features.burnable) fee += 2;
    if (features.mintable) fee += 3;
    if (features.ownership) fee += 1;
    
    // Fitur Advanced dari Sub-Accordion
    if (features.maxWallet) fee += 2;
    if (features.maxTx) fee += 2;
    if (features.tradingControl) fee += 4;
    if (features.buyTax) fee += 3;
    if (features.sellTax) fee += 3;

    // Metadata Paket Kombinasi
    if (features.website || features.telegram || features.twitter || features.logo) {
        fee += 1;
    }

    return fee;
}

// =========================================================
// WALLET CONNECTION WRAPPER
// =========================================================
const connectBtn = document.getElementById("connectBtn");

connectBtn.addEventListener("click", async () => {
    try {
        const wallet = await connectWallet();
        if (!wallet) return;

        const shortAddress = wallet.address.slice(0, 6) + "..." + wallet.address.slice(-4);
        connectBtn.textContent = shortAddress;
        document.getElementById("walletAddress").textContent = shortAddress;

        const balances = await loadBalances(wallet.provider, wallet.address);
        document.getElementById("evozBalance").textContent = Number(balances.evoz).toFixed(4);
        document.getElementById("evozxBalance").textContent = Number(balances.evozx).toFixed(4);
            
    } catch (error) {
        console.error(error);
        alert(error.message || "Wallet connection failed");
    }
});

// =========================================================
// INTERACTIVE NESTED FEE EVENT LISTENERS
// =========================================================
function updateFee() {
    const features = {};

    // Deteksi Checkbox Fitur Utama
    features.burnable = document.getElementById("burnable")?.checked;
    features.mintable = document.getElementById("mintable")?.checked;
    features.ownership = document.getElementById("ownership")?.checked;

    // Deteksi Sub-Accordion Metadata
    features.website = document.getElementById("website")?.checked;
    features.telegram = document.getElementById("telegram")?.checked;
    features.twitter = document.getElementById("twitter")?.checked;
    features.logo = document.getElementById("logo")?.checked;

    // Deteksi Sub-Accordion Advanced Settings
    features.maxWallet = document.getElementById("maxWallet")?.checked;
    features.maxTx = document.getElementById("maxTx")?.checked;
    features.tradingControl = document.getElementById("tradingControl")?.checked;
    features.buyTax = document.getElementById("buyTax")?.checked;
    features.sellTax = document.getElementById("sellTax")?.checked;

    const total = calculateFee(features);

    document.getElementById("evozxFee").textContent = total;
    document.getElementById("evozFee").textContent = total * 5;
}

// Daftarkan semua pemicu klik checkbox sub-accordion & input nilai teks/angka
const targetCheckboxes = [
    "burnable", "mintable", "ownership",
    "website", "telegram", "twitter", "logo",
    "maxWallet", "maxTx", "tradingControl", "buyTax", "sellTax"
];

const targetInputs = [
    "websiteUrl", "telegramUrl", "twitterUrl", "logoUrl",
    "maxWalletValue", "maxTxValue", "buyTaxValue", "sellTaxValue",
    "burnTaxShare", "marketingWallet", "developmentWallet"
];

targetCheckboxes.forEach(id => {
    document.getElementById(id)?.addEventListener("change", updateFee);
});

targetInputs.forEach(id => {
    document.getElementById(id)?.addEventListener("input", updateFee);
});

updateFee();

// =========================================================
// DEPLOYMENT LOGIC SMART CONTRACT
// =========================================================
const deployBtn = document.getElementById("deployBtn");

deployBtn.addEventListener("click", async () => {
    try {
        const signer = getSigner();
        if(!signer){
            alert("Connect wallet first");
            return;
        }

        const factory = await loadFactory(signer);
        const config = buildTokenConfig(getAddress());
        validateConfig(config);

        console.log("CONFIG", config);
        const evozx = await loadEvozx(signer);

        console.log("Factory Loaded", factory.target);
        console.log("EVOZX Loaded", evozx.target);

        const fee = await factory.getDeploymentFee(config);
        console.log("DEPLOY FEE", fee.toString());

        const balance = await evozx.balanceOf(getAddress());
        if(balance < fee){
            throw new Error("Insufficient EVOZX balance");
        }

        const allowance = await evozx.allowance(getAddress(), CONFIG.FACTORY);
        if(allowance < fee){
            console.log("Approving EVOZX...");
            const approveTx = await evozx.approve(CONFIG.FACTORY, fee);
            await approveTx.wait();
        }

        console.log("Creating Token...");
        const tx = await factory.createToken(config);
        const receipt = await tx.wait();

        let tokenAddress = null;
        for(const log of receipt.logs){
            try{
                const parsed = factory.interface.parseLog(log);
                if(parsed && parsed.name === "TokenCreated"){
                    tokenAddress = parsed.args.token;
                    break;
                }
            }catch{}
        }

        if(!tokenAddress){
            throw new Error("Token address not found");
        }

        console.log("DEPLOYED TOKEN", tokenAddress);

        const rincianToken = {
            name: document.getElementById("name")?.value || "Unnamed Token",
            symbol: document.getElementById("symbol")?.value || "TOKEN",
            supply: document.getElementById("supply")?.value || "0",
            address: tokenAddress
        };

        alert("SUCCESS", rincianToken);

    } catch(error){
        console.error(error);
        alert(error.message);
    }
});
            
