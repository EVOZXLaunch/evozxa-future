import {
    connectWallet,
    disconnectWallet,
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
    buyMissingEVOZX
} from "./exchange.js";

import {
    CONFIG
} from "./config.js";

/* =========================================================
   DOM
========================================================= */

const connectBtn = document.getElementById("connectBtn");
const deployBtn = document.getElementById("deployBtn");

const evozBalanceEl = document.getElementById("evozBalance");
const evozxBalanceEl = document.getElementById("evozxBalance");

const walletAddressEl = document.getElementById("walletAddress");

const feeEvozxEl = document.getElementById("evozxFee");
const feeEvozEl = document.getElementById("evozFee");

const deployStatusEl = document.getElementById("deployStatus");

const deploymentResultEl =
    document.getElementById("deploymentResult");

const tokenAddressEl =
    document.getElementById("tokenAddress");

const explorerLinkEl =
    document.getElementById("explorerLink");

const verificationLinkEl =
    document.getElementById("verificationLink");

/* =========================================================
   UI HELPERS
========================================================= */

function setDeployStatus(text) {

    console.log(text);

    if (deployStatusEl) {
        deployStatusEl.textContent = text;
    }
}

window.toggleAcc = function(header) {

    const content = header.nextElementSibling;

    if (!content) return;

    content.style.display =
        content.style.display === "block"
            ? "none"
            : "block";
};

window.toggleInput = function(checkbox) {

    const wrapper =
        checkbox.closest(".feature-wrapper");

    if (!wrapper) return;

    const input =
        wrapper.querySelector(".hidden-input");

    if (!input) return;

    input.disabled = !checkbox.checked;

    input.style.display =
        checkbox.checked
            ? "block"
            : "none";

    if (!checkbox.checked) {
        input.value = "";
    }

    updateFee();
};

/* =========================================================
   WALLET
========================================================= */

async function updateWalletUI(wallet) {

    if (!wallet) {

        if (connectBtn) {
            connectBtn.textContent =
                "Connect Wallet";
        }

        if (walletAddressEl) {
            walletAddressEl.textContent =
                "Not Connected";
        }

        localStorage.removeItem(
            "walletConnected"
        );

        return;
    }

    const shortAddress =
        wallet.address.slice(0, 6) +
        "..." +
        wallet.address.slice(-4);

    if (connectBtn) {
        connectBtn.textContent =
            shortAddress;
    }

    if (walletAddressEl) {
        walletAddressEl.textContent =
            shortAddress;
    }

    localStorage.setItem(
        "walletConnected",
        "true"
    );

    await refreshBalances();
    await updateFee();
}

async function refreshBalances() {

    try {

        const signer =
            getSigner();

        if (!signer) return;

        const balances =
            await loadBalances(
                signer.provider,
                getAddress()
            );

        if (evozBalanceEl) {
            evozBalanceEl.textContent =
                Number(
                    balances.evoz
                ).toFixed(4);
        }

        if (evozxBalanceEl) {
            evozxBalanceEl.textContent =
                Number(
                    balances.evozx
                ).toFixed(4);
        }

    } catch (error) {

        console.error(
            "Balance refresh error:",
            error
        );
    }
}

connectBtn?.addEventListener(
    "click",
    async () => {

        try {

            if (
                localStorage.getItem(
                    "walletConnected"
                ) === "true"
            ) {

                await disconnectWallet();

                await updateWalletUI(
                    null
                );

                return;
            }

            const wallet =
                await connectWallet();

            if (!wallet) return;

            await updateWalletUI(
                wallet
            );

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Wallet connection failed"
            );
        }
    }
);

/* =========================================================
   FEE CALCULATOR
========================================================= */

let feeTimeout;

async function updateFee() {

    clearTimeout(feeTimeout);

    feeTimeout = setTimeout(
        async () => {

            try {

                const signer =
                    getSigner();

                if (!signer) return;

                const factory =
                    await loadFactory(
                        signer
                    );

                const config =
                    buildTokenConfig(
                        getAddress()
                    );

                const fee =
                    await factory.getDeploymentFee(
                        config
                    );

                const feeEVOZX =
                    Number(
                        ethers.formatEther(
                            fee
                        )
                    );

                const feeEVOZ =
                    feeEVOZX * 5;

                if (feeEvozxEl) {
                    feeEvozxEl.textContent =
                        feeEVOZX.toFixed(2);
                }

                if (feeEvozEl) {
                    feeEvozEl.textContent =
                        feeEVOZ.toFixed(2);
                }

            } catch (error) {

                console.log(
                    "Fee calculation skipped:",
                    error.message
                );
            }

        },
        300
    );
}

