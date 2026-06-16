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
// INTERSEPTOR POPUP MODAL MODERN (FULL ENGLISH VERSION)
// =========================================================
const inisialisasiModalAlert = () => {
    window.alert = function(message) {
        const modal = document.getElementById('customModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const confirmBtn = document.getElementById('modalConfirmBtn');

        if (!modal || !modalMessage) {
            console.warn("Custom modal elements not found, using native alert.");
            console.log(message);
            return;
        }

        const msgStr = String(message).toLowerCase();

        // English Dynamic Title Detection
        if (msgStr.includes('success') || msgStr.includes('deployed') || msgStr.includes('berhasil')) {
            if (modalTitle) {
                modalTitle.innerText = "Success";
                modalTitle.style.color = "#00ff88"; // Magic Neon Green
            }
        } else if (msgStr.includes('failed') || msgStr.includes('insufficient') || msgStr.includes('first') || msgStr.includes('required') || msgStr.includes('gagal')) {
            if (modalTitle) {
                modalTitle.innerText = "Warning";
                modalTitle.style.color = "#ff4a4a"; // Warning Red
            }
        } else {
            if (modalTitle) {
                modalTitle.innerText = "Notice";
                modalTitle.style.color = "#ffd700"; // Wizard Gold Default
            }
        }

        modalMessage.innerText = message;
        modal.style.display = 'flex';

        if (confirmBtn) {
            confirmBtn.innerText = "CONFIRM";
        }

        confirmBtn.onclick = function() {
            modal.style.display = 'none';
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
    let fee = 10; // Base fee 10 EVOZX
    
    // Fitur Checkbox Dasar
    if (features.burnable) fee += 2;
    if (features.mintable) fee += 3;
    if (features.ownership) fee += 1;
    
    // Fitur Advanced (Aktif jika kolom input angka diisi nilai > 0)
    if (features.maxWallet > 0) fee += 2;
    if (features.maxTx > 0) fee += 2;
    if (features.tradingControl > 0) fee += 4;
    if (features.buyTax > 0) fee += 3;
    if (features.sellTax > 0) fee += 3;

    // Metadata (Aktif jika salah satu link diisi teks)
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
// INTERACTIVE FEE EVENT LISTENERS
// =========================================================
function updateFee() {
    const features = {};

    // Deteksi Fitur Checkbox
    features.burnable = document.getElementById("burnable")?.checked;
    features.mintable = document.getElementById("mintable")?.checked;
    features.ownership = document.getElementById("ownership")?.checked;

    // Deteksi Metadata Inputs (True jika tidak kosong)
    features.website = document.getElementById("websiteUrl")?.value.trim() !== "";
    features.telegram = document.getElementById("telegramUrl")?.value.trim() !== "";
    features.twitter = document.getElementById("twitterUrl")?.value.trim() !== "";
    features.logo = document.getElementById("logoUrl")?.value.trim() !== "";

    // Deteksi Advanced Value Inputs (Mengonversi nilai input teks menjadi angka)
    features.maxWallet = parseFloat(document.getElementById("maxWallet")?.value) || 0;
    features.maxTx = parseFloat(document.getElementById("maxTx")?.value) || 0;
    features.tradingControl = parseFloat(document.getElementById("tradingControl")?.value) || 0;
    features.buyTax = parseFloat(document.getElementById("buyTax")?.value) || 0;
    features.sellTax = parseFloat(document.getElementById("sellTax")?.value) || 0;

    const total = calculateFee(features);

    document.getElementById("evozxFee").textContent = total;
    document.getElementById("evozFee").textContent = total * 5;
}

// Mendefinisikan seluruh ID elemen input untuk pemantauan harga aktif
const checkboxIds = ["burnable", "mintable", "ownership"];
const inputIds = [
    "websiteUrl", "telegramUrl", "twitterUrl", "logoUrl",
    "maxWallet", "maxTx", "tradingControl", "buyTax", "sellTax"
];

// Pasang Event Listener 'change' untuk elemen Checkbox
checkboxIds.forEach(id => {
    document.getElementById(id)?.addEventListener("change", updateFee);
});

// Pasang Event Listener 'input' untuk elemen Text/Number Box
inputIds.forEach(id => {
    document.getElementById(id)?.addEventListener("input", updateFee);
});

// Jalankan fungsi kalkulasi awal saat halaman dimuat
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
        alert(`Token deployed successfully!\n\nAddress:\n${tokenAddress}`);

    } catch(error){
        console.error(error);
        alert(error.message);
    }
});
                    
