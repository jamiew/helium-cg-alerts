import { Client, type Account } from "@helium/http";
import { existsSync, readFileSync, writeFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config();

const cgFile = "./cg.json";

let client: Client;

async function fetchValidators(account: Account) {
  return (await account.validators.list()).data;
}

async function fetchConsensusGroup() {
  return (await client.validators.elected()).data;
}

async function main() {
  // store and re-use this globally, for convenience
  client = new Client();

  const poolOwner = process.env.ACCOUNT;
  if (!poolOwner) {
    throw new Error(
      "no pool owner configured; please set ACCOUNT in your .env"
    );
  }

  // fetch our account and its validators, if any
  const account = await client.accounts.get(poolOwner);
  // console.log(`info for ${poolOwner}...`);
  // console.log(`balance: ${account.balance}`);
  // console.log(`hotspots: ${account.hotspotCount}`);
  // console.log(`validators: ${account.validatorCount}`);

  const validators = await fetchValidators(account);
  const validatorNames = validators.map((v) => v.name);
  console.log(`your validators:`, validatorNames);

  if (validatorNames.length <= 0) {
    throw new Error("you have no validators, this script won't work");
  }

  // load CG group from previous run
  let existingCg: Array<string> = [];
  if (existsSync(cgFile)) {
    existingCg = JSON.parse(readFileSync(cgFile, "utf-8"));
    // console.log(`existing CG:`, existingCg);
  } else {
    console.log(`no ${cgFile} saved yet`);
  }

  // fetch current CG group
  const cg = await fetchConsensusGroup();
  const cgNames = cg.map((v) => v.name);
  // console.log(`currently in consensus:`, cgNames);

  // check if any of our validators were in the previously-collected CG group
  const inPrevConsensus = existingCg
    // .filter((v) => validatorNames.includes(v));
    .filter((v) => Math.random() > 0.5);
  console.log(`inPrevConsensus:`, inPrevConsensus);

  // check if any of our validators are in current consensus group
  const inConsensus = cg
    // .filter((v) => validatorNames.includes(v.name))
    .filter((v) => Math.random() > 0.5)
    .map((v) => v.name);
  console.log(`inConsensus:`, inConsensus);

  // const combined = inPrevConsensus + inConsensus;
  // console.log(`combined:`, combined);
  // for (const val in combined) {
  //   console.log(`checking ${val} ...`);
  //   // if yes, and wasn't before, send Joined CG
  //   // if no, and WAS before, send Exited CG
  //   // otherwise do nothing
  // }

  console.log(`saving current CG to ${cgFile} ...`);
  writeFileSync(cgFile, JSON.stringify(cgNames));

  // console.log("current CG:")
  // "elected" method
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
