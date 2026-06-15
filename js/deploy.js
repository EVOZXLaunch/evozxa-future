import { CONFIG } from "./config.js";

export async function loadFactory(
    signer
) {

    const abi =
        await fetch(
            "./abi/factory.json"
        ).then(r => r.json());

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
        await fetch(
            "./abi/evozx.json"
        ).then(r => r.json());

    return new ethers.Contract(
        CONFIG.EVOZX,
        abi,
        signer
    );
}
