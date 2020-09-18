const QuillToken = artifacts.require("./QuillToken.sol");
const BigNumber = require('bignumber.js');

require('chai')
	.should();
	
contract("QuillToken",([owner]) => {
	let instance;
	const _tokens = BigNumber(10).pow(18).multipliedBy(10000000);
	const _name = "Quill Token"
	const _symbol = "QUILL"
	const _decimals = 18

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
})