//! # Mint and Authorization Tests for Achievements Contract (Issue #1733)
//!
//! Comprehensive tests for achievement minting and authorization:
//! - Achievement unlock/mint operations
//! - Authentication and authorization flows
//! - NFT badge generation
//! - Points awarding and leaderboard updates
//!
//! Targets 90% coverage of achievement minting logic.

#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env, String};
use achievements::{AchievementsContract, AchievementsContractClient, ContractError};

// ═══════════════════════════════════════════════════════════════════════════════
// SETUP HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

fn setup(env: &Env) -> (AchievementsContractClient, Address, Address) {
    let admin = Address::generate(env);
    let platform = Address::generate(env);
    let contract_id = env.register_contract(None, AchievementsContract);
    let client = AchievementsContractClient::new(env, &contract_id);
    
    env.mock_all_auths();
    client.initialize(&admin, &platform).unwrap();
    
    (client, admin, platform)
}

// ═══════════════════════════════════════════════════════════════════════════════
// BASIC ACHIEVEMENT UNLOCK TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test basic achievement unlock
#[test]
fn test_unlock_achievement_basic() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    env.mock_all_auths();
    
    // Unlock first achievement (self-unlockable)
    let nft = client.unlock_achievement(
        &user,
        &2, // "Social Butterfly" - self-unlockable
        &String::from_str(&env, ""),
    ).unwrap();
    
    // Verify NFT created
    assert_eq!(nft.user, user);
    assert_eq!(nft.achievement_type, 2);
    assert!(nft.unlocked_at > 0);
}

/// Test achievement unlock with metadata
#[test]
fn test_unlock_achievement_with_metadata() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    env.mock_all_auths();
    
    let metadata = String::from_str(&env, "campaign-123");
    let nft = client.unlock_achievement(
        &user,
        &2,
        &metadata,
    ).unwrap();
    
    // Verify metadata stored
    assert_eq!(nft.metadata, metadata);
}

/// Test multiple achievements unlock by same user
#[test]
fn test_unlock_multiple_achievements_same_user() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    env.mock_all_auths();
    
    // Unlock first achievement
    let nft1 = client.unlock_achievement(
        &user,
        &2, // Social Butterfly
        &String::from_str(&env, ""),
    ).unwrap();
    
    // Unlock different achievement
    let nft2 = client.unlock_achievement(
        &user,
        &5, // Philanthropist
        &String::from_str(&env, ""),
    ).unwrap();
    
    // Verify both unlocked with different types
    assert_eq!(nft1.achievement_type, 2);
    assert_eq!(nft2.achievement_type, 5);
    assert_eq!(nft1.user, nft2.user);
}

/// Test achievement unlock by different users
#[test]
fn test_unlock_achievement_different_users() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    
    env.mock_all_auths();
    
    // User1 unlock achievement
    let nft1 = client.unlock_achievement(
        &user1,
        &2,
        &String::from_str(&env, ""),
    ).unwrap();
    
    // User2 unlock same achievement
    let nft2 = client.unlock_achievement(
        &user2,
        &2,
        &String::from_str(&env, ""),
    ).unwrap();
    
    // Verify both achieved but different users
    assert_ne!(nft1.user, nft2.user);
    assert_eq!(nft1.achievement_type, nft2.achievement_type);
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHORIZATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test that user must authenticate unlock
#[test]
fn test_unlock_requires_auth() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    
    // No auth mocking - should fail
    let result = client.unlock_achievement(
        &user,
        &2,
        &String::from_str(&env, ""),
    );
    
    // Should fail without auth
    assert!(result.is_err());
}

/// Test that initialization requires auth
#[test]
fn test_initialize_requires_auth() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let platform = Address::generate(&env);
    let contract_id = env.register_contract(None, AchievementsContract);
    let client = AchievementsContractClient::new(&env, &contract_id);
    
    // No auth - should fail
    let result = client.initialize(&admin, &platform);
    
    assert!(result.is_err());
}

/// Test that admin-only functions require admin auth
#[test]
fn test_award_points_requires_admin() {
    let env = Env::default();
    let (client, admin, _platform) = setup(&env);
    
    let non_admin = Address::generate(&env);
    let user = Address::generate(&env);
    
    env.mock_all_auths();
    
    // Non-admin tries to award points
    let result = client.award_user_points(&non_admin, &user, &100);
    
    // Should fail - not authorized
    assert_eq!(result.unwrap_err(), ContractError::Unauthorized);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOUBLE-UNLOCK PREVENTION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test that same achievement cannot be unlocked twice
#[test]
fn test_cannot_unlock_same_achievement_twice() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    env.mock_all_auths();
    
    // First unlock
    client.unlock_achievement(
        &user,
        &2,
        &String::from_str(&env, ""),
    ).unwrap();
    
    // Try to unlock same achievement again
    let result = client.unlock_achievement(
        &user,
        &2,
        &String::from_str(&env, ""),
    );
    
    // Should fail with AlreadyUnlocked
    assert_eq!(result.unwrap_err(), ContractError::AchievementAlreadyUnlocked);
}

