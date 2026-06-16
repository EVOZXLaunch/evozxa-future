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

        // Force English button text
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
    // Nilai dasar 10 EVOZX (Menyesuaikan placeholder awal di UI summary HTML Anda)
    let fee = 10; 
    
    // Penambahan kalkulasi biaya per fitur opsional (bisa Anda ubah nilainya)
    if (features.burnable) fee += 2;
    if (features.mintable) fee += 3;
    if (features.ownership) fee += 1;
    if (features.maxWallet) fee += 2;
    if (features.maxTx) fee += 2;
    if (features.tradingControl) fee += 4;
    if (features.buyTax) fee += 3;
    if (features.sellTax) fee += 3;

    // Tambahan biaya jika Metadata URL diisi
    if (features.website || features.telegram || features.twitter || features.logo) {
        fee += 1;
    }

    return fee;
}
// =========================================================

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

const featureIds = [

"burnable",
"mintable",
"ownership",

"maxWallet",
"maxTx",

"tradingControl",

"buyTax",
"sellTax"

];

function updateFee() {

const features = {};

features.website =
document.getElementById(
"websiteUrl"
).value.trim() !== "";

features.telegram =
document.getElementById(
"telegramUrl"
).value.trim() !== "";

features.twitter =
document.getElementById(
"twitterUrl"
).value.trim() !== "";

features.logo =
document.getElementById(
"logoUrl"
).value.trim() !== "";

featureIds.forEach(id => {

features[id] =
document.getElementById(id)?.checked;

});

const total =
calculateFee(features);

document.getElementById(
"evozxFee"
).textContent = total;

document.getElementById(
"evozFee"
).textContent =
total * 5;

}

featureIds.forEach(id => {

document
.getElementById(id)
?.addEventListener(
"change",
updateFee
);

});

[
"websiteUrl",
"telegramUrl",
"twitterUrl",
"logoUrl"
].forEach(id => {

document
.getElementById(id)
?.addEventListener(
"input",
updateFee
);

});

updateFee();

const deployBtn =
document.getElementById(
"deployBtn"
);

deployBtn.addEventListener(
"click",
async () => {

try {

const signer =
getSigner();

if(!signer){

alert(
"Connect wallet first"
);

return;
}

const factory =
await loadFactory(
signer
);

const config =
buildTokenConfig(
getAddress()
);

validateConfig(
config
);

console.log(
"CONFIG",
config
);

const evozx =
await loadEvozx(
signer
);

console.log(
"Factory Loaded",
factory.target
);

console.log(
"EVOZX Loaded",
evozx.target
);

const fee =
await factory.getDeploymentFee(
config
);

console.log(
"DEPLOY FEE",
fee.toString()
);

const balance =
await evozx.balanceOf(
getAddress()
);

if(balance < fee){

throw new Error(
"Insufficient EVOZX balance"
);

}

const allowance =
await evozx.allowance(
getAddress(),
CONFIG.FACTORY
);

if(allowance < fee){

console.log(
"Approving EVOZX..."
);

const approveTx =
await evozx.approve(
CONFIG.FACTORY,
fee
);

await approveTx.wait();

}

console.log(
"Creating Token..."
);

const tx =
await factory.createToken(
config
);

const receipt =
await tx.wait();

let tokenAddress = null;

for(
const log of receipt.logs
){

try{

const parsed =
factory.interface.parseLog(
log
);

if(
parsed &&
parsed.name ===
"TokenCreated"
){

tokenAddress =
parsed.args.token;

break;

}

}catch{}

}

if(!tokenAddress){

throw new Error(
"Token address not found"
);

}

console.log(
"DEPLOYED TOKEN",
tokenAddress
);

alert(
`Token deployed successfully!

Address:
${tokenAddress}`
);

}
catch(error){

console.error(error);

alert(
error.message
);

}

});
