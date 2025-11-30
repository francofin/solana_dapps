#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("46nBD78RviFsXAUXM9Y9S76yg2EUjsXzvTp9WbV7hz4h");

// Anchor programs always use 8 bits for the discriminator
pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

//User can vote for different accounts
// 1. Accounts Needed
// a. Poll Account - Poll Name, Poll Id, Description, poll start, poll end, candidate amount, seeds are poll_id
// b. Voter Account
// c. Candidate Account - Can be multiple, will have First Name, Last Name, Vote Count, Also a Poll Id to link to Poll Account, seeds would be poll_id + candidate_name
// d. System Program

//Instructions
// 1. Initialize Poll - Creates Poll Account
// 2. Add Candidate - Adds Candidate to Poll
// 3. Vote Candidate - Votes for Candidate

//Test using anchor bankrun


#[program]
pub mod voting {
    use super::*;


    pub fn initialize_poll(ctx: Context<InitializePoll>, poll_id: u64, description: String, poll_name: String, poll_start: u64, poll_end: u64) -> Result<()> {

        let user_public_key = ctx.accounts.user.key();
        let poll = &mut ctx.accounts.poll_account;
        msg!("User Public Key: {}", user_public_key);

        poll.poll_id = poll_id;
        poll.poll_descritpion = description;
        poll.poll_name = poll_name;
        poll.poll_start = poll_start;
        poll.poll_end = poll_end;
        poll.candidate_amount = 0;
        Ok(())   

    }


    pub fn initialize_candidate(ctx: Context<InitializeCandidate>, candidate_name: String, _poll_id:u64, candidate_id: u64) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate_account;
        let poll = &mut ctx.accounts.poll_account;
        poll.candidate_amount += 1;
        msg!("Candidate Added to Poll");
        candidate.candidate_name = candidate_name;
        candidate.vote_count = 0;
        candidate.candidate_id = candidate_id;
        
        Ok(())
    }

    pub fn vote_candidate(_ctx: Context<Vote>, _candidate_name: String, _poll_id:u64,) -> Result<()> {
        let candidate = &mut _ctx.accounts.candidate_account;
        msg!("Vote Casted, {}", candidate.candidate_name);
        candidate.vote_count += 1;
        Ok(())
    }

}



#[account]  
#[derive(InitSpace)]
pub struct PollAccount {
    poll_id: u64,
    #[max_len(280)]
    poll_descritpion: String,
    poll_start: u64,
    poll_end: u64,
    candidate_amount: u64,
    #[max_len(50)]
    poll_name: String,
}


#[derive(Accounts)]
#[instruction(poll_id: u64)] //use to pass in poll_id for seeds
pub struct InitializePoll<'info> {
    #[account(init, payer = user, space = ANCHOR_DISCRIMINATOR_SIZE + PollAccount::INIT_SPACE, seeds=[poll_id.to_le_bytes().as_ref()], bump)]
    pub poll_account: Account<'info, PollAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}


#[account]
#[derive(InitSpace)]
pub struct CandidateAccount {
    #[max_len(50)]
    candidate_name: String,
    vote_count: u64,
    candidate_id: u64,
}

#[derive(Accounts)]
#[instruction( candidate_name: String, poll_id: u64)] // needs to be in the same order as the initialize_candidate function parameters
pub struct InitializeCandidate<'info> {
    #[account(init, payer = user, space = ANCHOR_DISCRIMINATOR_SIZE + CandidateAccount::INIT_SPACE, seeds=[poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()], bump)]
    pub candidate_account: Account<'info, CandidateAccount>,
    #[account(mut, seeds=[poll_id.to_le_bytes().as_ref()], bump)] //need this to link to the poll account and increment the candidate amount
    pub poll_account: Account<'info, PollAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction( candidate_name: String, poll_id: u64)] // needs to be in the same order as the initialize_candidate function parameters
pub struct Vote<'info> {
    pub user: Signer<'info>,
    #[account(mut, seeds=[poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()], bump)]
    pub candidate_account: Account<'info, CandidateAccount>,
    #[account(seeds=[poll_id.to_le_bytes().as_ref()], bump)] //need this to link to the poll account and increment the candidate amount
    pub poll_account: Account<'info, PollAccount>
}
//init makes the account auto initialize
//use init space to calculate space needed for account
