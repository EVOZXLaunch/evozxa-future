document.addEventListener('DOMContentLoaded', () => {
    const tokenList = document.getElementById('tokenList');
    const noTokens = document.getElementById('noTokens');
    
    // Ambil data dengan aman
    let myTokens = [];
    try {
        myTokens = JSON.parse(localStorage.getItem("myTokens") || "[]");
    } catch (e) {
        console.error("Gagal memuat data token:", e);
    }

    if (!myTokens || myTokens.length === 0) {
        if (noTokens) noTokens.style.display = 'block';
        return;
    }

    // Gunakan DocumentFragment untuk performa lebih baik
    const fragment = document.createDocumentFragment();

    myTokens.forEach((token) => {
        const row = document.createElement('tr');
        // Sanitasi input dasar agar aman
        const name = token.name || "Unknown";
        const symbol = token.symbol || "---";
        const addr = token.address || "";
        const shortAddr = addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "Invalid Address";

        row.innerHTML = `
            <td>${name}</td>
            <td>${symbol}</td>
            <td><code>${shortAddr}</code></td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-copy" onclick="copyToClipboard('${addr}')">Copy</button>
                    <a href="verification-guide.html" class="btn-verify">Verify</a>
                </div>
            </td>
        `;
        fragment.appendChild(row);
    });

    if (tokenList) tokenList.appendChild(fragment);
});

// Helper fungsi yang lebih modern
window.copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        // Feedback visual (opsional: bisa tambahkan toast/notifikasi)
        console.log("Alamat disalin!");
    } catch (err) {
        console.error("Gagal menyalin:", err);
    }
};