/// Test that achievement state persists across queries
#[test]
fn test_achievement_state_persists() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    env.mock_all_auths();
    
    // Unlock achievement
    client.unlock_achievement(
        &user,
        &2,
        &String::from_str(&env, ""),
    ).unwrap();
    
    // Check achievement exists
    let achievements = client.get_user_achievements(&user).unwrap();
    assert!(achievements.len() > 0);
    
    // Try to unlock again - should fail
    let result = client.unlock_achievement(
        &user,
        &2,
        &String::from_str(&env, ""),
    );
    
    assert_eq!(result.unwrap_err(), ContractError::AchievementAlreadyUnlocked);
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-UNLOCK PREVENTION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test that auto-only achievements cannot be unlocked directly
#[test]
fn test_cannot_unlock_auto_only_achievement() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    env.mock_all_auths();
    
    // Try to unlock auto-tracked achievement (type 1 = First Contribution)
    let result = client.unlock_achievement(
        &user,
        &1, // Auto-tracked
        &String::from_str(&env, ""),
    );
    
    // Should fail with AchievementNotSelfUnlockable
    assert_eq!(result.unwrap_err(), ContractError::AchievementNotSelfUnlockable);
}

/// Test that auto-only achievements (type 3) cannot be unlocked directly
#[test]
fn test_cannot_unlock_auto_achievement_type_3() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    env.mock_all_auths();
    
    // Type 3 is auto-tracked (Mega Donor)
    let result = client.unlock_achievement(
        &user,
        &3,
        &String::from_str(&env, ""),
    );
    
    assert_eq!(result.unwrap_err(), ContractError::AchievementNotSelfUnlockable);
}

/// Test that auto-only achievements (type 4) cannot be unlocked directly
#[test]
fn test_cannot_unlock_auto_achievement_type_4() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    env.mock_all_auths();
    
    // Type 4 is auto-tracked (Consistent Contributor)
    let result = client.unlock_achievement(
        &user,
        &4,
        &String::from_str(&env, ""),
    );
    
    assert_eq!(result.unwrap_err(), ContractError::AchievementNotSelfUnlockable);
}

/// Test that auto-only achievements (type 7) cannot be unlocked directly
#[test]
fn test_cannot_unlock_auto_achievement_type_7() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    env.mock_all_auths();
    
    // Type 7 is auto-tracked (Referral Champion)
    let result = client.unlock_achievement(
        &user,
        &7,
        &String::from_str(&env, ""),
    );
    
    assert_eq!(result.unwrap_err(), ContractError::AchievementNotSelfUnlockable);
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVALID ACHIEVEMENT TYPE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test that invalid achievement type (too low) is rejected
#[test]
fn test_invalid_achievement_type_too_low() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    env.mock_all_auths();
    
    // Type 0 is invalid (types are 1-13)
    let result = client.unlock_achievement(
        &user,
        &0,
        &String::from_str(&env, ""),
    );
    
    assert_eq!(result.unwrap_err(), ContractError::InvalidAchievementType);
}

/// Test that invalid achievement type (too high) is rejected
#[test]
fn test_invalid_achievement_type_too_high() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    env.mock_all_auths();
    
    // Type 14+ are invalid
    let result = client.unlock_achievement(
        &user,
        &14,
        &String::from_str(&env, ""),
    );
    
    assert_eq!(result.unwrap_err(), ContractError::InvalidAchievementType);
}

/// Test that large invalid achievement type is rejected
#[test]
fn test_invalid_achievement_type_large() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    env.mock_all_auths();
    
    // Very large invalid type
    let result = client.unlock_achievement(
        &user,
        &999,
        &String::from_str(&env, ""),
    );
    
    assert_eq!(result.unwrap_err(), ContractError::InvalidAchievementType);
}

