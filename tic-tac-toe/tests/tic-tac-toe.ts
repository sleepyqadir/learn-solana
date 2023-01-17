import * as anchor from "@project-serum/anchor";
import { AnchorError, Program } from "@project-serum/anchor";
import { TicTacToe } from "../target/types/tic_tac_toe";
import { expect, assert } from "chai";

const play = async (progam: Program<TicTacToe>, game, player, tile, expectedTurn, expectedGameState, expectedBoard) => {
  try {
    await progam.methods.play(tile).accounts({
      player: player.publicKey,
      game
    }).signers(player instanceof (anchor.Wallet as any) ? [] : [player]).rpc()

    const gameState = await progam.account.game.fetch(game)

    console.log(gameState)

    expect(gameState.turn).to.equal(expectedTurn);
    expect(gameState.state).to.eql(expectedGameState);
    expect(gameState.board).to.eql(expectedBoard);
  } catch (e) {
    console.log({ e })
  }
}

describe("tic-tac-toe", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.TicTacToe as Program<TicTacToe>;
  const programProvider = program.provider as anchor.AnchorProvider;

  it("Setup Game!", async () => {
    const gameKeyPair = anchor.web3.Keypair.generate()
    const player_one = programProvider.wallet;
    const player_two = anchor.web3.Keypair.generate()

    await program.methods.setupGame(player_two.publicKey).accounts({
      game: gameKeyPair.publicKey,
      playerOne: player_one.publicKey,
    }).signers([gameKeyPair]).rpc()

    let gameState = await program.account.game.fetch(gameKeyPair.publicKey)
    expect(gameState.turn).to.equal(1);
    expect(gameState.players).to.eql([player_one.publicKey, player_two.publicKey])
    expect(gameState.state).to.eql({ active: {} })
    expect(gameState.board).to.eql([[null, null, null], [null, null, null], [null, null, null]])

  });

  it("player one wins!", async () => {
    const gameKeyPair = anchor.web3.Keypair.generate();
    const playerOne = programProvider.wallet
    const playerTwo = anchor.web3.Keypair.generate();

    await program.methods.setupGame(playerTwo.publicKey).accounts({
      game: gameKeyPair.publicKey,
      playerOne: playerOne.publicKey,
    }).signers([gameKeyPair]).rpc();

    let gameState = await program.account.game.fetch(gameKeyPair.publicKey);
    expect(gameState.turn).to.equal(1);
    expect(gameState.players).to.eql([playerOne.publicKey, playerTwo.publicKey])
    expect(gameState.state).to.eql({ active: {} })
    expect(gameState.board).to.eql([[null, null, null], [null, null, null], [null, null, null]])

    await play(program, gameKeyPair.publicKey,
      playerOne, { row: 0, column: 0 }, 2,
      { active: {} },
      [[{ x: {} }, null, null], [null, null, null], [null, null, null]])

    await play(program, gameKeyPair.publicKey, playerTwo, { row: 1, column: 0 }, 3, { active: {} }, [
      [{ x: {} }, null, null],
      [null, null, null],
      [null, null, null]

    ])

    await play(
      program,
      gameKeyPair.publicKey,
      playerOne,
      { row: 0, column: 1 },
      4,
      { active: {}, },
      [
        [{ x: {} }, { x: {} }, null],
        [{ o: {} }, null, null],
        [null, null, null]
      ]
    );

    await play(
      program,
      gameKeyPair.publicKey,
      playerTwo,
      { row: 1, column: 1 },
      5,
      { active: {}, },
      [
        [{ x: {} }, { x: {} }, null],
        [{ o: {} }, { o: {} }, null],
        [null, null, null]
      ]
    );

    await play(
      program,
      gameKeyPair.publicKey,
      playerOne,
      { row: 0, column: 2 },
      5,
      { won: { winner: playerOne.publicKey }, },
      [
        [{ x: {} }, { x: {} }, { x: {} }],
        [{ o: {} }, { o: {} }, null],
        [null, null, null]
      ]
    );



  })

  it('tie', async () => {
    const gameKeypair = anchor.web3.Keypair.generate();
    const playerOne = programProvider.wallet;
    const playerTwo = anchor.web3.Keypair.generate();
    await program.methods
      .setupGame(playerTwo.publicKey)
      .accounts({
        game: gameKeypair.publicKey,
        playerOne: playerOne.publicKey,
      })
      .signers([gameKeypair])
      .rpc();

    let gameState = await program.account.game.fetch(gameKeypair.publicKey);
    expect(gameState.turn).to.equal(1);
    expect(gameState.players)
      .to
      .eql([playerOne.publicKey, playerTwo.publicKey]);
    expect(gameState.state).to.eql({ active: {} });
    expect(gameState.board)
      .to
      .eql([[null, null, null], [null, null, null], [null, null, null]]);

    await play(
      program,
      gameKeypair.publicKey,
      playerOne,
      { row: 0, column: 0 },
      2,
      { active: {}, },
      [
        [{ x: {} }, null, null],
        [null, null, null],
        [null, null, null]
      ]
    );

    await play(
      program,
      gameKeypair.publicKey,
      playerTwo,
      { row: 1, column: 1 },
      3,
      { active: {}, },
      [
        [{ x: {} }, null, null],
        [null, { o: {} }, null],
        [null, null, null]
      ]
    );

    await play(
      program,
      gameKeypair.publicKey,
      playerOne,
      { row: 2, column: 0 },
      4,
      { active: {}, },
      [
        [{ x: {} }, null, null],
        [null, { o: {} }, null],
        [{ x: {} }, null, null]
      ]
    );

    await play(
      program,
      gameKeypair.publicKey,
      playerTwo,
      { row: 1, column: 0 },
      5,
      { active: {}, },
      [
        [{ x: {} }, null, null],
        [{ o: {} }, { o: {} }, null],
        [{ x: {} }, null, null]
      ]
    );

    await play(
      program,
      gameKeypair.publicKey,
      playerOne,
      { row: 1, column: 2 },
      6,
      { active: {}, },
      [
        [{ x: {} }, null, null],
        [{ o: {} }, { o: {} }, { x: {} }],
        [{ x: {} }, null, null]
      ]
    );

    await play(
      program,
      gameKeypair.publicKey,
      playerTwo,
      { row: 0, column: 1 },
      7,
      { active: {}, },
      [
        [{ x: {} }, { o: {} }, null],
        [{ o: {} }, { o: {} }, { x: {} }],
        [{ x: {} }, null, null]
      ]
    );

    await play(
      program,
      gameKeypair.publicKey,
      playerOne,
      { row: 2, column: 1 },
      8,
      { active: {}, },
      [
        [{ x: {} }, { o: {} }, null],
        [{ o: {} }, { o: {} }, { x: {} }],
        [{ x: {} }, { x: {} }, null]
      ]
    );

    await play(
      program,
      gameKeypair.publicKey,
      playerTwo,
      { row: 2, column: 2 },
      9,
      { active: {}, },
      [
        [{ x: {} }, { o: {} }, null],
        [{ o: {} }, { o: {} }, { x: {} }],
        [{ x: {} }, { x: {} }, { o: {} }]
      ]
    );


    await play(
      program,
      gameKeypair.publicKey,
      playerOne,
      { row: 0, column: 2 },
      9,
      { tie: {}, },
      [
        [{ x: {} }, { o: {} }, { x: {} }],
        [{ o: {} }, { o: {} }, { x: {} }],
        [{ x: {} }, { x: {} }, { o: {} }]
      ]
    );
  })

});
