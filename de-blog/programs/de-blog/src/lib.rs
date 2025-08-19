use crate::instructions::*;
use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod states;

declare_id!("AEjAokTrjdTnNGhffd4Ju1E3M3n1R5Ryzoq9bTajxKyJ");

#[program]
pub mod de_blog {
    use super::*;

    pub fn create_blog(
        ctx: Context<InitializeBlog>,
        title: String,
        description: String,
    ) -> Result<()> {
        instructions::initialize_blog(ctx, title, description)
    }
}
