use anchor_lang::prelude::*;
mod errors;
mod instructions;
use state::Instruction;
pub mod state;

use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod multisig {
    use super::*;

    #[access_control(ctx.accounts.validate(&threshold, &owners))]
    pub fn create_multisig(
        ctx: Context<CreateMultisig>,
        threshold: u16,
        owners: Vec<Pubkey>,
    ) -> Result<()> {
        ctx.accounts.initialize(
            threshold,
            owners,
            *ctx.bumps.get("multisig_wallet").unwrap(),
        )
    }

    #[access_control(ctx.accounts.validate())]
    pub fn create_transaction(
        ctx: Context<CreateTransaction>,
        instructions: Vec<Instruction>,
    ) -> Result<()> {
        ctx.accounts.initialize(instructions)
    }

    #[access_control(ctx.accounts.validate())]
    pub fn approve(ctx: Context<Approval>) -> Result<()> {
        ctx.accounts.approve()
    }

    #[access_control(ctx.accounts.validate())]
    pub fn unapprove(ctx: Context<Approval>) -> Result<()> {
        ctx.accounts.unapprove()
    }

    #[access_control(ctx.accounts.validate())]
    pub fn execute(ctx: Context<Approval>) -> Result<()> {
        ctx.accounts.execute(ctx.remaining_accounts)
    }
}
