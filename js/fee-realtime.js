import { getSigner } from "./wallet.js";
import { loadFactory, buildTokenConfig } from "./deploy.js";

let timer = null;

async function calculateFee() {
    try {

        const signer = getSigner();
        if (!signer) return;

        const factory = await loadFactory(signer);
        const config = buildTokenConfig();

        if (!config.name || !config.symbol || !config.supply) {
            return;
        }

        // =========================
        // EVOZX FEE (ON CHAIN)
        // =========================
        const fee = await factory.getDeploymentFee(config);

        document.getElementById("evozxFee").textContent =
            ethers.formatEther(fee);

    } catch (err) {
        console.log("fee error:", err.message);
    }
}

// =========================
// SAFE TRIGGER (NO SPAM)
// =========================
function scheduleUpdate() {

    clearTimeout(timer);

    timer = setTimeout(() => {
        calculateFee();
    }, 800); // debounce penting
}

// input listener (SAFE)
document.addEventListener("input", scheduleUpdate);

// initial run
setTimeout(calculateFee, 1500);
