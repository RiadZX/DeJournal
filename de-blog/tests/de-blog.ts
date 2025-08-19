import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DeBlog } from "../target/types/de_blog";
import { assert } from "chai";

describe("de-blog", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.deBlog as Program<DeBlog>;

  it("Initializes a blog!", async () => {
    // Authority for the blog
    const authority = anchor.web3.Keypair.generate();

    // Airdrop SOL to authority so it can pay for transactions
    const provider = anchor.getProvider();
    const sig = await provider.connection.requestAirdrop(
      authority.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    // Blog title and description
    const title = "My Awesome Blog";
    const description = "This is a test blog";

    // Derive the blog PDA
    const [blogPda, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("DEBLOG"),
        authority.publicKey.toBuffer(),
        Buffer.from(title),
      ],
      program.programId
    );

    // Call initialize_blog
    await program.methods
      .createBlog(title, description)
      .accounts({
        blog: blogPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Fetch the blog account
    const blogAccount = await program.account.blog.fetch(blogPda);

    // Assert the blog account data
    assert.equal(blogAccount.title, title);
    assert.equal(blogAccount.description, description);
    assert.equal(blogAccount.bump, bump);

    console.log("Blog initialized at:", blogPda.toBase58());
  });
});
