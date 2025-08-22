import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DailyJournal } from "../target/types/daily_journal";
import { assert } from "chai";

describe("daily_journal", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DailyJournal as Program<DailyJournal>;
  const user = provider.wallet;

  const testEntries = [
    {
      mood: "happy",
      year: 2025,
      month: 8,
      day: 22,
      weather: "sunny",
      message: "What a beautiful day!",
    },
    {
      mood: "okay",
      year: 2025,
      month: 8,
      day: 23,
      weather: "cloudy",
      message: "Just a regular day.",
    },
    {
      mood: "sad",
      year: 2025,
      month: 8,
      day: 24,
      weather: "rainy",
      message: "Feeling a bit down.",
    },
    {
      mood: "angry",
      year: 2025,
      month: 8,
      day: 25,
      weather: "stormy",
      message: "Grrr!",
    },
    {
      mood: "cozy",
      year: 2025,
      month: 8,
      day: 26,
      weather: "snowy",
      message: "Feeling cozy inside.",
    },
  ];

  for (const entryData of testEntries) {
    it(`Creates an entry for ${entryData.year}-${entryData.month}-${entryData.day}`, async () => {
      const [entryPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          anchor.utils.bytes.utf8.encode("entry"),
          new anchor.BN(entryData.year).toArrayLike(Buffer, "le", 2),
          new anchor.BN(entryData.month).toArrayLike(Buffer, "le", 1),
          new anchor.BN(entryData.day).toArrayLike(Buffer, "le", 1),
          user.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .createEntry(
          entryData.mood,
          entryData.year,
          entryData.month,
          entryData.day,
          entryData.weather,
          entryData.message
        )
        .accounts({
          entry: entryPda,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const entryAccount = await program.account.entry.fetch(entryPda);

      assert.ok(entryAccount.authority.equals(user.publicKey));
      assert.deepStrictEqual(entryAccount.mood, entryData.mood);
      assert.equal(entryAccount.year, entryData.year);
      assert.equal(entryAccount.month, entryData.month);
      assert.equal(entryAccount.day, entryData.day);
      assert.deepStrictEqual(entryAccount.weather, entryData.weather);
      assert.equal(entryAccount.message, entryData.message);
    });
  }

  it("Should fail when using invalid date", async () => {
    const year = 2025;
    const month = 13;
    const day = 1;

    const [entryPda] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("entry"),
        new anchor.BN(year).toArrayLike(Buffer, "le", 2),
        new anchor.BN(month).toArrayLike(Buffer, "le", 1),
        new anchor.BN(day).toArrayLike(Buffer, "le", 1),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );

    let should_fail = "This should fail";
    try {
      await program.methods
        .createEntry("happy", year, month, day, "sunny", "I'm feeling great!")
        .accounts({
          entry: entryPda,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("Expected transaction to fail");
    } catch (error) {
      should_fail = "Failed";
      console.log(error);
      assert.isTrue(
        error.message.includes("InvalidMonth"),
        "Expected error message to include 'InvalidMonth'"
      );
    }
    assert.strictEqual(
      should_fail,
      "Failed",
      "Should fail when using invalid date"
    );
  });
});
