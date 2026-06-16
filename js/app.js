import {
connectWallet,
getSigner,
getAddress
} from "./wallet.js";

import {
loadBalances
} from "./balance.js";

import {
calculateFee
} from "./pricing.js";

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
// INTERSEPTOR POPUP MODAL MODERN (PENGGANTI WINDOW.ALERT)
// =========================================================
// Kode ini otomatis menangkap semua fungsi alert() di bawah
// dan mengubahnya menjadi tampilan modal modern kustom kita.
window.alert = function(message) {
    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('modalConfirmBtn');

    if (!modal || !modalMessage) {
        // Fallback aman jika elemen HTML modal belum termuat
        console.warn("Custom modal elements not found, using native alert.");
        console.log(message);
        return;
    }

    // Tentukan Judul Berdasarkan Isi Pesan (Dinamis)
    if (message.toLowerCase().includes('success') || message.toLowerCase().includes('deployed')) {
        if (modalTitle) modalTitle.innerText = "Sukses";
        if (modalTitle) modalTitle.style.color = "#00ff88"; // Hijau untuk sukses
    } else if (message.toLowerCase().includes('failed') || message.toLowerCase().includes('insufficient') || message.toLowerCase().includes('first')) {
        if (modalTitle) modalTitle.innerText = "Peringatan";
        if (modalTitle) modalTitle.style.color = "#ff4a4a"; // Merah untuk error/peringatan
    } else {
        if (modalTitle) modalTitle.innerText = "Tips";
        if (modalTitle) modalTitle.style.color = "#ffcc00"; // Kuning emas default aplikasi Anda
    }

    // Masukkan pesan ke dalam modal
    modalMessage.innerText = message;

    // Tampilkan modal
    modal.style.display = 'flex';

    // Logika menutup modal saat klik tombol Konfirmasi
    confirmBtn.onclick = function() {
        modal.style.display = 'none';
    };
};
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

            // Otomatis lari ke modal kustom
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

// Otomatis lari ke modal kustom
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

// JIKA fungsi validateConfig(config) di dalam deploy.js melempar error via alert(),
// ia juga akan otomatis memicu modal kustom ini tanpa mengubah file deploy.js tersebut!
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

// Otomatis lari ke modal kustom dengan deteksi judul "Sukses"
alert(
`Token deployed successfully!

Address:
${tokenAddress}`
);

}
catch(error){

console.error(error);

// Otomatis lari ke modal kustom dengan deteksi judul "Peringatan"
alert(
error.message
);

}

});
