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

/* =========================================================
   UI HELPERS
========================================================= */

const connectBtn =
    document.getElementById("connectBtn");

const deployBtn =
    document.getElementById("deployBtn");

const feeEvozxEl =
    document.getElementById("evozxFee");

const feeEvozEl =
    document.getElementById("evozFee");

const statusEl =
    document.getElementById("deployStatus");

function setStatus(text) {

    if (statusEl) {
        statusEl.textContent = text;
    }

    console.log(text);
}

window.toggleAcc = function (header) {

    const content =
        header.nextElementSibling;

    if (!content) return;

    content.style.display =
        content.style.display === "block"
            ? "none"
            : "block";
};

window.toggleInput = function (checkbox) {

    const wrapper =
        checkbox.closest(".feature-wrapper");

    if (!wrapper) return;

    const input =
        wrapper.querySelector(".hidden-input");

    if (!input) return;

    input.disabled =
        !checkbox.checked;

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

async function refreshBalances() {

    const signer =
        getSigner();

    if (!signer) return;

    const balances =
        await loadBalances(
            signer.provider,
            getAddress()
        );

    const evozBalance =
        document.getElementById(
            "evozBalance"
        );

    const evozxBalance =
        document.getElementById(
            "evozxBalance"
        );

    if (evozBalance) {
        evozBalance.textContent =
            Number(
                balances.evoz
            ).toFixed(4);
    }

    if (evozxBalance) {
        evozxBalance.textContent =
            Number(
                balances.evozx
            ).toFixed(4);
    }
}

connectBtn?.addEventListener(
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

            const walletAddressEl =
                document.getElementById(
                    "walletAddress"
                );

            if (walletAddressEl) {
                walletAddressEl.textContent =
                    shortAddress;
            }

            await refreshBalances();

            await updateFee();

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
                    "Fee update skipped:",
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
   DEPLOY
========================================================= */

deployBtn?.addEventListener(
    "click",
    async () => {

        try {

            deployBtn.disabled =
                true;

            setStatus(
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

            validateConfig(
                config
            );

            setStatus(
                "Calculating fee..."
            );

            const fee =
                await factory.getDeploymentFee(
                    config
                );

            const balance =
                await evozx.balanceOf(
                    getAddress()
                );

            if (balance < fee) {

                throw new Error(
                    `Insufficient EVOZX balance.
Required: ${ethers.formatEther(fee)} EVOZX`
                );
            }

            setStatus(
                "Checking allowance..."
            );

            const allowance =
                await evozx.allowance(
                    getAddress(),
                    CONFIG.FACTORY
                );

            if (allowance < fee) {

                setStatus(
                    "Approve EVOZX..."
                );

                const approveTx =
                    await evozx.approve(
                        CONFIG.FACTORY,
                        fee
                    );

                await approveTx.wait();
            }

            setStatus(
                "Deploying token..."
            );

            const tx =
                await factory.createToken(
                    config
                );

            const receipt =
                await tx.wait();

            let tokenAddress =
                null;

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

            await refreshBalances();

            setStatus(
                "Deployment completed"
            );

            const explorer =
                `${CONFIG.EXPLORER}/token/${tokenAddress}`;

            alert(
`🚀 TOKEN DEPLOYED

Address:
${tokenAddress}

Explorer:
${explorer}`
            );

            console.log(
                "TOKEN DEPLOYED:",
                tokenAddress
            );

        } catch (error) {

            console.error(error);

            setStatus(
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
   INIT
========================================================= */

updateFee();
