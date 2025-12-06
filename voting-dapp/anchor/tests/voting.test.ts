/// <reference types="mocha" />


import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Voting } from '../target/types/voting';
import { startAnchor } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';



const IDL = require('../target/idl/voting.json');
//also need the .so file
//Need the Idl and Voting to create the context

const votingAddress = new PublicKey("6qZtvEZKeuzbnEgrkDHoGQkbNVaD4XmeZEJVX6HvTjac");

const deployContract = async() => {
  const context = await startAnchor("", [{name:"voting", programId: votingAddress}], []); //first argument is where to find the tests, Extra Programs and Accounts
  const provider = new BankrunProvider(context);

  const program = new Program<Voting>(IDL, provider);

  //pollId and done for u64, 
  await program.methods.initializePoll(new anchor.BN(1), 
  "What is your favorite programming language?", 
  "Best Programming Language", 
  new anchor.BN(0), 
  new anchor.BN(1864394651)).rpc(); //Calls the rpc to initalize the poll

  const [pollAddress] = PublicKey.findProgramAddressSync( //Finding the PDA for the poll account
    [new anchor.BN(1).toArrayLike(Buffer, "le", 8)], //Seeds
    votingAddress //Program ID
  );

  return {program, pollAddress, provider, context};
}

describe('Voting', () => {
  // Configure the client to use the local cluster.

  let context;
  let provider;
  let votingProgram: Program<Voting>;
  let pollAddress: PublicKey;

  // beforeAll(async () => {
  //   const data = await deployContract();
  //   votingProgram = data.program;
  //   provider = data.provider;
  //   context = data.context;
  //   pollAddress = data.pollAddress;
  // });

  beforeAll(async () => {
    // using test to set up local configurations
    votingProgram = anchor.workspace.Voting as Program<Voting>;
    anchor.setProvider(anchor.AnchorProvider.env());
    pollAddress = PublicKey.findProgramAddressSync( //Finding the PDA for the poll account
    [new anchor.BN(1).toArrayLike(Buffer, "le", 8)], //Seeds
    votingAddress //Program ID
    )[0];
  });


  it('Initialize Poll', async () => {

  const poll = await votingProgram.account.pollAccount.fetch(pollAddress); //Fetching the poll account data from this address
  console.log("Poll Address", poll);

  expect(poll.pollId.toNumber()).toEqual(1); //Asserting that the pollId is equal to 1
  expect(poll.pollDescritpion).toEqual("What is your favorite programming language?"); //Asserting that the pollId is equal to 1
  expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber()); //Asserting that the pollId is equal to 1
  });

  it('Initialize Candidate', async () => {

  //   //pollId and done for u64, 
    await votingProgram.methods.initializeCandidate("JavaScript", new anchor.BN(1), new anchor.BN(1)).rpc(); //Calls the rpc to initalize the candidate    
    await votingProgram.methods.initializeCandidate("Python", new anchor.BN(1), new anchor.BN(2)).rpc(); //Calls the rpc to initalize the candidate    
    const [javascriptAddress] = PublicKey.findProgramAddressSync( //Finding the PDA for the poll account, really the jvascriptaddress
    [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("JavaScript")], //Seeds
    votingAddress //Program ID
  );

  const [pythonAddress] = PublicKey.findProgramAddressSync( //Finding the PDA for the poll account, really the pythonaddress
    [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Python")], //Seeds
    votingAddress //Program ID
  );

  console.log(javascriptAddress.toBase58());
  const javascript = await votingProgram.account.candidateAccount.fetch(javascriptAddress); //Fetching the poll account data from this address
  console.log("Candidate Address", javascript);
  const python = await votingProgram.account.candidateAccount.fetch(pythonAddress); //Fetching the poll account data from this address
  console.log("Python Address", python);

  const poll = await votingProgram.account.pollAccount.fetch(pollAddress); //Fetching the poll account data from this address

  console.log("Poll after candidate init", poll);

  expect(javascript.candidateName).toEqual("JavaScript"); //Asserting that the candidate name is equal to JavaScript
  expect(javascript.voteCount.toNumber()).toEqual(0); //Asserting that the vote count is equal to 0
  expect(javascript.candidateId.toNumber()).toEqual(1); //Asserting that the candidate id is equal to 1
  });

  it("votes for candidate", async() => {
    await votingProgram.methods.voteCandidate("JavaScript", new anchor.BN(1)).rpc(); //Calls the rpc to vote for the candidate
    const [javascriptAddress] = PublicKey.findProgramAddressSync( //Finding the PDA for the poll account, really the jvascriptaddress
    [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("JavaScript")], //Seeds
    votingAddress //Program ID
  );

  const javascript = await votingProgram.account.candidateAccount.fetch(javascriptAddress); //Fetching the poll account data from this address
  console.log("Candidate Address", javascript);

  });

})
