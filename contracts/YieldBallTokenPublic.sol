// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title YieldBallToken - Public Mint Version
 * @notice HACKATHON DEMO ONLY - Anyone can mint (NOT for production!)
 * @dev Simple ERC-20 with public mint for Base Sepolia testnet demo
 */
contract YieldBallTokenPublic {
    string public constant name = "YieldBall Token";
    string public constant symbol = "YBT";
    uint8 public constant decimals = 18;
    
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    // Events - REQUIRED for MetaMask to detect transfers
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        // Mint initial supply to deployer (optional)
        uint256 initialSupply = 1_000_000 * 10**decimals;
        totalSupply = initialSupply;
        balanceOf[msg.sender] = initialSupply;
        emit Transfer(address(0), msg.sender, initialSupply);
    }
    
    /**
     * @notice PUBLIC MINT - Anyone can mint tokens (DEMO ONLY!)
     * @dev For hackathon demo - allows frontend to mint directly
     * @param to Recipient address
     * @param amount Amount to mint (with 18 decimals)
     */
    function mint(address to, uint256 amount) external returns (bool) {
        require(to != address(0), "YBT: mint to zero address");
        require(amount > 0, "YBT: amount must be > 0");
        
        totalSupply += amount;
        balanceOf[to] += amount;
        
        emit Transfer(address(0), to, amount);
        return true;
    }
    
    /**
     * @notice Transfer tokens
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
     * @notice Approve spender
     */
    function approve(address spender, uint256 amount) external returns (bool) {
        require(spender != address(0), "YBT: approve to zero address");
        
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    /**
     * @notice Transfer from (with approval)
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(from != address(0), "YBT: from zero address");
        require(to != address(0), "YBT: to zero address");
        require(balanceOf[from] >= amount, "YBT: insufficient balance");
        require(allowance[from][msg.sender] >= amount, "YBT: insufficient allowance");
        
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
}
