import "./App.css";
import React from "react";
import web3 from "./Web3";
import lottery from "./lottery";

class App extends React.Component {
  
  state = { 
    manager: "",
    players: [],
    balance: "",
    value: "",
    message: ""
  };

  async componentDidMount() {
    const manager = await lottery.methods.manager().call();
     const players = await lottery.methods.getPlayers().call();
     const balance = await web3.eth.getBalance(lottery.options.address);

    this.setState({ manager, players, balance });
  }

  onSubmit = async (event) => {
    event.preventDefault();

    const accounts = await web3.eth.getAccounts();

    this.setState({
      message: 'Waiting for transaction success...'
    })

    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei(this.state.value.toString(), 'ether')
    })

    this.setState({
      message: 'You have entered!'
    })
  }

  onClick = async () => {

    const accounts = await web3.eth.getAccounts();
    this.setState({
      message: 'Waiting for transaction success...'
    });
    await lottery.methods.pickWinner().send({
      from: accounts[0]
    });
    this.setState({
      message: 'We have a secret winner!'
    });
    
  }
  
  render() {
    return (
      <div>
        <h1>Lottery Contract</h1>
        <p>
          This contract is managed by {this.state.manager}.
          <br />
          There is {this.state.players.length} players entered, competing to win {web3.utils.fromWei(this.state.balance.toString(), 'ether')} ether!
        </p>

        <hr />
        <form onSubmit={this.onSubmit}>
          <h4> Filling lucky?</h4>
          <div>
            <label>Amount of ether to enter: </label>
            <input 
              value = { this.state.value }
              onChange={ (event) => this.setState({ value: event.target.value }) }
            />
            <button> Enter </button>
          </div>
        </form>

        <hr />
        <h4>Close lottery</h4>
        <button onClick={this.onClick}> Pick a winner </button>
        <hr />

        <h1> { this.state.message } </h1>
        
      </div>
    );
  }
}
export default App;