document.addEventListener(
    "input",
    (event) => {

        if (
            event.target.matches(
                "input,select,textarea"
            )
        ) {
            updateFee();
        }
    }
);

document.addEventListener(
    "change",
    (event) => {

        if (
            event.target.matches(
                "input,select,textarea"
            )
        ) {
            updateFee();
        }
    }
);

/* =========================================================
   DEPLOY TOKEN
========================================================= */

deployBtn?.addEventListener(
    "click",
    async () => {

        try {

            deployBtn.disabled = true;

            setDeployStatus(
                "Preparing deployment..."
            );

            const signer =
                getSigner();

            if (!signer) {

                throw new Error(
                    "Connect wallet first"
                );
            }

            const factory =
                await loadFactory(
                    signer
                );

            const evozx =
                await loadEvozx(
                    signer
                );

            const config =
                buildTokenConfig(
                    getAddress()
                );

            validateConfig(config);

            setDeployStatus(
                "Calculating fee..."
            );

            const fee =
                await factory.getDeploymentFee(
                    config
                );

            let balance =
                await evozx.balanceOf(
                    getAddress()
                );

            if (balance < fee) {

                setDeployStatus(
                    "Buying missing EVOZX..."
                );

                await buyMissingEVOZX(
                    signer,
                    fee - balance
                );

                balance =
                    await evozx.balanceOf(
                        getAddress()
                    );

                if (balance < fee) {

                    throw new Error(
                        "Insufficient EVOZX balance"
                    );
                }
            }

            setDeployStatus(
                "Checking allowance..."
            );

            const allowance =
                await evozx.allowance(
                    getAddress(),
                    CONFIG.FACTORY
                );

            if (allowance < fee) {

                setDeployStatus(
                    "Approving EVOZX..."
                );

                const approveTx =
                    await evozx.approve(
                        CONFIG.FACTORY,
                        fee
                    );

                await approveTx.wait();
            }

            setDeployStatus(
                "Deploying token..."
            );

            const tx =
                await factory.createToken(
                    config
                );

            const receipt =
                await tx.wait();

            let tokenAddress = null;

            for (const log of receipt.logs) {

                try {

                    const parsed =
                        factory.interface.parseLog(
                            log
                        );

                    if (
                        parsed &&
                        parsed.name ===
                            "TokenCreated"
                    ) {

                        tokenAddress =
                            parsed.args.token;

                        break;
                    }

                } catch {}
            }

            if (!tokenAddress) {

                throw new Error(
                    "TokenCreated event not found"
                );
            }

            const explorerUrl =
                `${CONFIG.EXPLORER}/token/${tokenAddress}`;

            const myTokens =
                JSON.parse(
                    localStorage.getItem(
                        "myTokens"
                    ) || "[]"
                );

            myTokens.push({
                name: config.name,
                symbol: config.symbol,
                address: tokenAddress,
                deployedAt:
                    Date.now()
            });

            localStorage.setItem(
                "myTokens",
                JSON.stringify(myTokens)
            );

            if (
                deploymentResultEl
            ) {
                deploymentResultEl.classList.remove(
                    "hidden"
                );
            }

            if (
                tokenAddressEl
            ) {
                tokenAddressEl.textContent =
                    tokenAddress;
            }

            if (
                explorerLinkEl
            ) {
                explorerLinkEl.href =
                    explorerUrl;
            }

            if (
                verificationLinkEl
            ) {
                verificationLinkEl.href =
                    "./assets/standard-input.json";
            }

            await refreshBalances();

            setDeployStatus(
                "Deployment completed"
            );

            alert(
`🚀 TOKEN DEPLOYED

Token Address:
${tokenAddress}

Explorer:
${explorerUrl}`
            );

        } catch (error) {

            console.error(error);

            setDeployStatus(
                "Deployment failed"
            );

            alert(
                error.reason ||
                error.shortMessage ||
                error.message ||
                "Deployment failed"
            );

        } finally {

            deployBtn.disabled =
                false;
        }
    }
);

/* =========================================================
   AUTO RESTORE UI
========================================================= */

window.addEventListener(
    "load",
    async () => {

        try {

            if (
                localStorage.getItem(
                    "walletConnected"
                ) === "true"
            ) {

                const wallet =
                    await connectWallet();

                if (wallet) {
                    await updateWalletUI(
                        wallet
                    );
                }
            }

            updateFee();

        } catch (error) {

            console.log(
                "Restore skipped"
            );
        }
    }
);
