use anchor_lang::prelude::*;
use instructions::*;
use state::game::Tile;

pub mod errors;
pub mod instructions;
pub mod state;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod tic_tac_toe {

    use super::*;

    pub fn setup_game(ctx: Context<SetupGame>, player_two: Pubkey) -> Result<()> {
        instructions::setup_game::setup_game(ctx, player_two);
        Ok(())
    }

    pub fn play(ctx: Context<Play>, tile: Tile) -> Result<()> {
        instructions::play::play(ctx, tile);
        Ok(())
    }
}

// All the types that are used in the type that are marked as the #[account]
// are required to be derived from the AnchorSerialization and DeSerialization to process inside the program

// TODO: bug to find that does a second player play turn of the first player to win
// TODO: get all the commands for the anchor and solana

// source "$HOME/.cargo/env"
// PATH="/home/sleepyqadir/.local/share/solana/install/active_release/bin:$PATH"