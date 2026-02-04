// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title YieldBallToken (YBT)
 * @notice Simple ERC-20 demo token for YieldBall hackathon
 * @dev Minimal implementation - NOT for production use
 */
contract YieldBallToken {
    string public constant name = "YieldBall Token";
    string public constant symbol = "YBT";
    uint8 public constant decimals = 18;
    
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    address public owner;
    address public gameContract;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event GameContractUpdated(address indexed oldGame, address indexed newGame);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "YBT: caller is not owner");
        _;
    }
    
    modifier onlyGameOrOwner() {
        require(
            msg.sender == owner || msg.sender == gameContract,
            "YBT: caller is not owner or game"
        );
        _;
    }
    
    constructor() {
        owner = msg.sender;
        
        // Mint initial supply to deployer (1,000,000 YBT)
        uint256 initialSupply = 1_000_000 * 10**decimals;
        totalSupply = initialSupply;
        balanceOf[msg.sender] = initialSupply;
        
        emit Transfer(address(0), msg.sender, initialSupply);
    }
    
    /**
     * @notice Set the game contract address that can reward players
     * @param _gameContract Address of the YieldBallGame contract
     */
    function setGameContract(address _gameContract) external onlyOwner {
        require(_gameContract != address(0), "YBT: zero address");
        emit GameContractUpdated(gameContract, _gameContract);
        gameContract = _gameContract;
    }
    
    /**
     * @notice Transfer tokens to a recipient
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function transfer(address to, uint256 amount) external returns (bool) {
        require(to != address(0), "YBT: transfer to zero address");
        require(balanceOf[msg.sender] >= amount, "YBT: insufficient balance");
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    /**
     * @notice Approve spender to transfer tokens
     * @param spender Address allowed to spend
     * @param amount Amount allowed
     */
    function approve(address spender, uint256 amount) external returns (bool) {
        require(spender != address(0), "YBT: approve to zero address");
        
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    /**
     * @notice Transfer tokens from one address to another
     * @param from Source address
     * @param to Destination address
     * @param amount Amount to transfer
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(from != address(0), "YBT: transfer from zero address");
        require(to != address(0), "YBT: transfer to zero address");
        require(balanceOf[from] >= amount, "YBT: insufficient balance");
        require(allowance[from][msg.sender] >= amount, "YBT: insufficient allowance");
        
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    /**
     * @notice Mint new tokens (owner or game only)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyGameOrOwner {
        require(to != address(0), "YBT: mint to zero address");
        
        totalSupply += amount;
        balanceOf[to] += amount;
        
        emit Transfer(address(0), to, amount);
    }
}
