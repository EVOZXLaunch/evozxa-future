import { connectWallet, getSigner, getAddress } from "./wallet.js";
import { loadBalances } from "./balance.js";
import { calculateFee } from "./pricing.js";
import { loadFactory, loadEvozx, buildTokenConfig, validateConfig } from "./deploy.js";
import { CONFIG } from "./config.js";

// =========================================================
// 1. UI: ACCORDION TOGGLE (FIXED)
// =========================================================
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('main-accordion-header')) {
        const content = e.target.nextElementSibling;
        content.style.display = (content.style.display === 'block') ? 'none' : 'block';
    }
});

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
const featureIds = ["burnable", "mintable", "ownership", "maxWallet", "maxTx", "tradingControl", "buyTax", "sellTax"];
const metaIds = ["websiteUrl", "telegramUrl", "twitterUrl", "logoUrl"];

function updateFee() {
    const features = {};
    
    // Check Metadata
    metaIds.forEach(id => {
        const key = id.replace('Url', '');
        features[key] = document.getElementById(id)?.value.trim() !== "";
    });

    // Check Features
    featureIds.forEach(id => {
        features[id] = document.getElementById(id)?.checked;
    });

    const total = calculateFee(features);
    document.getElementById("evozxFee").textContent = total;
    document.getElementById("evozFee").textContent = total * 5;
}

// Event Listeners for Fees
featureIds.forEach(id => document.getElementById(id)?.addEventListener("change", updateFee));
metaIds.forEach(id => document.getElementById(id)?.addEventListener("input", updateFee));
updateFee();

// =========================================================
// 4. DEPLOYMENT LOGIC
// =========================================================
const deployBtn = document.getElementById("deployBtn");

deployBtn.addEventListener("click", async () => {
    try {
        deployBtn.disabled = true; // Prevent double click
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
