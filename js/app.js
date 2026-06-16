import { connectWallet, getSigner, getAddress, disconnectWallet } from "./wallet.js";
import { loadBalances } from "./balance.js";
import { loadFactory, loadEvozx, buildTokenConfig, validateConfig } from "./deploy.js";
import { CONFIG } from "./config.js";

// =========================================================
// UI INITIALIZATION & ACCORDIONS (FIXED)
// =========================================================
const initApp = () => {
    // Accordion Logic: Gunakan event delegation agar tidak berat di mobile
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('main-accordion-header')) {
            const content = e.target.nextElementSibling;
            content.style.display = (content.style.display === 'block') ? 'none' : 'block';
        }
    });

    // Inisialisasi Modal
    const modal = document.getElementById('customModal');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    if (confirmBtn) confirmBtn.onclick = () => { if(modal) modal.style.display = 'none'; };
};

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

// =========================================================
// MODAL ALERT HANDLER
// =========================================================
window.alert = function(message, tokenDetails = null) {
    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');

    if (tokenDetails) {
        modalTitle.innerText = "Deployment Success!";
        modalTitle.style.color = "#ffd700";
        modalMessage.innerHTML = `
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px;">
                <p>Token <strong>${tokenDetails.name}</strong> berhasil dideploy!</p>
                <p style="word-break: break-all;">Address: <code>${tokenDetails.address}</code></p>
            </div>
            <p style="margin-top: 15px;">Klik link di bawah untuk panduan verifikasi kontrak.</p>
            <a href="verification-guide.html" style="color: var(--gold); font-weight: bold;">Read Verification Guide</a>`;
    } else {
        modalTitle.innerText = "Notice";
        modalTitle.style.color = "#fff";
        modalMessage.innerText = message;
    }
    modal.style.display = 'flex';
};

// =========================================================
// FEE CALCULATOR
// =========================================================
function updateFee() {
    const checkboxes = ["burnable", "mintable", "ownership", "maxWallet", "maxTx", "tradingControl", "buyTax", "sellTax"];
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
    if (document.getElementById("evozxFee")) document.getElementById("evozxFee").textContent = fee;
    if (document.getElementById("evozFee")) document.getElementById("evozFee").textContent = fee * 5;
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

// INITIALIZE APP
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    if (localStorage.getItem("walletConnected") === "true") {
        connectWallet().then(w => w && updateWalletUI(w)).catch(() => localStorage.removeItem("walletConnected"));
    }
    const tokenForm = document.getElementById("tokenForm");
    if (tokenForm) tokenForm.addEventListener("change", updateFee);
});

connectBtn?.addEventListener("click", async () => {
    if (localStorage.getItem("walletConnected") === "true") {
        await disconnectWallet();
        updateWalletUI(null);
    } else {
        const wallet = await connectWallet();
        if (wallet) updateWalletUI(wallet);
    }
});
