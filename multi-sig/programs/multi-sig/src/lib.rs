use anchor_lang::prelude::*;
mod errors;
mod instructions;
pub mod state;

use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod multi_sig {

    use super::*;

    #[access_control(ctx.accounts.validate(&threshold,&owners))]
    pub fn create_multisig(
        ctx: Context<CreateMultisig>,
        threshold: u16,
        owners: Vec<Pubkey>,
    ) -> Result<()> {
        ctx.accounts
            .initialize(threshold, owners, *ctx.bumps.get("multisig").unwrap())
    }
}
