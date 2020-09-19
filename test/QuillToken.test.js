const QuillToken = artifacts.require("./QuillToken.sol");
const BigNumber = require('bignumber.js');

const { assertRevert } = require('./utils/assertRevert');

require('chai')
	.should();
	
contract("QuillToken",([owner,account1]) => {
	let instance;
	const _tokens = BigNumber(10).pow(18).multipliedBy(10000000);
	const _name = "Quill Token"
	const _symbol = "QUILL"
	const _decimals = 18

	let lockPeriod = 1000
	const lockedAmount = BigNumber(10).pow(18).multipliedBy(100);
	let blockNumber;
	let lockTimestamp;

	const increaseTime = function(duration) {
    web3.currentProvider.sendAsync(
      {
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [duration],
        id: lockTimestamp
      },
      (err, resp) => {
        if (!err) {
          web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_mine',
            params: [],
            id: lockTimestamp + 1
          });
        }
      }
    );
  };
	const nullAddress = '0x0000000000000000000000000000000000000000';
	before(async()=>{
		instance = await QuillToken.deployed();
	})
	describe("Token Details",()=>{
		beforeEach(async()=>{
			instance = await QuillToken.new(_name,_symbol,_decimals,_tokens.toString(10));
		})

		it('has correct name',async()=>{
			const name = await instance.name();
			name.should.equal(_name);
		})

		it('has correct symbol',async()=>{
			const symbol = await instance.symbol();
			symbol.should.equal(_symbol);
		})
		it('has correct decimals',async()=>{
			const decimals = await instance.decimals();
			assert.equal(decimals,_decimals,'invalid decimlas')
		})

		it('has correct supply',async()=>{
			const totalSupply = await instance.totalSupply();
			assert.equal(totalSupply,_tokens.toString(10),"supply is not valid");
		})

		it('balance of owner',async()=>{
			const balance = await instance.balanceOf(owner);
			assert.equal(balance,_tokens.toString(10));
		})
	})

	describe('Token locking',()=>{
		beforeEach(async()=>{
			instance = await QuillToken.new(_name,_symbol,_decimals,_tokens.toString(10));
		})

		it('has right balance for owner before and after transfering tokens',async ()=>{
			let balance = await instance.balanceOf(owner);
			const totalBalance = await instance.totalBalanceOf(owner);
			const totalSupply = await instance.totalSupply();

			assert.equal(balance,_tokens.toString(10),'owner balance is not right');
			assert.equal(totalBalance,_tokens.toString(10));
			assert.equal(totalSupply,_tokens.toString(10));

			// 1 million tokens transfered to account 1
			instance.transfer(account1,BigNumber(10).pow(18).multipliedBy(1000000),{from:owner});
			
			// owner should have 9 million tokens 
			balance = await instance.balanceOf(owner);
			assert.equal(balance.toString(),BigNumber(10).pow(18).multipliedBy(9000000).toString(10));

		})

		it('reduces locked tokens from transferable balance', async()=>{
			const originalBalance = await instance.balanceOf(owner);

			await instance.lock(lockedAmount,lockPeriod);
			const balance = await instance.balanceOf(owner);
			const totalBalance = await instance.totalBalanceOf(owner);

			assert.equal(balance,originalBalance - lockedAmount);
			assert.equal(totalBalance.toString(),originalBalance.toString());

			let actualLockedAmount = await instance.tokensLocked(owner);
			assert.equal(actualLockedAmount.toString(),lockedAmount.toString());

			const transferAmount = BigNumber(10).pow(18).multipliedBy(1000);
			const {logs} = await instance.transfer(account1,transferAmount,{from:owner})

			const newSenderBalance = await instance.balanceOf(owner);
			const newReceiverBalance = await instance.balanceOf(account1);

			assert.equal(newReceiverBalance.toString(),transferAmount.toString(10));

			assert.equal(newSenderBalance.toString(),balance-transferAmount)
			assert.equal(logs.length,1)
			assert.equal(logs[0].event,'Transfer');
			assert.equal(logs[0].args.from, owner);
      		assert.equal(logs[0].args.to, account1);
      		assert.equal(logs[0].args.value.toString(),transferAmount.toString(10));
		})	

		it('reverts locing more tokens via lock function',async()=>{
			const originalBalance = await instance.balanceOf(owner);

			await instance.lock(lockedAmount,lockPeriod);
			let balance = await instance.balanceOf(owner);
			const totalBalance = await instance.totalBalanceOf(owner);

			const transferAmount = BigNumber(10).pow(18).multipliedBy(1000);
			const {logs} = await instance.transfer(account1,transferAmount,{from:owner})

			const newSenderBalance = await instance.balanceOf(owner);
			const newReceiverBalance = await instance.balanceOf(account1);

			balance = await instance.balanceOf(owner);

			await assertRevert(instance.lock(balance,lockPeriod));

		})

		it('cannot transfer tokens to null address', async function() {
      		await assertRevert(
        		instance.transfer(nullAddress, 100, {
          		from: owner
        		})
      		);
    	});

    	it('cannot transfer tokens from an address to null address', async () => {
      		await assertRevert(
        		instance.transferFrom(owner, nullAddress, 100, { from: owner })
      		);
    	});

    		})

	describe('tokens unlocking',()=>{
		// this unlocking test is still in progress

		it('can unlock tokens ',async()=>{
    		// const originalBalance = await instance.balanceOf(owner);
    		instance = await QuillToken.new(_name,_symbol,_decimals,_tokens.toString(10));
			lockPeriod = 1
			await instance.lock(lockedAmount,lockPeriod);
			
			
			const balance = await instance.balanceOf(owner);

			const tokensLocked = await instance.tokensLocked(owner);

			console.log('tokensLocked', tokensLocked.toString());
			function sleep(milliseconds) {
  				const date = Date.now();
  				let currentDate = null;
  				do {
    				currentDate = Date.now();
  					} while (currentDate - date < milliseconds);
				}
			sleep(5000);
			const unlockableTokens = await instance.tokensUnlockable(owner);
			console.log('getUnlockableTokens',unlockableTokens.toString())
			
    	})


	})
})