import { connectWallet, getSigner, getAddress, disconnectWallet } from "./wallet.js";
import { loadBalances } from "./balance.js";
import { loadFactory, loadEvozx, buildTokenConfig, validateConfig } from "./deploy.js";
import { buyMissingEVOZX } from "./exchange.js";
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

    // Hanya refresh balance jika elemen UI ada di halaman tersebut
    if (document.getElementById("evozBalance")) {
        await refreshBalances();
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
            alert(error.message || "Wallet connection failed");
        }
    }
});

// Auto-reconnect saat halaman pindah
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
// DEPLOYMENT LOGIC
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

        const factory = await loadFactory(signer);
        const evozx = await loadEvozx(signer);
        const config = buildTokenConfig();
        validateConfig(config);

        setDeployStatus("Checking symbol...");
        if (await factory.symbolExists(config.symbol)) throw new Error("Symbol already exists");

        setDeployStatus("Calculating deployment fee...");
        const fee = await factory.getDeploymentFee(config);
        
        let evozxBalance = await evozx.balanceOf(getAddress());
        if (evozxBalance < fee) {
            setDeployStatus("Buying EVOZX automatically...");
            await buyMissingEVOZX(signer, fee - evozxBalance);
            evozxBalance = await evozx.balanceOf(getAddress());
            if (evozxBalance < fee) throw new Error("Auto EVOZX purchase failed");
        }

        setDeployStatus("Approving EVOZX...");
        const allowance = await evozx.allowance(getAddress(), CONFIG.FACTORY);
        if (allowance < fee) await (await evozx.approve(CONFIG.FACTORY, fee)).wait();

        setDeployStatus("Deploying token...");
        const tx = await factory.createToken(config);
        const receipt = await tx.wait();

        let tokenAddress = null;
        for (const log of receipt.logs) {
            try {
                const parsed = factory.interface.parseLog(log);
                if (parsed && parsed.name === "TokenCreated") {
                    tokenAddress = parsed.args.token;
                    break;
                }
            } catch (err) {}
        }

        if (!tokenAddress) throw new Error("TokenCreated event not found");

        // --- SIMPAN KE DASHBOARD ---
        const rincianToken = {
            name: config.name,
            symbol: config.symbol,
            address: tokenAddress
        };
        const myTokens = JSON.parse(localStorage.getItem("myTokens") || "[]");
        myTokens.push(rincianToken);
        localStorage.setItem("myTokens", JSON.stringify(myTokens));
        // ---------------------------

        await refreshBalances();
        setDeployStatus("Deployment completed");

        alert(`🚀 TOKEN DEPLOYED\n\nAddress: ${tokenAddress}\n\nVerification package can now be downloaded from LaunchFuture.`);

    } catch (error) {
        console.error(error);
        setDeployStatus("Deployment failed");
        alert(error.reason || error.shortMessage || error.message || "Deployment failed");
    } finally {
        deployBtn.disabled = false;
    }
});
