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

  it("Blog should fail long description", async () => {
    // Authority for the blog
    const authority = anchor.web3.Keypair.generate();

    // Airdrop SOL to authority so it can pay for transactions
    const provider = anchor.getProvider();
    const sig = await provider.connection.requestAirdrop(
      authority.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    // Blog title and description (intentionally too long)
    const title = "My Awesome Blog";
    const description = "This is a test blog ".repeat(30); // Make sure it's longer than 256 bytes

    let should_fail = "This Should Fail";
    try {
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

      // If no error, fail the test
      should_fail = "Did Not Fail";
    } catch (error: any) {
      // Anchor error messages are nested, so check for the custom error
      assert.include(
        error.message,
        "The provided description is too long",
        "Expected 'The provided description is too long' error for description longer than 256 bytes"
      );
      should_fail = "Failed";
    }
    assert.strictEqual(
      should_fail,
      "Failed",
      "Blog initialization should have failed with description longer than 256 bytes"
    );
  });

  it("Initializes a post!", async () => {
    // Authority for the blog and post
    const authority = anchor.web3.Keypair.generate();

    // Airdrop SOL to authority
    const provider = anchor.getProvider();
    const sig = await provider.connection.requestAirdrop(
      authority.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    // Blog title and description
    const blogTitle = "Blog for Posts";
    const blogDescription = "Blog to test post creation";

    // Derive the blog PDA
    const [blogPda, blogBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("DEBLOG"),
        authority.publicKey.toBuffer(),
        Buffer.from(blogTitle),
      ],
      program.programId
    );

    // Create the blog first
    await program.methods
      .createBlog(blogTitle, blogDescription)
      .accounts({
        blog: blogPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Post title and body
    const postTitle = "First Post";
    const postBody = "This is my first post!";

    // Derive the post PDA
    const [postPda, postBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("POST"), blogPda.toBuffer(), Buffer.from(postTitle)],
      program.programId
    );

    // Create the post
    await program.methods
      .createPost(postTitle, postBody)
      .accounts({
        blog: blogPda,
        post: postPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Fetch the post account
    const postAccount = await program.account.post.fetch(postPda);

    // Assert the post account data
    assert.equal(postAccount.blog.toBase58(), blogPda.toBase58());
    assert.equal(postAccount.body, postBody);
    assert.equal(postAccount.bump, postBump);

    console.log("Post initialized at:", postPda.toBase58());
  });

  it("Post should fail long body", async () => {
    // Authority for the blog and post
    const authority = anchor.web3.Keypair.generate();

    // Airdrop SOL to authority
    const provider = anchor.getProvider();
    const sig = await provider.connection.requestAirdrop(
      authority.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    // Blog title and description
    const blogTitle = "Blog for Posts";
    const blogDescription = "Blog to test post creation";

    // Derive the blog PDA
    const [blogPda, blogBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("DEBLOG"),
        authority.publicKey.toBuffer(),
        Buffer.from(blogTitle),
      ],
      program.programId
    );

    // Create the blog first
    await program.methods
      .createBlog(blogTitle, blogDescription)
      .accounts({
        blog: blogPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Post title and body (intentionally too long)
    const postTitle = "Long Post";
    const postBody = "x".repeat(513); // MAX_POST_BODY_LENGTH is 65536

    // Derive the post PDA
    const [postPda, postBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("POST"), blogPda.toBuffer(), Buffer.from(postTitle)],
      program.programId
    );

    let should_fail = "This Should Fail";
    try {
      await program.methods
        .createPost(postTitle, postBody)
        .accounts({
          blog: blogPda,
          post: postPda,
          authority: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      should_fail = "Did Not Fail";
    } catch (error: any) {
      assert.include(
        error.message,
        "The provided body is too long",
        "Expected 'The provided body is too long' error for body longer than 65536 bytes"
      );
      should_fail = "Failed";
    }
    assert.strictEqual(
      should_fail,
      "Failed",
      "Post initialization should have failed with body longer than 65536 bytes"
    );
  });

  it("Post should fail if blog does not exist", async () => {
    const authority = anchor.web3.Keypair.generate();

    // Post title and body
    const postTitle = "Ghost Post";
    const postBody = "This post should not work!";

    // Derive a random blog PDA (never initialized)
    const blogTitle = "Nonexistent Blog";
    const [blogPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("DEBLOG"),
        authority.publicKey.toBuffer(),
        Buffer.from(blogTitle),
      ],
      program.programId
    );

    // Derive post PDA
    const [postPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("POST"), blogPda.toBuffer(), Buffer.from(postTitle)],
      program.programId
    );

    let should_fail = "This Should Fail";
    try {
      await program.methods
        .createPost(postTitle, postBody)
        .accounts({
          blog: blogPda,
          post: postPda,
          authority: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      should_fail = "Did Not Fail";
    } catch (error: any) {
      should_fail = "Failed";
    }
    assert.strictEqual(
      should_fail,
      "Failed",
      "Post initialization should have failed because blog does not exist"
    );
  });

  it("Post should fail if author does not match blog author", async () => {
    const authorityA = anchor.web3.Keypair.generate();
    const authorityB = anchor.web3.Keypair.generate();

    // Airdrop SOL to both authorities
    const provider = anchor.getProvider();
    const sigA = await provider.connection.requestAirdrop(
      authorityA.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sigA);

    const sigB = await provider.connection.requestAirdrop(
      authorityB.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sigB);

    // Blog title and description
    const blogTitle = "Blog for Auth Test";
    const blogDescription = "Blog to test author check";

    // Derive the blog PDA
    const [blogPda, blogBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("DEBLOG"),
        authorityA.publicKey.toBuffer(),
        Buffer.from(blogTitle),
      ],
      program.programId
    );

    // Create the blog with authorityA
    await program.methods
      .createBlog(blogTitle, blogDescription)
      .accounts({
        blog: blogPda,
        authority: authorityA.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([authorityA])
      .rpc();

    // Post title and body
    const postTitle = "Unauthorized Post";
    const postBody = "This post should fail due to wrong author!";

    // Derive the post PDA
    const [postPda, postBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("POST"), blogPda.toBuffer(), Buffer.from(postTitle)],
      program.programId
    );

    let should_fail = "This Should Fail";
    try {
      await program.methods
        .createPost(postTitle, postBody)
        .accounts({
          blog: blogPda,
          post: postPda,
          authority: authorityB.publicKey, // Wrong authority!
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([authorityB])
        .rpc();

      should_fail = "Did Not Fail";
    } catch (error: any) {
      assert.include(
        error.message,
        "The provided author does not match the blog author",
        "Expected 'The provided author does not match the blog author' error"
      );
      should_fail = "Failed";
    }
    assert.strictEqual(
      should_fail,
      "Failed",
      "Post initialization should have failed because author does not match blog author"
    );
  });
});
