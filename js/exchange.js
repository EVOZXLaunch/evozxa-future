import { CONFIG } from "./config.js";

// Cache untuk ABI
let exchangeAbiCache = null;

async function getExchangeABI() {
    if (!exchangeAbiCache) {
        const response = await fetch("./abi/exchange.json");
        exchangeAbiCache = await response.json();
    }
    return exchangeAbiCache;
}

export async function loadExchange(signer) {
    const abi = await getExchangeABI();
    return new ethers.Contract(CONFIG.EXCHANGE, abi, signer);
}

export async function getRate(signer) {
    const exchange = await loadExchange(signer);
    return await exchange.rate();
}

export async function buyMissingEVOZX(signer, missingAmountWei) {
    const exchange = await loadExchange(signer);
    
    // Pastikan rate diambil dengan benar (asumsi rate dalam format yang sesuai dengan SC Anda)
    const rate = await exchange.rate();
    const evozRequiredWei = BigInt(missingAmountWei) * BigInt(rate);

    // Kirim transaksi dengan value yang diperlukan
    const tx = await exchange.buyEVOZX({
        value: evozRequiredWei
    });

    await tx.wait();
    return tx.hash;
}
