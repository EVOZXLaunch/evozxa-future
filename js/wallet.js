import { CONFIG } from "./config.js";

export let provider = null;
export let signer = null;
export let userAddress = null;

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

export async function connectWallet() {
    if (!window.ethereum) {
        alert("MetaMask wallet not detected");
        return null;
    }

    try {
        await delay(200);
        provider = new ethers.BrowserProvider(window.ethereum);

        await window.ethereum.request({ method: "eth_requestAccounts" });
        await safeSwitchChain();

        signer = await provider.getSigner();
        userAddress = await signer.getAddress();

        // Listen for account changes
        window.ethereum.on("accountsChanged", async (accounts) => {
            if (accounts.length > 0) {
                userAddress = accounts[0];
                signer = await provider.getSigner();
                location.reload(); // Refresh agar UI tersinkron
            } else {
                await disconnectWallet();
            }
        });

        return { provider, signer, address: userAddress };
    } catch (error) {
        console.error("CONNECT ERROR:", error);
        throw error;
    }
}

export async function disconnectWallet() {
    signer = null;
    userAddress = null;
    provider = null;
    // Kita tidak bisa memaksa MetaMask untuk "logout" secara teknis, 
    // tapi kita menghapus data di aplikasi kita.
    localStorage.removeItem("walletConnected");
}

async function safeSwitchChain() {
    const chainId = "0x325";
    try {
        const switchPromise = window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId }]
        });
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Switch chain timeout")), 5000)
        );
        await Promise.race([switchPromise, timeout]);
    } catch (error) {
        if (error.code === 4902) {
            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                    chainId: "0x325",
                    chainName: "EVOZ Mainnet",
                    nativeCurrency: { name: "EVOZ", symbol: "EVOZ", decimals: 18 },
                    rpcUrls: [CONFIG.RPC_URL],
                    blockExplorerUrls: [CONFIG.EXPLORER]
                }]
            });
        } else {
            console.warn("Chain switch skipped:", error.message);
        }
    }
}

export function getSigner() { return signer; }
export function getAddress() { return userAddress; }
