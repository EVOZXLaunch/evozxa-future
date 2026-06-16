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

    // Load balances hanya jika elemen tersebut ada di halaman
    if (document.getElementById("evozBalance")) {
        const balances = await loadBalances(wallet.provider, wallet.address);
        document.getElementById("evozBalance").textContent = Number(balances.evoz).toFixed(4);
        document.getElementById("evozxBalance").textContent = Number(balances.evozx).toFixed(4);
    }
}

connectBtn.addEventListener("click", async () => {
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

// Auto-reconnect saat halaman dimuat
document.addEventListener('DOMContentLoaded', async () => {
    if (localStorage.getItem("walletConnected") === "true") {
        try {
            const wallet = await connectWallet();
            if (wallet) updateWalletUI(wallet);
        } catch (e) {
            localStorage.removeItem("walletConnected");
        }
    }
});

// =========================================================
// MODAL & FEE LOGIC (STAY SAME)
// =========================================================
const inisialisasiModalAlert = () => {
    window.alert = function(message, tokenDetails = null) {
        const modal = document.getElementById('customModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const confirmBtn = document.getElementById('modalConfirmBtn');
        const modalFooter = modal ? modal.querySelector('.modal-footer') : null;

        if (!modal) return alert(message);

        const oldDownloadBtn = document.getElementById('modalDownloadBtn');
        if (oldDownloadBtn) oldDownloadBtn.remove();

        if (tokenDetails) {
            modalTitle.innerText = "Deployment Success!";
            modalTitle.style.color = "#00ff88";
            modalMessage.innerHTML = `
                <div style="text-align: left; background: rgba(255,255,255,0.05); padding: 14px; border-radius: 10px; margin-bottom: 16px;">
                    <p><strong>Name:</strong> ${tokenDetails.name}</p>
                    <p><strong>Address:</strong> ${tokenDetails.address}</p>
                </div>`;
        } else {
            modalTitle.innerText = "Notice";
            modalMessage.innerText = message;
        }

        modal.style.display = 'flex';
        confirmBtn.onclick = () => modal.style.display = 'none';
    };
};
inisialisasiModalAlert();

function calculateFee(features) {
    let fee = 10;
    if (features.burnable) fee += 2;
    if (features.mintable) fee += 3;
    if (features.ownership) fee += 1;
    if (features.maxWallet || features.maxTx) fee += 4;
    if (features.tradingControl) fee += 4;
    if (features.buyTax || features.sellTax) fee += 6;
    return fee;
}

function updateFee() {
    const features = {
        burnable: document.getElementById("burnable")?.checked,
        mintable: document.getElementById("mintable")?.checked,
        ownership: document.getElementById("ownership")?.checked,
        maxWallet: document.getElementById("maxWallet")?.checked,
        maxTx: document.getElementById("maxTx")?.checked,
        tradingControl: document.getElementById("tradingControl")?.checked,
        buyTax: document.getElementById("buyTax")?.checked,
        sellTax: document.getElementById("sellTax")?.checked
    };
    const total = calculateFee(features);
    if(document.getElementById("evozxFee")) document.getElementById("evozxFee").textContent = total;
    if(document.getElementById("evozFee")) document.getElementById("evozFee").textContent = total * 5;
}

// =========================================================
// DEPLOYMENT & DASHBOARD LOGIC
// =========================================================
const deployBtn = document.getElementById("deployBtn");
deployBtn?.addEventListener("click", async () => {
    try {
        const signer = getSigner();
        if(!signer) throw new Error("Connect wallet first");

        const factory = await loadFactory(signer);
        const userAddress = await getAddress();
        const config = buildTokenConfig(userAddress);
        validateConfig(config);

        const evozx = await loadEvozx(signer);
        const fee = await factory.getDeploymentFee(config);
        
        // Approval & Deployment
        const allowance = await evozx.allowance(userAddress, CONFIG.FACTORY);
        if(allowance < fee) await (await evozx.approve(CONFIG.FACTORY, fee)).wait();
        
        const tx = await factory.createToken(config);
        const receipt = await tx.wait();
        
        const tokenAddress = receipt.logs.map(l => {
            try { return factory.interface.parseLog(l).args.token } catch { return null }
        }).find(a => a);

        const rincianToken = {
            name: document.getElementById("name").value,
            symbol: document.getElementById("symbol").value,
            address: tokenAddress
        };

        // Simpan ke localStorage untuk Dashboard
        const myTokens = JSON.parse(localStorage.getItem("myTokens") || "[]");
        myTokens.push(rincianToken);
        localStorage.setItem("myTokens", JSON.stringify(myTokens));

        alert("SUCCESS", rincianToken);
    } catch(error) {
        alert(error.message);
    }
});
