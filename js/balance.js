import { CONFIG } from "./config.js";

// Cache untuk ABI agar tidak fetch berulang kali
let evozxAbiCache = null;

export async function loadBalances(provider, address) {
    // 1. Fetch native balance (EVOZ)
    const evozBalance = await provider.getBalance(address);

    // 2. Fetch/Get Cached ABI untuk token (EVOZX)
    if (!evozxAbiCache) {
        const response = await fetch("./abi/evozx.json");
        evozxAbiCache = await response.json();
    }

    const evozx = new ethers.Contract(
        CONFIG.EVOZX,
        evozxAbiCache,
        provider
    );

    // 3. Fetch token balance (EVOZX)
    const evozxBalance = await evozx.balanceOf(address);

    return {
        evoz: ethers.formatEther(evozBalance),
        evozx: ethers.formatEther(evozxBalance)
    };
}
