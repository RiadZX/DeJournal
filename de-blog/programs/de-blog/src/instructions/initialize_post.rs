use anchor_lang::prelude::*;

use crate::errors::DeBlogError;
use crate::states::*;

pub fn initialize_post(ctx: Context<InitializePost>, title: String, body: String) -> Result<()> {
    if body.len() > MAX_POST_BODY_LENGTH {
        return Err(DeBlogError::BodyTooLong.into());
    }

    // Check that the author matches the blog's author
    if ctx.accounts.blog.author != ctx.accounts.authority.key() {
        return Err(DeBlogError::InvalidAuthor.into());
    }

    ctx.accounts.post.blog = ctx.accounts.blog.key();
    ctx.accounts.post.body = body;
    ctx.accounts.post.bump = ctx.bumps.post;

    Ok(())
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct InitializePost<'info> {
    #[account(mut)]
    pub blog: Account<'info, Blog>,
    #[account(
        init,
        payer = authority,
        space = 8 + Post::INIT_SPACE,
        seeds = [POST_SEED.as_bytes(), blog.key().as_ref(), title.as_bytes()],
        bump
    )]
    pub post: Account<'info, Post>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
