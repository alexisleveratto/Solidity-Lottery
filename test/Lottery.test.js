const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require('../compile');

let lottery;
let accounts;

beforeEach( async () => {
    accounts = await web3.eth.getAccounts();

    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ data: bytecode })
        .send({ from: accounts[0], gas: '1000000' });
});

describe('Lottery Contract', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address);
    });

    it('allows one account to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0], 
            value: web3.utils.toWei('0.02', 'ether')
        });

        const players = await lottery.methods.getPlayers().call();

        assert.equal(players[0], accounts[0]);
        assert.equal(players.length, 1)
    });

    it('allows multiples accounts to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0], 
            value: web3.utils.toWei('0.02', 'ether')
        });

        await lottery.methods.enter().send({
            from: accounts[1], 
            value: web3.utils.toWei('0.02', 'ether')
        });

        await lottery.methods.enter().send({
            from: accounts[2], 
            value: web3.utils.toWei('0.02', 'ether')
        });

        const players = await lottery.methods.getPlayers().call();

        assert.equal(players[0], accounts[0]);
        assert.equal(players[1], accounts[1]);
        assert.equal(players[2], accounts[2]);
        assert.equal(players.length, 3)
    });

    it('It requires a minimum amount of ether to enter', async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: 200
            });
            assert(false);
        } catch (error) {
            assert(error);
        }  
    });

    it('allows only to the manager to pick a winner', async () => {
        try {
            await lottery.methods.pickWinner().send({
                from: accounts[1]
            });
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    it('sends money to the winner and resets the players', async () => {
        const entryAmount = web3.utils.toWei('3', 'ether');
        await lottery.methods.enter().send({
            from: accounts[1],
            value: entryAmount
        })
        
        const beforeWinning = await web3.eth.getBalance(accounts[1]);
        const contractBeforeWinning = await web3.eth.getBalance(lottery.options.address);

        await lottery.methods.pickWinner().send({
            from: accounts[0]
        });

        const afterWinning = await web3.eth.getBalance(accounts[1]);
        const players = await lottery.methods.getPlayers().call();

        
        const difference = afterWinning - beforeWinning
        const contrafAfterWinning = await web3.eth.getBalance(lottery.options.address);

        assert(difference > web3.utils.toWei('1.8', 'ether'));
        assert.equal(players.length, 0,  'Players should be reset');
        assert.equal(
            contrafAfterWinning,
            web3.utils.toBN(contractBeforeWinning).sub(web3.utils.toBN(entryAmount)),
            'Contract balance should decrease by the entry amount'
        );

    });

});