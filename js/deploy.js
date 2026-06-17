import { CONFIG } from "./config.js";

/* =========================================================
   ABI CACHE
========================================================= */

const ABI_CACHE = new Map();

async function getABI(fileName) {

    if (ABI_CACHE.has(fileName)) {
        return ABI_CACHE.get(fileName);
    }

    const response =
        await fetch(
            `./abi/${fileName}.json`
        );

    if (!response.ok) {

        throw new Error(
            `Failed to load ABI: ${fileName}.json`
        );
    }

    const abi =
        await response.json();

    ABI_CACHE.set(
        fileName,
        abi
    );

    return abi;
}

/* =========================================================
   CONTRACT LOADERS
========================================================= */

export async function loadFactory(
    signer
) {

    const abi =
        await getABI(
            "factory"
        );

    return new ethers.Contract(
        CONFIG.FACTORY,
        abi,
        signer
    );
}

export async function loadEvozx(
    signer
) {

    const abi =
        await getABI(
            "evozx"
        );

    return new ethers.Contract(
        CONFIG.EVOZX,
        abi,
        signer
    );
}

export async function loadExchange(
    signer
) {

    const abi =
        await getABI(
            "exchange"
        );

    return new ethers.Contract(
        CONFIG.EXCHANGE,
        abi,
        signer
    );
}

/* =========================================================
   HELPERS
========================================================= */

function getValue(id) {

    return document
        .getElementById(id)
        ?.value
        ?.trim() || "";
}

function getNumber(id) {

    const value =
        Number(
            document
            .getElementById(id)
            ?.value || 0
        );

    return Number.isFinite(value)
        ? value
        : 0;
}

function getChecked(id) {

    return document
        .getElementById(id)
        ?.checked || false;
}

/* =========================================================
   BUILD TOKEN CONFIG
========================================================= */

export function buildTokenConfig(
    ownerAddress
) {

    const owner =
        ownerAddress ||
        ethers.ZeroAddress;

    const marketingWallet =
        getValue(
            "marketingWallet"
        );

    const developmentWallet =
        getValue(
            "developmentWallet"
        );

    return {

        /* BASIC */

        name:
            getValue("name"),

        symbol:
            getValue("symbol")
                .toUpperCase(),

        supply:
            getNumber("supply"),

        owner,

        /* NETWORK */

        chainId:
            CONFIG.CHAIN_ID,

        launchKitVersion:
            1,

        /* TOKEN FEATURES */

        burnable:
            getChecked("burnable"),

        mintable:
            getChecked("mintable"),

        ownershipEnabled:
            getChecked("ownership"),

        /* METADATA */

        website:
            getValue(
                "websiteUrl"
            ),

        telegram:
            getValue(
                "telegramUrl"
            ),

        twitter:
            getValue(
                "twitterUrl"
            ),

        logoURI:
            getValue(
                "logoUrl"
            ),

        /* LIMITS */

        maxWalletEnabled:
            getChecked(
                "maxWallet"
            ),

        maxWalletPercent:
            getNumber(
                "maxWalletValue"
            ),

        maxTxEnabled:
            getChecked(
                "maxTx"
            ),

        maxTxPercent:
            getNumber(
                "maxTxValue"
            ),

        /* TRADING */

        tradingControlEnabled:
            getChecked(
                "tradingControl"
            ),

        tradingEnabled:
            getChecked(
                "tradingEnabled"
            ),

        /* TAX */

        buyTaxEnabled:
            getChecked(
                "buyTax"
            ),

        buyTax:
            getNumber(
                "buyTaxValue"
            ),

        sellTaxEnabled:
            getChecked(
                "sellTax"
            ),

        sellTax:
            getNumber(
                "sellTaxValue"
            ),

        burnTaxShare:
            getNumber(
                "burnTaxShare"
            ),

        marketingWallet:
            marketingWallet ||
            ethers.ZeroAddress,

        developmentWallet:
            developmentWallet ||
            ethers.ZeroAddress
    };
}

/* =========================================================
   VALIDATION
========================================================= */

export function validateConfig(
    config
) {

    if (!config.name) {

        throw new Error(
            "Token name required"
        );
    }

    if (
        config.name.length > 64
    ) {

        throw new Error(
            "Token name too long"
        );
    }

    if (
        !config.symbol
    ) {

        throw new Error(
            "Token symbol required"
        );
    }

    if (
        config.symbol.length < 2
    ) {

        throw new Error(
            "Symbol minimum 2 characters"
        );
    }

    if (
        config.symbol.length > 12
    ) {

        throw new Error(
            "Symbol maximum 12 characters"
        );
    }

    if (
        !/^[A-Z0-9]+$/.test(
            config.symbol
        )
    ) {

        throw new Error(
            "Symbol can only contain A-Z and 0-9"
        );
    }

    if (
        config.supply <= 0
    ) {

        throw new Error(
            "Supply must be greater than zero"
        );
    }

    if (
        config.supply >
        1000000000000
    ) {

        throw new Error(
            "Maximum supply is 1,000,000,000,000"
        );
    }

    if (
        config.buyTax < 0 ||
        config.buyTax > 10
    ) {

        throw new Error(
            "Buy tax maximum is 10%"
        );
    }

    if (
        config.sellTax < 0 ||
        config.sellTax > 10
    ) {

        throw new Error(
            "Sell tax maximum is 10%"
        );
    }

    if (
        config.maxWalletEnabled
    ) {

        if (
            config.maxWalletPercent <= 0 ||
            config.maxWalletPercent > 100
        ) {

            throw new Error(
                "Max Wallet must be 1 - 100%"
            );
        }
    }

    if (
        config.maxTxEnabled
    ) {

        if (
            config.maxTxPercent <= 0 ||
            config.maxTxPercent > 100
        ) {

            throw new Error(
                "Max Tx must be 1 - 100%"
            );
        }
    }

    if (
        config.marketingWallet !==
            ethers.ZeroAddress &&
        !ethers.isAddress(
            config.marketingWallet
        )
    ) {

        throw new Error(
            "Invalid marketing wallet"
        );
    }

    if (
        config.developmentWallet !==
            ethers.ZeroAddress &&
        !ethers.isAddress(
            config.developmentWallet
        )
    ) {

        throw new Error(
            "Invalid development wallet"
        );
    }

    if (
        config.buyTaxEnabled ||
        config.sellTaxEnabled
    ) {

        const hasReceiver =

            config.burnTaxShare > 0 ||

            config.marketingWallet !==
                ethers.ZeroAddress ||

            config.developmentWallet !==
                ethers.ZeroAddress;

        if (!hasReceiver) {

            throw new Error(
                "Tax receiver missing"
            );
        }
    }

    return true;
}
