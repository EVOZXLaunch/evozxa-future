document.addEventListener('DOMContentLoaded', () => {
    const tokenList = document.getElementById('tokenList');
    const noTokens = document.getElementById('noTokens');
    const myTokens = JSON.parse(localStorage.getItem("myTokens") || "[]");

    if (myTokens.length === 0) {
        noTokens.style.display = 'block';
        return;
    }

    myTokens.forEach((token, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${token.name}</td>
            <td>${token.symbol}</td>
            <td><code>${token.address.slice(0, 6)}...${token.address.slice(-4)}</code></td>
            <td>
                <button onclick="copyToClipboard('${token.address}')" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">Copy</button>
                <a href="verification-guide.html" style="padding: 5px 10px; font-size: 12px; background: var(--blue); color: #fff; text-decoration: none; border-radius: 8px;">Verify</a>
            </td>
        `;
        tokenList.appendChild(row);
    });
});

// Helper fungsi untuk copy address
window.copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Address copied to clipboard!");
};
