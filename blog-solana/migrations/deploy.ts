// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

const anchor = require("@project-serum/anchor");
import { Keypair } from "@solana/web3.js"
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js"


module.exports = async function (provider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  // Add your deploy script here.

  let programAuthorityKeypair = new Keypair()

  this.connection = new Connection("https://api.devnet.solana.com", "confirmed")

  const signature = await this.connection.requestAirdrop(
    programAuthorityKeypair.publicKey,
    LAMPORTS_PER_SOL * 2
  )
  await this.connection.confirmTransaction(signature)
  
};