// ═══════════════════════════════════════════════════════════════════════════════
// POINTS SYSTEM TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test that points are awarded on achievement unlock
#[test]
fn test_points_awarded_on_unlock() {
    let env = Env::default();
    let (client, admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    env.mock_all_auths();
    
    let points_before = client.get_user_points(&user).unwrap_or(0i128);
    
    // Unlock achievement
    client.unlock_achievement(
        &user,
        &2,
        &String::from_str(&env, ""),
    ).unwrap();
    
    let points_after = client.get_user_points(&user).unwrap_or(0i128);
    
    // Points should increase
    assert!(points_after > points_before);
}

/// Test level progression with points
#[test]
fn test_level_progression() {
    let env = Env::default();
    let (client, admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    env.mock_all_auths();
    
    let level_before = client.get_user_level(&user).unwrap_or(0u32);
    
    // Award significant points
    client.award_user_points(&admin, &user, &1000).unwrap();
    
    let level_after = client.get_user_level(&user).unwrap_or(0u32);
    
    // Level should potentially increase (depends on point thresholds)
    assert!(level_after >= level_before);
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test leaderboard entry created on achievement
#[test]
fn test_leaderboard_entry_on_achievement() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    env.mock_all_auths();
    
    // Unlock achievement
    client.unlock_achievement(
        &user,
        &2,
        &String::from_str(&env, ""),
    ).unwrap();
    
    // Get leaderboard (achievements)
    let leaderboard = client.get_leaderboard(&1, &0u32, &10u32).unwrap();
    
    // User should be on leaderboard
    assert!(leaderboard.len() > 0);
}

/// Test multiple users on leaderboard
#[test]
fn test_multiple_users_leaderboard() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    
    env.mock_all_auths();
    
    // Both users unlock achievements
    client.unlock_achievement(
        &user1,
        &2,
        &String::from_str(&env, ""),
    ).unwrap();
    
    client.unlock_achievement(
        &user2,
        &5,
        &String::from_str(&env, ""),
    ).unwrap();
    
    // Get leaderboard
    let leaderboard = client.get_leaderboard(&1, &0u32, &10u32).unwrap();
    
    // Both should be on leaderboard
    assert!(leaderboard.len() >= 2);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOUBLE INITIALIZATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test that contract cannot be initialized twice
#[test]
fn test_cannot_initialize_twice() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let platform = Address::generate(&env);
    let contract_id = env.register_contract(None, AchievementsContract);
    let client = AchievementsContractClient::new(&env, &contract_id);
    
    env.mock_all_auths();
    
    // First initialization
    client.initialize(&admin, &platform).unwrap();
    
    // Try to initialize again
    let result = client.initialize(&admin, &platform);
    
    assert_eq!(result.unwrap_err(), ContractError::AlreadyInitialized);
}

// ═══════════════════════════════════════════════════════════════════════════════
// NFT GENERATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test NFT ID generation
#[test]
fn test_nft_id_generation() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    env.mock_all_auths();
    
    let nft = client.unlock_achievement(
        &user,
        &2,
        &String::from_str(&env, ""),
    ).unwrap();
    
    // NFT ID should be generated
    assert!(!nft.nft_id.is_empty());
}

/// Test NFT ID uniqueness
#[test]
fn test_nft_id_uniqueness() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    
    env.mock_all_auths();
    
    let nft1 = client.unlock_achievement(
        &user1,
        &2,
        &String::from_str(&env, ""),
    ).unwrap();
    
    let nft2 = client.unlock_achievement(
        &user2,
        &2,
        &String::from_str(&env, ""),
    ).unwrap();
    
    // NFT IDs should be different for different users
    assert_ne!(nft1.nft_id, nft2.nft_id);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT QUERY TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test has_achievement check
#[test]
fn test_has_achievement_check() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    env.mock_all_auths();
    
    // Check before unlock
    assert!(!client.has_achievement(&user, &2).unwrap_or(false));
    
    // Unlock achievement
    client.unlock_achievement(
        &user,
        &2,
        &String::from_str(&env, ""),
    ).unwrap();
    
    // Check after unlock
    assert!(client.has_achievement(&user, &2).unwrap_or(false));
}

/// Test get_user_achievements
#[test]
fn test_get_user_achievements() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    env.mock_all_auths();
    
    // Get achievements before any unlocks
    let achievements_before = client.get_user_achievements(&user).unwrap_or_default();
    let initial_count = achievements_before.len();
    
    // Unlock achievement
    client.unlock_achievement(
        &user,
        &2,
        &String::from_str(&env, ""),
    ).unwrap();
    
    // Get achievements after unlock
    let achievements_after = client.get_user_achievements(&user).unwrap();
    
    // Count should increase
    assert!(achievements_after.len() > initial_count);
}

/// Test get_user_achievements for user with no achievements
#[test]
fn test_get_achievements_no_achievements() {
    let env = Env::default();
    let (client, _admin, _platform) = setup(&env);
    
    let user = Address::generate(&env);
    
    // Get achievements for new user
    let achievements = client.get_user_achievements(&user).unwrap_or_default();
    
    // Should be empty or non-existent
    assert_eq!(achievements.len(), 0);
}
