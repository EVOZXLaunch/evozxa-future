import { connectWallet, getSigner, getAddress, disconnectWallet } from "./wallet.js";
import { loadBalances } from "./balance.js";
import { loadFactory, loadEvozx, buildTokenConfig, validateConfig } from "./deploy.js";
import { buyMissingEVOZX } from "./exchange.js";
import { CONFIG } from "./config.js";

// =========================================================
// 1. UI: ACCORDION & INPUT TOGGLE
// =========================================================
window.toggleAcc = function(el) {
    const content = el.nextElementSibling;
    content.style.display = (content.style.display === "block") ? "none" : "block";
};

window.toggleInput = function(checkbox) {
    const wrapper = checkbox.closest('.feature-wrapper');
    const input = wrapper.querySelector('.hidden-input');
    if (input) {
        input.style.display = checkbox.checked ? "block" : "none";
        input.disabled = !checkbox.checked;
        if (!checkbox.checked) input.value = "";
    }
};

// =========================================================
// 2. WALLET & UI LOGIC
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
    
    if (document.getElementById("evozBalance")) await refreshBalances();
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
            alert(error.message || "Wallet connection failed");
        }
    }
});

async function refreshBalances() {
    const signer = getSigner();
    if (!signer) return;
    const balances = await loadBalances(signer.provider, getAddress());
    const evozEl = document.getElementById("evozBalance");
    const evozxEl = document.getElementById("evozxBalance");
    if (evozEl) evozEl.textContent = Number(balances.evoz).toFixed(4);
    if (evozxEl) evozxEl.textContent = Number(balances.evozx).toFixed(4);
}

// =========================================================
// 3. DEPLOYMENT LOGIC
// =========================================================
const deployBtn = document.getElementById("deployBtn");

function setDeployStatus(text) {
    console.log(text);
    const el = document.getElementById("deployStatus");
    if (el) el.textContent = text;
}

deployBtn?.addEventListener("click", async () => {
    try {
        deployBtn.disabled = true;
        setDeployStatus("Preparing deployment...");

        const signer = getSigner();
        if (!signer) throw new Error("Connect wallet first");

        // buildTokenConfig() sekarang akan otomatis membaca input yang diaktifkan (tidak disabled)
        const config = buildTokenConfig(); 
        validateConfig(config);

        const factory = await loadFactory(signer);
        const evozx = await loadEvozx(signer);

        setDeployStatus("Calculating fee...");
        const fee = await factory.getDeploymentFee(config);
        
        let evozxBalance = await evozx.balanceOf(getAddress());
        if (evozxBalance < fee) {
            setDeployStatus("Auto-buying EVOZX...");
            await buyMissingEVOZX(signer, fee - evozxBalance);
            evozxBalance = await evozx.balanceOf(getAddress());
            if (evozxBalance < fee) throw new Error("Insufficient EVOZX balance");
        }

        setDeployStatus("Approving...");
        const allowance = await evozx.allowance(getAddress(), CONFIG.FACTORY);
        if (allowance < fee) await (await evozx.approve(CONFIG.FACTORY, fee)).wait();

        setDeployStatus("Deploying...");
        const tx = await factory.createToken(config);
        const receipt = await tx.wait();

        const event = receipt.logs.map(l => { try { return factory.interface.parseLog(l); } catch { return null; } }).find(e => e?.name === "TokenCreated");
        if (!event) throw new Error("Token address not found");

        // Save to Dashboard
        const myTokens = JSON.parse(localStorage.getItem("myTokens") || "[]");
        myTokens.push({ name: config.name, symbol: config.symbol, address: event.args.token });
        localStorage.setItem("myTokens", JSON.stringify(myTokens));

        await refreshBalances();
        alert(`🚀 TOKEN DEPLOYED\n\nAddress: ${event.args.token}`);

    } catch (error) {
        console.error(error);
        alert(error.reason || error.message || "Deployment failed");
    } finally {
        deployBtn.disabled = false;
        setDeployStatus("");
    }
});
