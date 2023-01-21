use crate::errors::ErrorCode;
use crate::state::MultisigWallet;
use anchor_lang::prelude::*;
use anchor_lang::prelude::{Account, Program, Signer, System};
use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
#[instruction(threshold: u16, owners: Vec<Pubkey>)]
pub struct CreateMultisig<'info> {
    base: Signer<'info>,

    #[account(
        init,
        seeds = [
            b"MultisigWallet".as_ref(),
            &base.key().as_ref()
        ],
        bump,
        payer = payer,
        space = MultisigWallet::space(owners.len()),
    )]
    multisig_wallet: Account<'info, MultisigWallet>,

    #[account(mut)]
    payer: Signer<'info>,

    system_program: Program<'info, System>,
}

impl<'info> CreateMultisig<'info> {
    pub fn validate(&self, threshold: &u16, owners: &Vec<Pubkey>) -> Result<()> {
        require!(*threshold > 0, ErrorCode::InvalidThreshold);

        require!(
            *threshold as usize <= owners.len(),
            ErrorCode::InvalidThreshold
        );

        let mut deduped = owners.clone();
        
        deduped.dedup();
        require!(owners.len() == deduped.len(), ErrorCode::DuplicateOwners);
        Ok(())
    }

    pub fn initialize(&mut self, threshold: u16, owners: Vec<Pubkey>, bump: u8) -> Result<()> {
        let msig = &mut self.multisig_wallet;
        msig.nonce = 0;
        msig.owners = owners.clone();
        msig.base = self.base.key();
        msig.threshold = threshold;
        msig.bump = bump;
        Ok(())
    }
}
