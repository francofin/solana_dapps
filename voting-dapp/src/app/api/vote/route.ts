import {ActionGetResponse, LinkedAction, ACTIONS_CORS_HEADERS, ActionPostRequest, createPostResponse} from "@solana/actions";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {Voting} from "../../../../anchor/target/types/voting";
import { Program } from "@coral-xyz/anchor";
import * as anchor from '@coral-xyz/anchor'

const IDL = require('../../../../anchor/target/idl/voting.json');

export const OPTIONS = GET; //essentially limits it to just a GET request

export async function GET(request: Request) {

    const actionMetaData: ActionGetResponse = {
        icon:"https://cdn-icons-png.flaticon.com/512/2620/2620993.png",
        title:"Vote For your favorite Programming Language",
        description:"Vote between Javascript, Rust, Python, Solidity, Java and C++",
        label:"Vote",
        links:{
            actions: [
                    {
                        label:"Python",
                        href:"/api/vote?candidate=Python",
                    },
                    {
                        label:"Javascript",
                        href:"/api/vote?candidate=Javascript",
                    },
                    {
                        label:"C++",
                        href:"/api/vote?candidate=C++",
                    },
                    {
                        label:"Rust",
                        href:"/api/vote?candidate=Rust",
                    },
                    {
                        label:"Java",
                        href:"/api/vote?candidate=Java",
                    },
                    {
                        label:"Solidity",
                        href:"/api/vote?candidate=Solidity",
                    }
            ] as LinkedAction[]
        }
    };
    return Response.json(actionMetaData, {headers: ACTIONS_CORS_HEADERS});
}

export async function POST(request: Request) {
    //Need to initialize the program here again
    const url = new URL(request.url);
    const candidate = url.searchParams.get("candidate"); //matches the GET links above
    
    if(!candidate){
        return Response.json({error:"No candidate provided"}, {status:400, headers: ACTIONS_CORS_HEADERS});
    }

    const connection = new Connection("http://localhost:8899", "confirmed"); //local solana node
    const program: Program<Voting> = new Program(IDL, {connection}); 
    const body: ActionPostRequest = await request.json();
    let voter;  //needs to be an actual valid account. 

    try {
        voter = new PublicKey(body.account); 
    } catch (error) {
        return Response.json({error:"Failed to cast vote, Invalid Account: "+error}, {status:400, headers: ACTIONS_CORS_HEADERS});
    }

    //Signer is the voter

    const instruction = await program.methods.voteCandidate(candidate, new anchor.BN(1)).accounts({user: voter}).instruction() //pollId is 1
    const blockcHash = await connection.getLatestBlockhash("finalized");

    const transaction = new Transaction({
            blockhash: blockcHash.blockhash,
            lastValidBlockHeight: blockcHash.lastValidBlockHeight,
            feePayer: voter,
        }).add(instruction);


    const response  = await createPostResponse({fields:{type: "transaction", transaction: transaction}});
    
    return Response.json(response, {headers: ACTIONS_CORS_HEADERS});
}