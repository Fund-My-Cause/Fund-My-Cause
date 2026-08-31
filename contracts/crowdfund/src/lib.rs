#![no_std]
use soroban_sdk::{contract, contracttype, Address, Env, String, Vec, Map};

// ================================================================
// Error Types - No panics!
// ================================================================

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CrowdfundError {
    NotFound = 1,
    Unauthorized = 2,
    InvalidAmount = 3,
    DeadlinePassed = 4,
    GoalNotMet = 5,
    AlreadyClaimed = 6,
    Overflow = 7,
    Underflow = 8,
    InvalidState = 9,
    NotEnoughFunds = 10,
}

// ================================================================
// Campaign Structs
// ================================================================

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Campaign {
    pub id: u64,
    pub creator: Address,
    pub goal: i128,
    pub raised: i128,
    pub deadline: u64,
    pub claimed: bool,
    pub metadata: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Contribution {
    pub campaign_id: u64,
    pub contributor: Address,
    pub amount: i128,
    pub timestamp: u64,
}

// ================================================================
// Safe Math Helpers - No unwrap/expect!
// ================================================================

pub struct SafeMath;

impl SafeMath {
    /// Safe addition - returns Result instead of panicking
    pub fn add(a: i128, b: i128) -> Result<i128, CrowdfundError> {
        a.checked_add(b).ok_or(CrowdfundError::Overflow)
    }

    /// Safe subtraction - returns Result instead of panicking
    pub fn sub(a: i128, b: i128) -> Result<i128, CrowdfundError> {
        a.checked_sub(b).ok_or(CrowdfundError::Underflow)
    }

    /// Safe multiplication - returns Result instead of panicking
    pub fn mul(a: i128, b: i128) -> Result<i128, CrowdfundError> {
        a.checked_mul(b).ok_or(CrowdfundError::Overflow)
    }

    /// Safe division - returns Result instead of panicking
    pub fn div(a: i128, b: i128) -> Result<i128, CrowdfundError> {
        if b == 0 {
            return Err(CrowdfundError::InvalidAmount);
        }
        a.checked_div(b).ok_or(CrowdfundError::Underflow)
    }

    /// Convert to u64 safely
    pub fn to_u64(value: i128) -> Result<u64, CrowdfundError> {
        if value < 0 {
            return Err(CrowdfundError::InvalidAmount);
        }
        if value > i128::from(u64::MAX) {
            return Err(CrowdfundError::Overflow);
        }
        Ok(value as u64)
    }
}

// ================================================================
// Crowdfund Contract - No panics!
// ================================================================

#[contract]
pub struct CrowdfundContract;

#[contractimpl]
impl CrowdfundContract {
    /// Create a new campaign - uses safe math, no unwrap
    pub fn create_campaign(
        env: Env,
        creator: Address,
        goal: i128,
        deadline: u64,
        metadata: String,
    ) -> Result<u64, CrowdfundError> {
        // Validate inputs with safe math
        if goal <= 0 {
            return Err(CrowdfundError::InvalidAmount);
        }

        let current_time = env.ledger().timestamp();
        if deadline <= current_time {
            return Err(CrowdfundError::DeadlinePassed);
        }

        // Get next ID safely
        let next_id = Self::get_next_id(&env)?;

        let campaign = Campaign {
            id: next_id,
            creator: creator.clone(),
            goal,
            raised: 0,
            deadline,
            claimed: false,
            metadata: metadata.clone(),
        };

        // Store campaign using safe key
        Self::store_campaign(&env, &campaign)?;

        // Emit event
        env.events().publish(
            ("campaign_created", "v1"),
            (next_id, creator, goal, deadline),
        );

        Ok(next_id)
    }

    /// Contribute to a campaign - uses safe math, no unwrap
    pub fn contribute(
        env: Env,
        campaign_id: u64,
        contributor: Address,
        amount: i128,
    ) -> Result<(), CrowdfundError> {
        // Validate amount
        if amount <= 0 {
            return Err(CrowdfundError::InvalidAmount);
        }

        // Load campaign safely
        let mut campaign = Self::load_campaign(&env, campaign_id)?;

        // Check deadline
        let current_time = env.ledger().timestamp();
        if current_time > campaign.deadline {
            return Err(CrowdfundError::DeadlinePassed);
        }

        // Check if already claimed
        if campaign.claimed {
            return Err(CrowdfundError::AlreadyClaimed);
        }

        // Update raised amount with safe math
        campaign.raised = SafeMath::add(campaign.raised, amount)?;

        // Store updated campaign
        Self::store_campaign(&env, &campaign)?;

        // Record contribution
        let contribution = Contribution {
            campaign_id,
            contributor: contributor.clone(),
            amount,
            timestamp: current_time,
        };
        Self::store_contribution(&env, &contribution)?;

        // Emit event
        env.events().publish(
            ("contribution_made", "v1"),
            (campaign_id, contributor, amount),
        );

        Ok(())
    }

    /// Claim funds - uses safe math, no unwrap
    pub fn claim_funds(
        env: Env,
        campaign_id: u64,
        caller: Address,
    ) -> Result<(), CrowdfundError> {
        // Load campaign safely
        let mut campaign = Self::load_campaign(&env, campaign_id)?;

        // Check authorization
        if campaign.creator != caller {
            return Err(CrowdfundError::Unauthorized);
        }

        // Check if already claimed
        if campaign.claimed {
            return Err(CrowdfundError::AlreadyClaimed);
        }

        // Check deadline
        let current_time = env.ledger().timestamp();
        if current_time < campaign.deadline {
            return Err(CrowdfundError::InvalidState);
        }

        // Check if goal met
        if campaign.raised < campaign.goal {
            return Err(CrowdfundError::GoalNotMet);
        }

        // Mark as claimed
        campaign.claimed = true;

        // Store updated campaign
        Self::store_campaign(&env, &campaign)?;

        // Emit event
        env.events().publish(
            ("funds_claimed", "v1"),
            (campaign_id, caller, campaign.raised),
        );

        Ok(())
    }

    // ================================================================
    // Internal Helpers - All return Results, no panics!
    // ================================================================

    /// Get next campaign ID safely
    fn get_next_id(env: &Env) -> Result<u64, CrowdfundError> {
        let key = String::from_str(env, "next_id");
        let next_id: u64 = env.storage().get(&key).unwrap_or(0);
        let new_id = next_id
            .checked_add(1)
            .ok_or(CrowdfundError::Overflow)?;
        env.storage().set(&key, &new_id);
        Ok(new_id)
    }

    /// Store campaign safely
    fn store_campaign(env: &Env, campaign: &Campaign) -> Result<(), CrowdfundError> {
        let key = String::from_str(env, &format!("campaign_{}", campaign.id));
        env.storage().set(&key, campaign);
        Ok(())
    }

    /// Load campaign safely - returns Result, not Option
    fn load_campaign(env: &Env, id: u64) -> Result<Campaign, CrowdfundError> {
        let key = String::from_str(env, &format!("campaign_{}", id));
        env.storage()
            .get(&key)
            .ok_or(CrowdfundError::NotFound)
    }

    /// Store contribution safely
    fn store_contribution(env: &Env, contribution: &Contribution) -> Result<(), CrowdfundError> {
        let key = String::from_str(env, &format!("contribution_{}_{}", contribution.campaign_id, contribution.contributor.to_string()));
        env.storage().set(&key, contribution);
        Ok(())
    }

    /// Get campaign by ID - public getter with safe error handling
    pub fn get_campaign(
        env: Env,
        campaign_id: u64,
    ) -> Result<Campaign, CrowdfundError> {
        Self::load_campaign(&env, campaign_id)
    }

    /// Get all contributions for a campaign (safe)
    pub fn get_contributions(
        env: Env,
        campaign_id: u64,
    ) -> Result<Vec<Contribution>, CrowdfundError> {
        // This would iterate over contributions
        // Simplified for example
        Ok(Vec::new(&env))
    }
}

#[cfg(test)]
mod tests;
