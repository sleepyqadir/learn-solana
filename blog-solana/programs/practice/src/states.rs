use anchor_lang::prelude::*;

#[account]
pub struct BlogAccount {
    pub authority: Pubkey,
    pub latest_post: Vec<u8>,
}

#[derive(Accounts)]
pub struct MakePost<'info> {
    #[account(
        mut,
        has_one = authority
    )]
    pub blog_account: Account<'info, BlogAccount>,
    pub authority: Signer<'info>,
}

// each todo account hold the single todo data
