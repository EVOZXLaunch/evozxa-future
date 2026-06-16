<p align="center">
  <img src="images/logo.png" width="240" alt="EVOZXa FUTURE Logo">
</p>

<h1 align="center" style="margin-top: -10px;">EVOZXa FUTURE</h1>

<p align="center">
  <a href="https://evozscan.com">
    <img src="https://img.shields.io/badge/Network-EVOZ%20Mainnet-2563eb?style=for-the-badge&logo=ethereum&logoColor=white" alt="Network">
  </a>
  <a href="https://docs.ethers.org/">
    <img src="https://img.shields.io/badge/Ethers.js-v6.13.5-ffd700?style=for-the-badge&logo=javascript&logoColor=black" alt="Ethers.js">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
  </a>
</p>

<p align="center">
  A decentralized token launchpad for the EVOZ Network.
</p>


EVOZXa FUTURE provides a streamlined interface for creating, deploying, and managing customizable EVM-compatible tokens through a web-based application. The platform integrates token deployment, metadata management, wallet connectivity, and smart contract verification into a unified workflow.

---

Overview

EVOZXa FUTURE is designed to simplify token creation on the EVOZ blockchain while maintaining flexibility for developers, startups, communities, and blockchain projects.

The platform enables users to deploy configurable token contracts without modifying Solidity source code directly.

---

Features

Token Deployment

- Deploy EVM-compatible tokens
- Custom token name and symbol
- Configurable total supply
- Factory-based deployment architecture

Advanced Token Configuration

- Mintable functionality
- Burnable functionality
- Ownership control
- Configurable deployment parameters

Tokenomics & Security Controls

- Maximum transaction limits
- Maximum wallet limits
- Buy and sell tax configuration
- Burn tax allocation
- Marketing wallet allocation
- Development wallet allocation

Project Metadata

- Website
- Telegram
- X (Twitter)
- Discord
- Project logo support

Wallet Integration

- EVM wallet connectivity
- Real-time EVOZ balance monitoring
- Real-time EVOZX balance monitoring

Smart Contract Verification

- Verification guide included
- Standard Solidity JSON input support
- Explorer verification workflow

---

Technology Stack

Frontend

- HTML5
- CSS3
- Vanilla JavaScript (ES6)

Blockchain

- Solidity
- Ethers.js v6
- EVOZ Mainnet

User Interface

- Responsive Design
- Accordion-Based Configuration Layout
- Modern Dark Theme

---

Repository Structure

evozxa-future-main/
├── README.md
├── LICENSE
├── .gitignore
├── index.html
├── verification-guide.html
├── abi/
├── assets/
├── css/
├── images/
└── js/

---

Smart Contracts

Contract| Description
EvozXUltimateFactory.sol| Main deployment factory
LaunchKitToken.sol| Token template contract
LaunchKitTypes.sol| Shared structures and type definitions

---

Deployment Flow

1. Connect Wallet
2. Configure Token Parameters
3. Add Project Metadata
4. Deploy Through Factory Contract
5. Verify Contract
6. Manage Token On-Chain

---

Security Notice

Always verify contract addresses before interacting with deployed contracts.

Never share private keys, seed phrases, or wallet credentials.

All blockchain transactions are irreversible once confirmed on-chain.

---

Contributing

Contributions, suggestions, and improvements are welcome.

Please open an issue or submit a pull request for proposed changes.

---

License

This project is licensed under the MIT License.

Copyright © 2026 EVOZXLabs.
