use anchor_lang::prelude::*;
use std::str::from_utf8;

mod states;

use crate::states::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod solblog {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let b_p_a = &mut ctx.accounts.blog_account;
        b_p_a.authority = ctx.accounts.authority.key();
        Ok(())
    }

    pub fn make_post(ctx: Context<MakePost>, new_post: Vec<u8>) -> Result<()> {
        let post = from_utf8(&new_post).map_err(|err| {
            msg!("Invalid UTF-8 string");
            ProgramError::InvalidInstructionData
        })?;
        msg!(post);

        let b_acc = &mut ctx.accounts.blog_account;

        b_acc.latest_post = new_post;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init, // 1. Hey Anchor, initialize an account with these details for me
        payer = authority, // 2. See that authority Signer (pubkey) down there? They're paying for this
        space = 8 // 3.A) all accounts need 8 bytes for the account discriminator prepended to the account
        + 32 // 3.B) authority: Pubkey needs 32 bytes
        + 566 // 3.C) latest_post: post bytes could need up to 566 bytes for the memo
        // You have to do this math yourself, there's no macro for this
    )]
    pub blog_account: Account<'info, BlogAccount>, // 1. <--- initialize this account variable & add it to Context.accounts.blog_account can now be used above in our initialize function
    #[account(mut)]
    pub authority: Signer<'info>, // 5. <--- let's name the account that signs this transaction "authority" and make it mutable so we can set the value to it in `initialize` function above
    pub system_program: Program<'info, System>, // <--- Anchor boilerplate
}
