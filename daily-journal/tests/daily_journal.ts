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

  it("Edits an entry", async () => {
    const entryData = testEntries[0];
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

    const newMood = "excited";
    const newWeather = "windy";
    const newMessage = "A new day, a new adventure!";

    await program.methods
      .editEntry(newMood, newWeather, newMessage)
      .accounts({
        entry: entryPda,
        authority: user.publicKey,
      })
      .rpc();

    const entryAccount = await program.account.entry.fetch(entryPda);

    assert.ok(entryAccount.authority.equals(user.publicKey));
    assert.deepStrictEqual(entryAccount.mood, newMood);
    assert.equal(entryAccount.year, entryData.year);
    assert.equal(entryAccount.month, entryData.month);
    assert.equal(entryAccount.day, entryData.day);
    assert.deepStrictEqual(entryAccount.weather, newWeather);
    assert.equal(entryAccount.message, newMessage);
  });

  it("Deletes an entry", async () => {
    const entryData = testEntries[0];
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
      .deleteEntry()
      .accounts({
        entry: entryPda,
        authority: user.publicKey,
      })
      .rpc();

    const entryAccount = await program.account.entry.fetchNullable(entryPda);
    assert.isNull(entryAccount);
  });

  it("Should fail to edit an entry if not the authority", async () => {
    // Create entry with default user
    const entryData = testEntries[2];
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

    // await program.methods
    //   .createEntry(
    //     entryData.mood,
    //     entryData.year,
    //     entryData.month,
    //     entryData.day,
    //     entryData.weather,
    //     entryData.message
    //   )
    //   .accounts({
    //     entry: entryPda,
    //     user: user.publicKey,
    //     systemProgram: anchor.web3.SystemProgram.programId,
    //   })
    //   .rpc();

    // Create a new wallet (not the authority)
    const otherUser = anchor.web3.Keypair.generate();

    // Fund the other user
    const sig = await provider.connection.requestAirdrop(
      otherUser.publicKey,
      2e9
    );
    await provider.connection.confirmTransaction(sig);

    // Try to edit with other user
    try {
      await program.methods
        .editEntry("sneaky", "foggy", "Trying to edit someone else's entry")
        .accounts({
          entry: entryPda,
          authority: otherUser.publicKey,
        })
        .signers([otherUser])
        .rpc();
      assert.fail("Expected edit to fail for non-authority");
    } catch (error) {
      // console.log(error.message);
      assert.isTrue(
        error.message.includes("Error Code: ConstraintSeeds"),
        "Expected error message to include 'Unauthorized'"
      );
    }
  });

  it("Should fail to delete an entry if not the authority", async () => {
    // Use the same entry as above
    const entryData = testEntries[3];
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

    // Create a new wallet (not the authority)
    const otherUser = anchor.web3.Keypair.generate();

    // Fund the other user
    const sig = await provider.connection.requestAirdrop(
      otherUser.publicKey,
      2e9
    );
    await provider.connection.confirmTransaction(sig);

    // Try to delete with other user
    try {
      await program.methods
        .deleteEntry()
        .accounts({
          entry: entryPda,
          authority: otherUser.publicKey,
        })
        .signers([otherUser])
        .rpc();
      assert.fail("Expected delete to fail for non-authority");
    } catch (error) {
      // if it reaches here, then that means it fails, which is intended.
      assert.isTrue(true);
    }
  });
});
