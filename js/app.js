import { connectWallet, getSigner, getAddress, disconnectWallet } from "./wallet.js";
import { loadBalances } from "./balance.js";
import { loadFactory, loadEvozx, buildTokenConfig, validateConfig } from "./deploy.js";
import { CONFIG } from "./config.js";

// =========================================================
// GLOBAL WALLET UI & PERSISTENCE
// =========================================================
const connectBtn = document.getElementById("connectBtn");

async function updateWalletUI(wallet) {
    const addrEl = document.getElementById("walletAddress");
    if (!wallet) {
        connectBtn.textContent = "Connect Wallet";
        if (addrEl) addrEl.textContent = "Not Connected";
        localStorage.removeItem("walletConnected");
        return;
    }
    const shortAddress = wallet.address.slice(0, 6) + "..." + wallet.address.slice(-4);
    connectBtn.textContent = shortAddress;
    if (addrEl) addrEl.textContent = shortAddress;
    localStorage.setItem("walletConnected", "true");

    if (document.getElementById("evozBalance")) {
        const balances = await loadBalances(wallet.provider, wallet.address);
        document.getElementById("evozBalance").textContent = Number(balances.evoz).toFixed(4);
        document.getElementById("evozxBalance").textContent = Number(balances.evozx).toFixed(4);
    }
}

connectBtn?.addEventListener("click", async () => {
    if (localStorage.getItem("walletConnected") === "true") {
        await disconnectWallet();
        updateWalletUI(null);
    } else {
        try {
            const wallet = await connectWallet();
            if (wallet) updateWalletUI(wallet);
        } catch (error) {
            alert(error.message || "Connection failed");
        }
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auto-reconnect
    if (localStorage.getItem("walletConnected") === "true") {
        try {
            const wallet = await connectWallet();
            if (wallet) updateWalletUI(wallet);
        } catch (e) { localStorage.removeItem("walletConnected"); }
    }
    // 2. Inisialisasi Event Listener untuk Fee Calculator
    const tokenForm = document.getElementById("tokenForm");
    if (tokenForm) {
        tokenForm.addEventListener("change", updateFee);
        updateFee(); // Hitung awal
    }
});

// =========================================================
// MODAL & FEE LOGIC
// =========================================================
const inisialisasiModalAlert = () => {
    const modal = document.getElementById('customModal');
    if (!modal) return;
    
    window.alert = function(message, tokenDetails = null) {
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const confirmBtn = document.getElementById('modalConfirmBtn');

        if (tokenDetails) {
            modalTitle.innerText = "Deployment Success!";
            modalTitle.style.color = "#ffd700";
            modalMessage.innerHTML = `
                <div style="text-align: left; background: rgba(255,255,255,0.05); padding: 14px; border-radius: 10px; margin-bottom: 16px;">
                    <p>Token <strong>${tokenDetails.name}</strong> berhasil dideploy!</p>
                    <p>Address:<br><code>${tokenDetails.address}</code></p>
                </div>
                <p style="margin-top: 10px; font-size: 0.9em;">Token Anda sudah aktif! Klik link di bawah untuk panduan verifikasi kontrak agar token Anda terpercaya di explorer.</p>
                <a href="verification-guide.html" style="display: block; margin-top: 15px; color: var(--gold); text-decoration: underline; font-weight: bold;">
                    Read Verification Guide
                </a>`;
        } else {
            modalTitle.innerText = "Notice";
            modalTitle.style.color = "#fff";
            modalMessage.innerText = message;
        }
        modal.style.display = 'flex';
        confirmBtn.onclick = () => modal.style.display = 'none';
    };
};
inisialisasiModalAlert();

function updateFee() {
    const checkboxes = [
        "burnable", "mintable", "ownership", "maxWallet", 
        "maxTx", "tradingControl", "buyTax", "sellTax"
    ];
    let fee = 10;
    checkboxes.forEach(id => {
        const el = document.getElementById(id);
        if (el?.checked) {
            if (["burnable"].includes(id)) fee += 2;
            else if (["mintable"].includes(id)) fee += 3;
            else if (["ownership"].includes(id)) fee += 1;
            else if (["maxWallet", "maxTx"].includes(id)) fee += 4;
            else if (["tradingControl"].includes(id)) fee += 4;
            else if (["buyTax", "sellTax"].includes(id)) fee += 6;
        }
    });
    const feeEl = document.getElementById("evozxFee");
    const valEl = document.getElementById("evozFee");
    if (feeEl) feeEl.textContent = fee;
    if (valEl) valEl.textContent = fee * 5;
}

// =========================================================
// DEPLOYMENT
// =========================================================
const deployBtn = document.getElementById("deployBtn");
deployBtn?.addEventListener("click", async () => {
    try {
        deployBtn.disabled = true;
        const signer = getSigner();
        if(!signer) throw new Error("Connect wallet first");

        const factory = await loadFactory(signer);
        const config = buildTokenConfig(getAddress());
        validateConfig(config);

        const evozx = await loadEvozx(signer);
        const fee = await factory.getDeploymentFee(config);
        
        const allowance = await evozx.allowance(getAddress(), CONFIG.FACTORY);
        if(allowance < fee) await (await evozx.approve(CONFIG.FACTORY, fee)).wait();
        
        const tx = await factory.createToken(config);
        const receipt = await tx.wait();
        
        const tokenAddress = receipt.logs.map(l => {
            try { return factory.interface.parseLog(l).args.token } catch { return null }
        }).find(a => a);

        const myTokens = JSON.parse(localStorage.getItem("myTokens") || "[]");
        myTokens.push({ name: config.name, symbol: config.symbol, address: tokenAddress });
        localStorage.setItem("myTokens", JSON.stringify(myTokens));

        alert("SUCCESS", { name: config.name, address: tokenAddress });
    } catch(error) {
        alert(error.message);
    } finally {
        deployBtn.disabled = false;
    }
});
