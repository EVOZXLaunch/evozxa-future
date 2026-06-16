import { connectWallet, getSigner, getAddress } from "./wallet.js";
import { loadBalances } from "./balance.js";
import { calculateFee } from "./pricing.js";
import { loadFactory, loadEvozx, buildTokenConfig, validateConfig } from "./deploy.js";
import { CONFIG } from "./config.js";

// =========================================================
// 1. UI: ACCORDION & INPUT TOGGLE (FIXED)
// =========================================================

// Toggle Accordion Utama (Metadata/Advanced)
window.toggleAcc = function(el) {
    const content = el.nextElementSibling;
    content.style.display = (content.style.display === "block") ? "none" : "block";
};

// Toggle Tampil/Sembunyi Input saat Checkbox dicentang
window.toggleInput = function(checkbox) {
    const wrapper = checkbox.closest('.feature-wrapper');
    const input = wrapper.querySelector('.hidden-input');
    
    if (checkbox.checked) {
        input.style.display = "block";
        input.disabled = false;
    } else {
        input.style.display = "none";
        input.disabled = true;
        input.value = ""; // Reset nilai saat uncheck
    }
    updateFee(); // Hitung ulang fee saat ada perubahan
};

// =========================================================
// 2. WALLET & UI LOGIC
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
// 3. FEE CALCULATOR
// =========================================================
function updateFee() {
    const features = {};
    
    // Ambil semua checkbox fitur utama
    const featureIds = ["burnable", "mintable", "ownership", "maxWallet", "maxTx", "tradingControl", "buyTax", "sellTax"];
    featureIds.forEach(id => {
        const el = document.getElementById(id);
        features[id] = el ? el.checked : false;
    });

    // Ambil status Metadata/Advanced (cek apakah input aktif/punya value)
    const inputs = document.querySelectorAll('.hidden-input');
    inputs.forEach(input => {
        if (!input.disabled && input.value.trim() !== "") {
            features[input.id.replace('Url', '').replace('Value', '')] = true;
        }
    });

    const total = calculateFee(features);
    document.getElementById("evozxFee").textContent = total;
    document.getElementById("evozFee").textContent = total * 5;
}

// Event Listeners umum
document.addEventListener("change", (e) => { if (e.target.type === "checkbox") updateFee(); });
document.addEventListener("input", (e) => { if (e.target.type === "text" || e.target.type === "number") updateFee(); });

updateFee();

// =========================================================
// 4. DEPLOYMENT LOGIC
// =========================================================
const deployBtn = document.getElementById("deployBtn");

deployBtn.addEventListener("click", async () => {
    try {
        deployBtn.disabled = true;
        const signer = getSigner();
        if(!signer) throw new Error("Connect wallet first");

        const factory = await loadFactory(signer);
        const config = buildTokenConfig(getAddress());
        validateConfig(config);

        const evozx = await loadEvozx(signer);
        const fee = await factory.getDeploymentFee(config);
        
        const balance = await evozx.balanceOf(getAddress());
        if(balance < fee) throw new Error("Insufficient EVOZX balance");

        const allowance = await evozx.allowance(getAddress(), CONFIG.FACTORY);
        if(allowance < fee) {
            const approveTx = await evozx.approve(CONFIG.FACTORY, fee);
            await approveTx.wait();
        }

        const tx = await factory.createToken(config);
        const receipt = await tx.wait();

        const event = receipt.logs.map(l => {
            try { return factory.interface.parseLog(l); } catch { return null; }
        }).find(e => e?.name === "TokenCreated");

        if(!event) throw new Error("Token address not found");

        alert(`Token deployed successfully!\n\nAddress: ${event.args.token}`);
    } catch(error) {
        console.error(error);
        alert(error.message);
    } finally {
        deployBtn.disabled = false;
    }
});
