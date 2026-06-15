import { CONFIG } from "./config.js";

export async function loadBalances(
    provider,
    address
) {

    const evozBalance =
        await provider.getBalance(
            address
        );

    const evozxAbi =
        await fetch(
            "./abi/evozx.json"
        ).then(r => r.json());

    const evozx =
        new ethers.Contract(
            CONFIG.EVOZX,
            evozxAbi,
            provider
        );

    const evozxBalance =
        await evozx.balanceOf(
            address
        );

    return {

        evoz:
        ethers.formatEther(
            evozBalance
        ),

        evozx:
        ethers.formatEther(
            evozxBalance
        )
    };
}
