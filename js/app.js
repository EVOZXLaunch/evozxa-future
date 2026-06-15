import {
connectWallet
} from "./wallet.js";

import {
loadBalances
} from "./balance.js";

const connectBtn =
document.getElementById("connectBtn");

connectBtn.addEventListener(
    "click",
    async () => {

        try {

            const wallet =
            await connectWallet();

            if (!wallet) return;

            const shortAddress =
                wallet.address.slice(0, 6) +
                "..." +
                wallet.address.slice(-4);

            connectBtn.textContent =
                shortAddress;

document.getElementById(
"walletAddress"
).textContent =
shortAddress;

const balances =
await loadBalances(
wallet.provider,
wallet.address
);

document.getElementById(
"evozBalance"
).textContent =
Number(
balances.evoz
).toFixed(4);

document.getElementById(
"evozxBalance"
).textContent =
Number(
balances.evozx
).toFixed(4);
            
        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Wallet connection failed"
            );

        }

    }
);
