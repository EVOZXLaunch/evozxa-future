// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./LaunchKitTypes.sol";

contract LaunchKitToken is ERC20 {

    // =====================================================
    // DEPLOYMENT INFO
    // =====================================================

    uint256 public deployedChainId;

    uint16 public launchKitVersion;

    // =====================================================
    // OWNERSHIP
    // =====================================================

    address public owner;

    bool public ownershipEnabled;

    // =====================================================
    // CORE FEATURES
    // =====================================================

    bool public burnable;

    bool public mintable;

    bool public mintUsed;

    // =====================================================
    // METADATA
    // =====================================================

    string public website;

    string public telegram;

    string public twitter;

    string public logoURI;

    // =====================================================
    // SECURITY
    // =====================================================

    bool public maxWalletEnabled;

    uint8 public maxWalletPercent;

    bool public maxTxEnabled;

    uint8 public maxTxPercent;

    bool public tradingControlEnabled;

    bool public tradingEnabled;

    // =====================================================
    // TOKENOMICS
    // =====================================================

    bool public buyTaxEnabled;

    uint8 public buyTax;

    bool public sellTaxEnabled;

    uint8 public sellTax;

    uint8 public burnTaxShare;

    address public marketingWallet;

    address public developmentWallet;

    // =====================================================
    // DEX
    // =====================================================

    address public dexPair;

    bool public pairInitialized;

    // =====================================================
    // EXCLUDED
    // =====================================================

    mapping(address => bool)
        public isExcluded;

    // =====================================================
    // EVENTS
    // =====================================================

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    event TradingEnabled();

    event TradingDisabled();

    event DexPairSet(
        address indexed pair
    );

    event ExcludedUpdated(
        address indexed account,
        bool excluded
    );

    event MetadataUpdated(
        string website,
        string telegram,
        string twitter,
        string logoURI
    );

    event Mint(
        address indexed to,
        uint256 amount
    );

    event Burn(
        address indexed from,
        uint256 amount
    );

    // =====================================================
    // MODIFIER
    // =====================================================

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Not owner"
        );
        _;
    }

    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    constructor(
        LaunchKitTypes.TokenConfig memory config
    )
        ERC20(
            config.name,
            config.symbol
        )
    {
        require(
            config.owner != address(0),
            "Invalid owner"
        );

        require(
            config.buyTax <= 10,
            "Buy tax too high"
        );

        require(
            config.sellTax <= 10,
            "Sell tax too high"
        );

        require(
            config.burnTaxShare <= 100,
            "Invalid burn share"
        );
        
        if (
    config.buyTaxEnabled ||
    config.sellTaxEnabled
) {
    require(
        config.burnTaxShare > 0 ||
        config.marketingWallet != address(0) ||
        config.developmentWallet != address(0),
        "Tax receiver missing"
    );
}

        if (
            config.maxWalletEnabled
        ) {
            require(
                config.maxWalletPercent > 0 &&
                config.maxWalletPercent <= 100,
                "Invalid max wallet"
            );
        }

        if (
            config.maxTxEnabled
        ) {
            require(
                config.maxTxPercent > 0 &&
                config.maxTxPercent <= 100,
                "Invalid max tx"
            );
        }

        deployedChainId =
            block.chainid;

        launchKitVersion =
            config.launchKitVersion;

        owner =
            config.owner;

        ownershipEnabled =
            config.ownershipEnabled;

        burnable =
            config.burnable;

        mintable =
            config.mintable;

        website =
            config.website;

        telegram =
            config.telegram;

        twitter =
            config.twitter;

        logoURI =
            config.logoURI;

        maxWalletEnabled =
            config.maxWalletEnabled;

        maxWalletPercent =
            config.maxWalletPercent;

        maxTxEnabled =
            config.maxTxEnabled;

        maxTxPercent =
            config.maxTxPercent;

        tradingControlEnabled =
            config.tradingControlEnabled;

        tradingEnabled =
            config.tradingEnabled;

        buyTaxEnabled =
            config.buyTaxEnabled;

        buyTax =
            config.buyTax;

        sellTaxEnabled =
            config.sellTaxEnabled;

        sellTax =
            config.sellTax;

        burnTaxShare =
            config.burnTaxShare;

        marketingWallet =
            config.marketingWallet;

        developmentWallet =
            config.developmentWallet;
    
        _mint(
            config.owner,
            config.supply * 1e18
        );

        isExcluded[
            config.owner
        ] = true;

        if (
            marketingWallet != address(0)
        ) {
            isExcluded[
                marketingWallet
            ] = true;
        }

        if (
            developmentWallet != address(0)
        ) {
            isExcluded[
                developmentWallet
            ] = true;
        }
    }
    
    // =====================================================
    // CHAIN INFO
    // =====================================================

    function getChainInfo()
        external
        view
        returns (
            uint256
        )
    {
        return deployedChainId;
    }

    // =====================================================
    // OWNERSHIP
    // =====================================================

    function transferOwnership(
        address newOwner
    )
        external
        onlyOwner
    {
        require(
            ownershipEnabled,
            "Ownership disabled"
        );

        require(
            newOwner != address(0),
            "Invalid owner"
        );

        isExcluded[
            newOwner
        ] = true;

        address oldOwner =
            owner;

        owner =
            newOwner;

        emit OwnershipTransferred(
            oldOwner,
            newOwner
        );
    }

    function renounceOwnership()
        external
        onlyOwner
    {
        require(
            ownershipEnabled,
            "Ownership disabled"
        );

        address oldOwner =
            owner;

        owner =
            address(0);

        emit OwnershipTransferred(
            oldOwner,
            address(0)
        );
    }

    // =====================================================
    // METADATA
    // =====================================================

    function getMetadata()
        external
        view
        returns (
            string memory,
            string memory,
            string memory,
            string memory
        )
    {
        return (
            website,
            telegram,
            twitter,
            logoURI
        );
    }

    function updateMetadata(
        string calldata _website,
        string calldata _telegram,
        string calldata _twitter,
        string calldata _logoURI
    )
        external
        onlyOwner
    {
        website =
            _website;

        telegram =
            _telegram;

        twitter =
            _twitter;

        logoURI =
            _logoURI;

        emit MetadataUpdated(
            _website,
            _telegram,
            _twitter,
            _logoURI
        );
    }

    // =====================================================
    // ONE TIME MINT
    // =====================================================

    function mint(
        address to,
        uint256 amount
    )
        external
        onlyOwner
    {
        require(
            mintable,
            "Mint disabled"
        );

        require(
            !mintUsed,
            "Mint already used"
        );
        
        require(
    amount > 0,
    "Invalid amount"
);
        
        require(
    to != address(0),
    "Invalid recipient"
);

        mintUsed = true;

        _mint(
            to,
            amount * 1e18
        );

        emit Mint(
            to,
            amount
        );
    }

    // =====================================================
    // BURN
    // =====================================================

    function burn(
        uint256 amount
    )
        external
    {
        require(
            burnable,
            "Burn disabled"
        );

        _burn(
            msg.sender,
            amount * 1e18
        );

        emit Burn(
            msg.sender,
            amount
        );
    }

    // =====================================================
    // EXCLUSION MANAGEMENT
    // =====================================================

    function setExcluded(
        address account,
        bool excluded
    )
        external
        onlyOwner
    {
        isExcluded[
            account
        ] = excluded;

        emit ExcludedUpdated(
            account,
            excluded
        );
    }
    
    // =====================================================
    // TRADING CONTROL
    // =====================================================

    function enableTrading()
        external
        onlyOwner
    {
        require(
            tradingControlEnabled,
            "Trading control disabled"
        );

        tradingEnabled = true;

        emit TradingEnabled();
    }

    function disableTrading()
        external
        onlyOwner
    {
        require(
            tradingControlEnabled,
            "Trading control disabled"
        );

        tradingEnabled = false;

        emit TradingDisabled();
    }

    // =====================================================
    // DEX PAIR
    // =====================================================

    function setDexPair(
        address pair
    )
        external
        onlyOwner
    {
        require(
            pair != address(0),
            "Invalid pair"
        );

        require(
            !pairInitialized,
            "Pair already set"
        );

        dexPair = pair;
        pairInitialized = true;

        emit DexPairSet(
            pair
        );
    }

    // =====================================================
    // INTERNAL VALIDATION
    // =====================================================

    function _checkTrading(
        address from,
        address to
    )
        internal
        view
    {
        if (
            !tradingControlEnabled
        ) {
            return;
        }

        if (
            tradingEnabled
        ) {
            return;
        }

        if (
            isExcluded[from]
            ||
            isExcluded[to]
        ) {
            return;
        }

        revert(
            "Trading disabled"
        );
    }

    function _checkMaxWallet(
        address to,
        uint256 amount
    )
        internal
        view
    {
        if (
            !maxWalletEnabled
        ) {
            return;
        }

        if (
            isExcluded[to]
        ) {
            return;
        }

        uint256 limit =
            (
                totalSupply()
                *
                maxWalletPercent
            ) / 100;

        require(
            balanceOf(to)
                +
            amount
                <=
            limit,
            "Max wallet exceeded"
        );
    }

    function _checkMaxTx(
        address from,
        address to,
        uint256 amount
    )
        internal
        view
    {
        if (
            !maxTxEnabled
        ) {
            return;
        }

        if (
            isExcluded[from]
            ||
            isExcluded[to]
        ) {
            return;
        }

        uint256 limit =
            (
                totalSupply()
                *
                maxTxPercent
            ) / 100;

        require(
            amount <= limit,
            "Max tx exceeded"
        );
    }
    
    // =====================================================
    // TRANSFER OVERRIDE
    // =====================================================

    function _update(
        address from,
        address to,
        uint256 amount
    )
        internal
        virtual
        override
    {
        if (
            from != address(0)
            &&
            to != address(0)
        ) {
            _checkTrading(
                from,
                to
            );

            _checkMaxWallet(
                to,
                amount
            );

            _checkMaxTx(
                from,
                to,
                amount
            );

            // ==========================================
            // BUY
            // ==========================================

            if (
                dexPair != address(0)
                &&
                from == dexPair
                &&
                !isExcluded[to]
                &&
                buyTaxEnabled
                &&
                buyTax > 0
            ) {
                uint256 taxAmount =
                    (
                        amount *
                        buyTax
                    ) / 100;

                uint256 transferAmount =
                    amount -
                    taxAmount;

                if (
                    taxAmount > 0
                ) {
                    _distributeTax(
                        from,
                        taxAmount
                    );
                }

                super._update(
                    from,
                    to,
                    transferAmount
                );

                return;
            }

            // ==========================================
            // SELL
            // ==========================================

            if (
                dexPair != address(0)
                &&
                to == dexPair
                &&
                !isExcluded[from]
                &&
                sellTaxEnabled
                &&
                sellTax > 0
            ) {
                uint256 taxAmount =
                    (
                        amount *
                        sellTax
                    ) / 100;

                uint256 transferAmount =
                    amount -
                    taxAmount;

                if (
                    taxAmount > 0
                ) {
                    _distributeTax(
                        from,
                        taxAmount
                    );
                }

                super._update(
                    from,
                    to,
                    transferAmount
                );

                return;
            }
        }

        super._update(
            from,
            to,
            amount
        );
    }

    // =====================================================
    // TAX DISTRIBUTION
    // =====================================================

    function _distributeTax(
        address source,
        uint256 taxAmount
    )
        internal
    {
        if (
            taxAmount == 0
        ) {
            return;
        }

        uint256 burnAmount =
            (
                taxAmount *
                burnTaxShare
            ) / 100;

        uint256 remainingTax =
            taxAmount -
            burnAmount;

        // ==========================================
        // BURN SHARE
        // ==========================================

        if (
            burnAmount > 0
        ) {
            super._update(
                source,
                address(0),
                burnAmount
            );
        }

        if (
            remainingTax == 0
        ) {
            return;
        }

        // ==========================================
        // MARKETING + DEVELOPMENT
        // ==========================================

        uint256 marketingAmount =
            remainingTax / 2;

        uint256 developmentAmount =
            remainingTax -
            marketingAmount;

        if (
            marketingAmount > 0
            &&
            marketingWallet != address(0)
        ) {
            super._update(
                source,
                marketingWallet,
                marketingAmount
            );
        }

        if (
            developmentAmount > 0
            &&
            developmentWallet != address(0)
        ) {
            super._update(
                source,
                developmentWallet,
                developmentAmount
            );
        }
    }

}