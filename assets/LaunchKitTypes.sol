// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library LaunchKitTypes {

struct TokenConfig {

    // =====================================================
    // BASIC
    // =====================================================

    string name;
    string symbol;

    uint256 supply;

    address owner;

    // =====================================================
    // DEPLOYMENT INFO
    // =====================================================

    uint256 chainId;

    uint16 launchKitVersion;

    // =====================================================
    // CORE FEATURES
    // =====================================================

    bool burnable;

    bool mintable;

    bool ownershipEnabled;

    // =====================================================
    // METADATA
    // =====================================================

    string website;

    string telegram;

    string twitter;

    string logoURI;

    // =====================================================
    // SECURITY
    // =====================================================

    bool maxWalletEnabled;

    uint8 maxWalletPercent;

    bool maxTxEnabled;

    uint8 maxTxPercent;

    bool tradingControlEnabled;

    bool tradingEnabled;

    // =====================================================
    // TOKENOMICS
    // =====================================================

    bool buyTaxEnabled;

    uint8 buyTax;

    bool sellTaxEnabled;

    uint8 sellTax;

    uint8 burnTaxShare;

    address marketingWallet;

    address developmentWallet;
}

}