use crate::errors::ErrorCode;
use crate::state::Multisig;
use anchor_lang::prelude::*;
#[derive(Accounts)]
#[instruction(threshold: u64, owners: Vec<Pubkey>)]
pub struct CreateMultisig<'info> {
    base: Signer<'info>,

    #[account(
        init,
        seeds = [
            b"Multisig".as_ref(),
            &base.key().as_ref(),
        ],
        bump,
        payer = payer,
        space = Multisig::space(owners.len())
    )]
    multisig: Account<'info, Multisig>, // hold the program account of smart contract

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

        require!(owners.len() == deduped.len(), ErrorCode::DuplicateMembers);

        Ok(())
    }

    pub fn initialize(&mut self, threshold: u16, owners: Vec<Pubkey>, bump: u8) -> Result<()> {
        let msig = &mut self.multisig;
        msig.nonce = 0;
        msig.owners = owners.clone();
        msig.base = self.base.key();
        msig.threshold = threshold;
        msig.bump = bump;
        Ok(())
    }
}
