const QuillTokenCrowdsale = artifacts.require('QuillTokenCrowdsale');
const QuillToken = artifacts.require("./QuillToken.sol");
const BigNumber = require('bignumber.js');
require('chai')
	.should();

contract('QuillTokenCrowdsale',([wallet])=>{
	let TokenInstance;
	let CrowdsaleInstance;

	const _tokens = BigNumber(10).pow(18).multipliedBy(10000000);
	const _name = "Quill Token"
	const _symbol = "QUILL"
	const _decimals = 18

	/****
		Asuming 1 ETH = 400$
		10 ^ 18 wei = 400$
		0.0001 usd = (10 ^ 18 * 0.001)/400 = 25 * 10^11 wei
		therefore if user sends 25 * 10^11 wei to smart contract we should give 10 ^ 18 uints of our token (1 QUILL)
		but in crowd sale rate is ho many tokens the user gets for 1 wei 
		there fore for 1 wei user gets (10^18/25 * 10^11) = 4 * 10^5 uints of quillq token.
	****/
	const _rate = 400000;

	describe('Crowdsale',()=>{
		beforeEach(async()=>{
			TokenInstance = await QuillToken.new(_name,_symbol,_decimals,_tokens.toString(10));
			CrowdsaleInstance = await QuillTokenCrowdsale.new(_rate,wallet,TokenInstance.address);
		})

		it('tracks the token',async()=>{
			const token = await CrowdsaleInstance.token();
			token.should.equal(TokenInstance.address);
		})
		it('tracks the rate',async()=>{
			const rate = await CrowdsaleInstance.rate();
			assert.equal(rate,_rate);
		})

		it('tracks the wallet',async()=>{
			const _wallet = await CrowdsaleInstance.wallet();
			_wallet.should.equal(wallet);
		})
	})
})