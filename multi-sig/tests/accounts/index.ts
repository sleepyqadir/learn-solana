import * as anchor from "@project-serum/anchor";

export interface JSONDefault {
  default: never;
}

import * as testUser1Json from "./test_user1-state.json";
import * as testUser1KeypairJson from "./test_user1-keypair.json";
export const testUser1 = new anchor.web3.PublicKey(testUser1Json.pubkey);
export const testUser1Keypair = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from((testUser1KeypairJson as unknown as JSONDefault).default)
);


import * as testUser2Json from "./test_user2-state.json";
import * as testUser2KeypairJson from "./test_user2-keypair.json";
export const testUser2 = new anchor.web3.PublicKey(testUser2Json.pubkey);
export const testUser2Keypair = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from((testUser2KeypairJson as unknown as JSONDefault).default)
);

import * as testUser3Json from "./test_user3-state.json";
import * as testUser3KeypairJson from "./test_user3-keypair.json";
export const testUser3 = new anchor.web3.PublicKey(testUser3Json.pubkey);
export const testUser3Keypair = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from((testUser3KeypairJson as unknown as JSONDefault).default)
);

import * as testUser4Json from "./test_user4-state.json";
import * as testUser4KeypairJson from "./test_user4-keypair.json";
export const testUser4 = new anchor.web3.PublicKey(testUser4Json.pubkey);
export const testUser4Keypair = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from((testUser4KeypairJson as unknown as JSONDefault).default)
);
