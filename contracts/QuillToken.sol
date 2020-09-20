pragma solidity ^0.5.0;

import  "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import  "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./ERC1132Modified.sol";

contract QuillToken is ERC20, ERC20Detailed,ERC1132Modified
{

	using SafeMath for uint256;

	uint public lockedIndex = 0;

	constructor(string memory _name,string memory _symbol,uint8 _decimals,uint _totalSupply)
	ERC20Detailed(_name,_symbol,_decimals)
	public
	{
		_mint(msg.sender,_totalSupply);
	}

	function lock(uint256 _amount,uint256 _months)
	public returns(bool)
	{
		require(_months == 1 || _months == 3,'Lock perios should be either 1 month or 3 months');
		uint validUntil;
		uint  monthInSeconds = 2629746;
		if(_months == 1){
			validUntil = now.add(monthInSeconds);
		}
		if(_months == 3){
			validUntil = now.add(monthInSeconds.mul(3));
		}

		require(tokensLocked(msg.sender)==0,'ALREADY_LOCKED');
		require(_amount !=0 ,'AMOUNT_ZERO');

		_burn(msg.sender,_amount);

		locked[msg.sender] = lockToken(_amount,validUntil,false,_months);
		lockedIndex = lockedIndex.add(1);

		emit Locked(msg.sender,_amount,validUntil,_months);

		return true;
	}

	function tokensLocked(address _of)
	public view returns (uint256 amount)
	{
		if(!locked[_of].claimed)
		{
			amount = locked[_of].amount;
		}
	}


	function totalBalanceOf(address _of)
    public view returns (uint256 amount)
    {
    	amount = balanceOf(_of);

    	for(uint256 i=0;i<lockedIndex;i+=1)
    	{
    		amount = amount.add(tokensLocked(_of));
    	}
    }

    function extendLock(uint256 _months)
    public returns (bool)
    {
    	require(_months == 1 || _months == 3,'The extended Period should be 1 or 3 months');
    	require(tokensLocked(msg.sender) > 0,'Not Locked');
    	uint  monthInSeconds = 2629746;
    	if(_months == 1){
    		locked[msg.sender].validity = locked[msg.sender].validity.add(monthInSeconds);
    	}
    	if(_months == 3){
    		locked[msg.sender].validity = locked[msg.sender].validity.add(monthInSeconds.mul(3));
    	}
    	emit Locked(msg.sender,locked[msg.sender].amount,locked[msg.sender].validity,locked[msg.sender].months+_months);

    	return true;
    }

    function increaseLockAmount(uint256 _amount)
    public returns (bool)
    {
    	require(tokensLocked(msg.sender) > 0,'Not Locked');

    	_burn(msg.sender,_amount);

    	locked[msg.sender].amount = locked[msg.sender].amount.add(_amount);

    	emit Locked(msg.sender,locked[msg.sender].amount,locked[msg.sender].validity,locked[msg.sender].months);

    	return true;
    }

    function tokensUnlockable(address _of)
    public view returns (uint256)
    {
    	uint amount;
    	if(locked[_of].validity <= now && !locked[_of].claimed)
    	{
    		amount = locked[_of].amount;
    	}
    	return amount;
    }

    function unlock(address _of)
    public returns (uint256 unlockableTokens)
    {
    	uint lockedTokens;
    	uint rewardTokens;
    	//Here we calculate the reward that the user gets by locking these tokens and adds it to 
    	// unlockable tokens and new tokens minted for this address will be unlockableTokens + reward

    	for(uint i=0;i<lockedIndex;i+=1)
    	{
    		lockedTokens = tokensUnlockable(_of);
    		rewardTokens = calculateReward(_of);
    		if(lockedTokens > 0)
    		{
    			unlockableTokens = unlockableTokens.add(lockedTokens.add(rewardTokens));
    			locked[_of].claimed = true;
    			emit Unlocked(_of,unlockableTokens);
    		}
    	}

    	if(unlockableTokens > 0)
    	{
    		_mint(_of,unlockableTokens);
    	}
    }

    function getUnlockableTokens(address _of)
    public view returns (uint256 unlockableTokens)
    {	
    	for(uint i=0;i<lockedIndex;i+=1)
    	{
    		unlockableTokens = unlockableTokens.add(tokensUnlockable(_of));
    	}
    }

    function getStakerReward(address _user)public view returns(uint)
    {
    	return calculateReward(_user);
    }

    function calculateReward(address _user)public view returns(uint)
    {
    	uint months = locked[_user].months;
    	uint amount = locked[_user].amount;
    	// One month in seconds = 2629746 approx (30.5 days)
    	if(amount >= 2000000 * 10 ** 18)
    	{
    		if(months == 1)
    		{
    			uint yearReward = mulDiv(amount,16,100);
    			uint monthReward = yearReward.div(12);

    			return monthReward;
    		}
    		if(months == 3)
    		{
    			uint yearReward = mulDiv(amount,20,100);
    			uint monthReward = yearReward.div(12);

    			return monthReward * 3;	
    		}
    	}else
    	{
    		if(months == 1)
    		{
    			uint yearReward = mulDiv(amount,12,100);
    			uint monthReward = yearReward.div(12);

    			return monthReward;
    		}
    		if(months == 3)
    		{
    			uint yearReward = mulDiv(amount,20,100);
    			uint monthReward = yearReward.div(12);

    			return monthReward * 3;	
    		}
    	}
    }


    //@ dev calculates x * y/z  say (y % of x) where y = percentage x = amount z = 100

    function mulDiv (uint x, uint y, uint z)
    public pure returns (uint)
    {
        (uint l, uint h) = fullMul (x, y);
        return fullDiv (l, h, z);
    }
    // @ dev helper function for mulDiv
    function fullMul (uint x, uint y)
    public pure returns (uint l, uint h)
    {
        uint xl = uint128 (x); uint xh = x >> 128;
        uint yl = uint128 (y); uint yh = y >> 128;
        uint xlyl = xl * yl; uint xlyh = xl * yh;
        uint xhyl = xh * yl; uint xhyh = xh * yh;

        uint ll = uint128 (xlyl);
        uint lh = (xlyl >> 128) + uint128 (xlyh) + uint128 (xhyl);
        uint hl = uint128 (xhyh) + (xlyh >> 128) + (xhyl >> 128);
        uint hh = (xhyh >> 128);
        l = ll + (lh << 128);
        h = (lh >> 128) + hl + (hh << 128);
    }
    // @ dev helper function for mulDiv
    function fullDiv (uint l, uint h, uint z)
    public pure returns (uint r) {
        require (h < z);
        uint zShift = mostSignificantBit (z);
        uint shiftedZ = z;
        if (zShift <= 127) zShift = 0;
        else
        {
            zShift -= 127;
            shiftedZ = (shiftedZ - 1 >> zShift) + 1;
        }
        while (h > 0)
        {
            uint lShift = mostSignificantBit (h) + 1;
            uint hShift = 256 - lShift;
            uint e = ((h << hShift) + (l >> lShift)) / shiftedZ;
            if (lShift > zShift) e <<= (lShift - zShift);
            else e >>= (zShift - lShift);
            r += e;
            (uint tl, uint th) = fullMul (e, z);
            h -= th;
            if (tl > l) h -= 1;
            l -= tl;
        }
        r += l / z;
    }
    // @dev helper function for fullDiv 
    function mostSignificantBit (uint x) public pure returns (uint r) {
        require (x > 0);
        if (x >= 2**128) { x >>= 128; r += 128; }
        if (x >= 2**64) { x >>= 64; r += 64; }
        if (x >= 2**32) { x >>= 32; r += 32; }
        if (x >= 2**16) { x >>= 16; r += 16; }
        if (x >= 2**8) { x >>= 8; r += 8; }
        if (x >= 2**4) { x >>= 4; r += 4; }
        if (x >= 2**2) { x >>= 2; r += 2; }
        if (x >= 2**1) { x >>= 1; r += 1; }
    }

	
}