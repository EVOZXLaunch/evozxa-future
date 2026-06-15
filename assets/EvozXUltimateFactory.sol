// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./LaunchKitToken.sol";
import "./LaunchKitTypes.sol";

interface IERC20 {

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    function transfer(
        address to,
        uint256 amount
    ) external returns (bool);

    function balanceOf(
        address account
    ) external view returns (uint256);
}

contract EVOZXUltimateFactory {

    // =====================================================
    // FACTORY INFO
    // =====================================================

    string public constant FACTORY_NAME =
        "EVOZX Ultimate Factory";

    string public constant VERSION =
        "2.0.0";

    uint16 public constant
        LAUNCHKIT_VERSION = 200;

    // =====================================================
    // EVOZX
    // =====================================================

    address public owner;

    IERC20 public evozx;

    address public treasury;

    address public constant
        DEAD_WALLET =
        0x000000000000000000000000000000000000dEaD;

    uint256 public feeMultiplier = 100;
    
    uint256 public constant
    EVOZX_DECIMALS = 1e18;

    // =====================================================
    // FEES
    // =====================================================

    uint256 public constant BASE_FEE = 10;

    uint256 public constant BURNABLE_FEE = 5;

    uint256 public constant MINTABLE_FEE = 20;

    uint256 public constant OWNERSHIP_FEE = 5;

    uint256 public constant MAX_WALLET_FEE = 5;

    uint256 public constant MAX_TX_FEE = 5;

    uint256 public constant TRADING_CONTROL_FEE = 10;

    uint256 public constant BUY_TAX_FEE = 20;

    uint256 public constant SELL_TAX_FEE = 20;

    uint256 public constant WEBSITE_FEE = 1;

    uint256 public constant TELEGRAM_FEE = 1;

    uint256 public constant TWITTER_FEE = 1;

    uint256 public constant LOGO_FEE = 2;

    // =====================================================
    // TOKEN INFO
    // =====================================================

    struct TokenInfo {

        address token;

        address creator;

        string name;

        string symbol;

        uint256 supply;

        uint256 createdAt;

        uint256 chainId;

        bool active;
    }

    // =====================================================
    // STORAGE
    // =====================================================

    TokenInfo[] public allTokens;

    mapping(address => address[])
        public creatorTokens;

    mapping(address => bool)
        public isFactoryToken;

    mapping(address => TokenInfo)
        public tokenInfo;

    mapping(string => bool)
        public symbolExists;

    mapping(address => uint256)
        public creatorTokenCount;

    // =====================================================
    // EVENTS
    // =====================================================

    event TokenCreated(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        uint256 supply,
        uint256 chainId
    );

    event TreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury
    );

    event FeeMultiplierUpdated(
        uint256 oldMultiplier,
        uint256 newMultiplier
    );

    event OwnershipTransferred(
        address indexed oldOwner,
        address indexed newOwner
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

    constructor()
{
    owner = msg.sender;

    evozx =
        IERC20(
            0x032a962F62Fc1cbc15B19767Aa138deA3B454B74
        );

    treasury =
        0x50Cd30Ff7f0fbBD9d0FDe1F60DE8c52D6F390c5C;
}
    
    // =====================================================
    // DEPLOYMENT FEE ENGINE
    // =====================================================

    function getDeploymentFee(
        LaunchKitTypes.TokenConfig calldata config
    )
        public
        view
        returns (
            uint256
        )
    {
        uint256 fee =
            BASE_FEE;

        if (
            config.burnable
        ) {
            fee +=
                BURNABLE_FEE;
        }

        if (
            config.mintable
        ) {
            fee +=
                MINTABLE_FEE;
        }

        if (
            config.ownershipEnabled
        ) {
            fee +=
                OWNERSHIP_FEE;
        }

        if (
            config.maxWalletEnabled
        ) {
            fee +=
                MAX_WALLET_FEE;
        }

        if (
            config.maxTxEnabled
        ) {
            fee +=
                MAX_TX_FEE;
        }

        if (
            config.tradingControlEnabled
        ) {
            fee +=
                TRADING_CONTROL_FEE;
        }

        if (
            config.buyTaxEnabled
        ) {
            fee +=
                BUY_TAX_FEE;
        }

        if (
            config.sellTaxEnabled
        ) {
            fee +=
                SELL_TAX_FEE;
        }

        if (
            bytes(
                config.website
            ).length > 0
        ) {
            fee +=
                WEBSITE_FEE;
        }

        if (
            bytes(
                config.telegram
            ).length > 0
        ) {
            fee +=
                TELEGRAM_FEE;
        }

        if (
            bytes(
                config.twitter
            ).length > 0
        ) {
            fee +=
                TWITTER_FEE;
        }

        if (
            bytes(
                config.logoURI
            ).length > 0
        ) {
            fee +=
                LOGO_FEE;
        }

        return
    (
        (fee *
            feeMultiplier)
            / 100
    ) * EVOZX_DECIMALS;
    }

    // =====================================================
    // FEE COLLECTION
    // =====================================================

    function _collectFee(
        uint256 feeAmount
    )
        internal
    {
        require(
            feeAmount > 0,
            "Invalid fee"
        );

        uint256 burnAmount =
            (feeAmount * 30)
                / 100;

        uint256 treasuryAmount =
            feeAmount -
            burnAmount;

        require(
            evozx.transferFrom(
                msg.sender,
                DEAD_WALLET,
                burnAmount
            ),
            "Burn transfer failed"
        );

        require(
            evozx.transferFrom(
                msg.sender,
                treasury,
                treasuryAmount
            ),
            "Treasury transfer failed"
        );
    }

    // =====================================================
    // VALIDATION
    // =====================================================

    function _validateConfig(
        LaunchKitTypes.TokenConfig
            calldata config
    )
        internal
        view
    {
        require(
            bytes(
                config.name
            ).length >= 2,
            "Invalid name"
        );

        require(
            bytes(
                config.symbol
            ).length >= 2,
            "Invalid symbol"
        );

        require(
            bytes(
                config.symbol
            ).length <= 12,
            "Symbol too long"
        );

        require(
            !symbolExists[
                config.symbol
            ],
            "Symbol already exists"
        );

        require(
            config.supply > 0,
            "Invalid supply"
        );

        require(
            config.supply
                <=
            1_000_000_000_000,
            "Supply too large"
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
    }

    // =====================================================
    // TOKEN DEPLOYMENT
    // =====================================================

    function createToken(
        LaunchKitTypes.TokenConfig
            calldata config
    )
        external
    {
        _validateConfig(
            config
        );

        uint256 deployFee =
            getDeploymentFee(
                config
            );

        _collectFee(
            deployFee
        );

        LaunchKitTypes.TokenConfig
            memory tokenConfig =
                config;

        tokenConfig.owner =
            msg.sender;

        tokenConfig.chainId =
            block.chainid;

        tokenConfig.launchKitVersion =
            LAUNCHKIT_VERSION;

        LaunchKitToken token =
            new LaunchKitToken(
                tokenConfig
            );

        address tokenAddress =
            address(token);

        TokenInfo memory info =
            TokenInfo({
                token:
                    tokenAddress,

                creator:
                    msg.sender,

                name:
                    tokenConfig.name,

                symbol:
                    tokenConfig.symbol,

                supply:
                    tokenConfig.supply,

                createdAt:
                    block.timestamp,

                chainId:
                    block.chainid,

                active:
                    true
            });

        allTokens.push(
            info
        );

        tokenInfo[
            tokenAddress
        ] = info;

        creatorTokens[
            msg.sender
        ].push(
            tokenAddress
        );

        creatorTokenCount[
            msg.sender
        ]++;

        isFactoryToken[
            tokenAddress
        ] = true;

        symbolExists[
            tokenConfig.symbol
        ] = true;

        emit TokenCreated(
            tokenAddress,
            msg.sender,
            tokenConfig.name,
            tokenConfig.symbol,
            tokenConfig.supply,
            block.chainid
        );
    }
    
    // =====================================================
    // OWNER FUNCTIONS
    // =====================================================

    function setTreasury(
        address newTreasury
    )
        external
        onlyOwner
    {
        require(
            newTreasury != address(0),
            "Invalid treasury"
        );

        address oldTreasury =
            treasury;

        treasury =
            newTreasury;

        emit TreasuryUpdated(
            oldTreasury,
            newTreasury
        );
    }

    function setFeeMultiplier(
        uint256 newMultiplier
    )
        external
        onlyOwner
    {
        require(
            newMultiplier > 0,
            "Invalid multiplier"
        );

        uint256 oldMultiplier =
            feeMultiplier;

        feeMultiplier =
            newMultiplier;

        emit FeeMultiplierUpdated(
            oldMultiplier,
            newMultiplier
        );
    }

    function transferOwnership(
        address newOwner
    )
        external
        onlyOwner
    {
        require(
            newOwner != address(0),
            "Invalid owner"
        );

        address oldOwner =
            owner;

        owner =
            newOwner;

        emit OwnershipTransferred(
            oldOwner,
            newOwner
        );
    }

    // =====================================================
    // GETTERS
    // =====================================================

    function totalTokens()
        external
        view
        returns (
            uint256
        )
    {
        return
            allTokens.length;
    }

    function getAllTokens()
        external
        view
        returns (
            TokenInfo[] memory
        )
    {
        return
            allTokens;
    }

    function getTokensByCreator(
        address creator
    )
        external
        view
        returns (
            address[] memory
        )
    {
        return
            creatorTokens[
                creator
            ];
    }

    function getToken(
        uint256 index
    )
        external
        view
        returns (
            TokenInfo memory
        )
    {
        require(
            index <
            allTokens.length,
            "Invalid index"
        );

        return
            allTokens[index];
    }

    function isTokenFromFactory(
        address token
    )
        external
        view
        returns (
            bool
        )
    {
        return
            isFactoryToken[
                token
            ];
    }
    
    function rescueToken(
    address token,
    uint256 amount
)
    external
    onlyOwner
{
    require(
        IERC20(token).transfer(
            owner,
            amount
        ),
        "Transfer failed"
    );
}
}