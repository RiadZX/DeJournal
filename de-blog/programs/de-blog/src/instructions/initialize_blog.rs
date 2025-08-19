use anchor_lang::prelude::*;

use crate::errors::DeBlogError;
use crate::states::*;

pub fn initialize_blog(
    ctx: Context<InitializeBlog>,
    title: String,
    description: String,
) -> Result<()> {
    if title.len() > MAX_BLOG_TITLE_LENGTH {
        return Err(DeBlogError::TitleTooLong.into());
    }
    if description.len() > MAX_BLOG_DESCRIPTION_LENGTH {
        return Err(DeBlogError::DescriptionTooLong.into());
    }

    ctx.accounts.blog.title = title;
    ctx.accounts.blog.description = description;
    ctx.accounts.blog.bump = ctx.bumps.blog;

    Ok(())
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct InitializeBlog<'info> {
    #[account(init, payer = authority, space = 8+Blog::INIT_SPACE, seeds = [BLOG_SEED.as_bytes(), authority.key().as_ref(), title.as_bytes()], bump)]
    pub blog: Account<'info, Blog>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
