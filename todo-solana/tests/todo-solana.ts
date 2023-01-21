import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TodoSolana } from "../target/types/todo_solana";

describe("todo-solana", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.TodoSolana as Program<TodoSolana>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
