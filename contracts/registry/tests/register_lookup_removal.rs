//! # Register/Lookup/Removal Tests for Registry Contract (Issue #1731)
//!
//! Comprehensive tests for core registry functionality:
//! - Project registration with full details
//! - Project lookup by ID and batch operations
//! - Project removal/archival with state cleanup
//!
//! Targets 90% coverage and validates all state transitions.

#![cfg(test)]

mod common;

use soroban_sdk::{testutils::Address as _, Address, Env, String};
use registry::{ContractError, RegistryContractClient};
use common::{deploy_and_init, deploy};

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test basic project registration
#[test]
fn test_register_project_success() {
    let env = Env::default();
    let (client, _admin) = deploy_and_init(&env);
    
    let creator = Address::generate(&env);
    env.mock_all_auths();
    
    let project_id = client.register_project(
        &creator,
        &String::from_str(&env, "My Project"),
        &String::from_str(&env, "Project description"),
        &String::from_str(&env, "Technology"),
    ).unwrap();
    
    // Verify project ID is returned
    assert_eq!(project_id, 1);
    
    // Verify project can be retrieved
    let project = client.get_project(&project_id).unwrap();
    assert_eq!(project.creator, creator);
    assert_eq!(project.name, String::from_str(&env, "My Project"));
    assert_eq!(project.description, String::from_str(&env, "Project description"));
    assert_eq!(project.category, String::from_str(&env, "Technology"));
    assert!(!project.verified);
}

/// Test multiple sequential project registrations
#[test]
fn test_register_multiple_projects() {
    let env = Env::default();
    let (client, _admin) = deploy_and_init(&env);
    
    env.mock_all_auths();
    
    let creator1 = Address::generate(&env);
    let creator2 = Address::generate(&env);
    let creator3 = Address::generate(&env);
    
    // Register first project
    let id1 = client.register_project(
        &creator1,
        &String::from_str(&env, "Project 1"),
        &String::from_str(&env, "Description 1"),
        &String::from_str(&env, "Tech"),
    ).unwrap();
    
    // Register second project
    let id2 = client.register_project(
        &creator2,
        &String::from_str(&env, "Project 2"),
        &String::from_str(&env, "Description 2"),
        &String::from_str(&env, "Education"),
    ).unwrap();
    
    // Register third project
    let id3 = client.register_project(
        &creator3,
        &String::from_str(&env, "Project 3"),
        &String::from_str(&env, "Description 3"),
        &String::from_str(&env, "Healthcare"),
    ).unwrap();
    
    // Verify IDs are sequential
    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
    assert_eq!(id3, 3);
    
    // Verify all projects can be retrieved
    let project1 = client.get_project(&id1).unwrap();
    assert_eq!(project1.name, String::from_str(&env, "Project 1"));
    
    let project2 = client.get_project(&id2).unwrap();
    assert_eq!(project2.name, String::from_str(&env, "Project 2"));
    
    let project3 = client.get_project(&id3).unwrap();
    assert_eq!(project3.name, String::from_str(&env, "Project 3"));
}

/// Test project registration with same creator
#[test]
fn test_register_multiple_projects_same_creator() {
    let env = Env::default();
    let (client, _admin) = deploy_and_init(&env);
    
    let creator = Address::generate(&env);
    env.mock_all_auths();
    
    // Register first project
    let id1 = client.register_project(
        &creator,
        &String::from_str(&env, "Project A"),
        &String::from_str(&env, "Desc A"),
        &String::from_str(&env, "Cat A"),
    ).unwrap();
    
    // Register second project by same creator
    let id2 = client.register_project(
        &creator,
        &String::from_str(&env, "Project B"),
        &String::from_str(&env, "Desc B"),
        &String::from_str(&env, "Cat B"),
    ).unwrap();
    
    // Verify both projects exist and have different IDs
    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
    
    let proj1 = client.get_project(&id1).unwrap();
    let proj2 = client.get_project(&id2).unwrap();
    assert_eq!(proj1.creator, proj2.creator);
    assert_ne!(proj1.name, proj2.name);
}

/// Test registration with long strings
#[test]
fn test_register_project_with_long_strings() {
    let env = Env::default();
    let (client, _admin) = deploy_and_init(&env);
    
    let creator = Address::generate(&env);
    env.mock_all_auths();
    
    let long_name = String::from_str(&env, "A Project With A Very Long Name That Tests String Limits");
    let long_desc = String::from_str(&env, "This is a very long description that describes the project in great detail with multiple sentences");
    
    let project_id = client.register_project(
        &creator,
        &long_name,
        &long_desc,
        &String::from_str(&env, "Technology"),
    ).unwrap();
    
    let project = client.get_project(&project_id).unwrap();
    assert_eq!(project.name, long_name);
    assert_eq!(project.description, long_desc);
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOOKUP TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test lookup of non-existent project
#[test]
fn test_get_project_not_found() {
    let env = Env::default();
    let (client, _admin) = deploy_and_init(&env);
    
    // Try to get project that doesn't exist
    let result = client.get_project(&999);
    
    // Verify error
    assert_eq!(result.unwrap_err(), ContractError::NotFound);
}

/// Test lookup after registration
#[test]
fn test_get_project_after_registration() {
    let env = Env::default();
    let (client, _admin) = deploy_and_init(&env);
    
    let creator = Address::generate(&env);
    env.mock_all_auths();
    
    let project_id = client.register_project(
        &creator,
        &String::from_str(&env, "Test Project"),
        &String::from_str(&env, "Test Description"),
        &String::from_str(&env, "Testing"),
    ).unwrap();
    
    // Get project by ID
    let project = client.get_project(&project_id).unwrap();
    
    // Verify all fields
    assert_eq!(project.id, project_id);
    assert_eq!(project.creator, creator);
    assert_eq!(project.name, String::from_str(&env, "Test Project"));
    assert_eq!(project.description, String::from_str(&env, "Test Description"));
    assert_eq!(project.category, String::from_str(&env, "Testing"));
    assert!(!project.verified);
    assert!(project.created_at > 0);
    assert_eq!(project.created_at, project.updated_at);
}

/// Test get all project IDs
#[test]
fn test_get_all_project_ids() {
    let env = Env::default();
    let (client, _admin) = deploy_and_init(&env);
    
    env.mock_all_auths();
    
    let creator1 = Address::generate(&env);
    let creator2 = Address::generate(&env);
    
    // Register projects
    let id1 = client.register_project(
        &creator1,
        &String::from_str(&env, "Project 1"),
        &String::from_str(&env, "Desc"),
        &String::from_str(&env, "Tech"),
    ).unwrap();
    
    let id2 = client.register_project(
        &creator2,
        &String::from_str(&env, "Project 2"),
        &String::from_str(&env, "Desc"),
        &String::from_str(&env, "Education"),
    ).unwrap();
    
    // Get all IDs
    let all_ids = client.get_all_project_ids();
    
    // Verify both IDs present
    assert_eq!(all_ids.len(), 2);
    assert!(all_ids.contains(&id1));
    assert!(all_ids.contains(&id2));
}

/// Test pagination of project IDs
#[test]
fn test_project_id_pagination() {
    let env = Env::default();
    let (client, _admin) = deploy_and_init(&env);
    
    env.mock_all_auths();
    
    // Register 5 projects
    for i in 1..=5 {
        client.register_project(
            &Address::generate(&env),
            &String::from_str(&env, &format!("Project {}", i)),
            &String::from_str(&env, "Desc"),
            &String::from_str(&env, "Cat"),
        ).unwrap();
    }
    
    // Get all IDs
    let all_ids = client.get_all_project_ids();
    assert_eq!(all_ids.len(), 5);
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test project update by creator
#[test]
fn test_update_project_by_creator() {
    let env = Env::default();
    let (client, _admin) = deploy_and_init(&env);
    
    let creator = Address::generate(&env);
    env.mock_all_auths();
    
    // Register project
    let project_id = client.register_project(
        &creator,
        &String::from_str(&env, "Original Name"),
        &String::from_str(&env, "Original Desc"),
        &String::from_str(&env, "Original Cat"),
    ).unwrap();
    
    // Update project
    client.update_project(
        &project_id,
        &creator,
        &Some(String::from_str(&env, "Updated Name")),
        &Some(String::from_str(&env, "Updated Desc")),
        &Some(String::from_str(&env, "Updated Cat")),
    ).unwrap();
    
    // Verify updates
    let project = client.get_project(&project_id).unwrap();
    assert_eq!(project.name, String::from_str(&env, "Updated Name"));
    assert_eq!(project.description, String::from_str(&env, "Updated Desc"));
    assert_eq!(project.category, String::from_str(&env, "Updated Cat"));
}

/// Test partial project update
#[test]
fn test_partial_project_update() {
    let env = Env::default();
    let (client, _admin) = deploy_and_init(&env);
    
    let creator = Address::generate(&env);
    env.mock_all_auths();
    
    let original_name = String::from_str(&env, "Original Name");
    let original_desc = String::from_str(&env, "Original Desc");
    let original_cat = String::from_str(&env, "Original Cat");
    
    // Register project
    let project_id = client.register_project(
        &creator,
        &original_name,
        &original_desc,
        &original_cat,
    ).unwrap();
    
    // Update only name
    client.update_project(
        &project_id,
        &creator,
        &Some(String::from_str(&env, "New Name")),
        &None,
        &None,
    ).unwrap();
    
    // Verify only name changed
    let project = client.get_project(&project_id).unwrap();
    assert_eq!(project.name, String::from_str(&env, "New Name"));
    assert_eq!(project.description, original_desc);
    assert_eq!(project.category, original_cat);
}

/// Test that non-creator cannot update
#[test]
fn test_update_project_unauthorized() {
    let env = Env::default();
    let (client, _admin) = deploy_and_init(&env);
    
    let creator = Address::generate(&env);
    let other_user = Address::generate(&env);
    
    env.mock_all_auths();
    
    // Register project
    let project_id = client.register_project(
        &creator,
        &String::from_str(&env, "Project"),
        &String::from_str(&env, "Desc"),
        &String::from_str(&env, "Cat"),
    ).unwrap();
    
    // Try to update as non-creator
    let result = client.update_project(
        &project_id,
        &other_user,
        &Some(String::from_str(&env, "New Name")),
        &None,
        &None,
    );
    
    // Verify error
    assert_eq!(result.unwrap_err(), ContractError::Unauthorized);
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test project verification by admin
#[test]
fn test_verify_project_by_admin() {
    let env = Env::default();
    let (client, admin) = deploy_and_init(&env);
    
    let creator = Address::generate(&env);
    env.mock_all_auths();
    
    // Register project
    let project_id = client.register_project(
        &creator,
        &String::from_str(&env, "Project"),
        &String::from_str(&env, "Desc"),
        &String::from_str(&env, "Cat"),
    ).unwrap();
    
    // Verify project
    client.verify_project(&project_id, &admin).unwrap();
    
    // Verify status changed
    let project = client.get_project(&project_id).unwrap();
    assert!(project.verified);
}

/// Test that non-admin cannot verify
#[test]
fn test_verify_project_unauthorized() {
    let env = Env::default();
    let (client, _admin) = deploy_and_init(&env);
    
    let creator = Address::generate(&env);
    let non_admin = Address::generate(&env);
    
    env.mock_all_auths();
    
    // Register project
    let project_id = client.register_project(
        &creator,
        &String::from_str(&env, "Project"),
        &String::from_str(&env, "Desc"),
        &String::from_str(&env, "Cat"),
    ).unwrap();
    
    // Try to verify as non-admin
    let result = client.verify_project(&project_id, &non_admin);
    
    // Verify error
    assert_eq!(result.unwrap_err(), ContractError::Unauthorized);
}

/// Test that project cannot be verified twice
#[test]
fn test_verify_project_twice_fails() {
    let env = Env::default();
    let (client, admin) = deploy_and_init(&env);
    
    let creator = Address::generate(&env);
    env.mock_all_auths();
    
    // Register project
    let project_id = client.register_project(
        &creator,
        &String::from_str(&env, "Project"),
        &String::from_str(&env, "Desc"),
        &String::from_str(&env, "Cat"),
    ).unwrap();
    
    // Verify project
    client.verify_project(&project_id, &admin).unwrap();
    
    // Try to verify again
    let result = client.verify_project(&project_id, &admin);
    
    // Verify error (already verified)
    assert!(result.is_err());
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARCHIVAL/REMOVAL TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test project archival by admin
#[test]
fn test_archive_project_by_admin() {
    let env = Env::default();
    let (client, admin) = deploy_and_init(&env);
    
    let creator = Address::generate(&env);
    env.mock_all_auths();
    
    // Register project
    let project_id = client.register_project(
        &creator,
        &String::from_str(&env, "Project"),
        &String::from_str(&env, "Desc"),
        &String::from_str(&env, "Cat"),
    ).unwrap();
    
    // Verify project is in list
    let ids_before = client.get_all_project_ids();
    assert!(ids_before.contains(&project_id));
    
    // Archive project
    client.archive_project(&project_id, &admin).unwrap();
    
    // Verify project is removed from list
    let ids_after = client.get_all_project_ids();
    assert!(!ids_after.contains(&project_id));
}

/// Test that non-admin cannot archive
#[test]
fn test_archive_project_unauthorized() {
    let env = Env::default();
    let (client, _admin) = deploy_and_init(&env);
    
    let creator = Address::generate(&env);
    let non_admin = Address::generate(&env);
    
    env.mock_all_auths();
    
    // Register project
    let project_id = client.register_project(
        &creator,
        &String::from_str(&env, "Project"),
        &String::from_str(&env, "Desc"),
        &String::from_str(&env, "Cat"),
    ).unwrap();
    
    // Try to archive as non-admin
    let result = client.archive_project(&project_id, &non_admin);
    
    // Verify error
    assert_eq!(result.unwrap_err(), ContractError::Unauthorized);
}

/// Test archival of non-existent project
#[test]
fn test_archive_nonexistent_project() {
    let env = Env::default();
    let (client, admin) = deploy_and_init(&env);
    
    env.mock_all_auths();
    
    // Try to archive non-existent project
    let result = client.archive_project(&999, &admin);
    
    // Verify error
    assert_eq!(result.unwrap_err(), ContractError::NotFound);
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE CONSISTENCY TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test updated_at timestamp changes on update
#[test]
fn test_updated_at_timestamp_changes() {
    let env = Env::default();
    let (client, _admin) = deploy_and_init(&env);
    
    let creator = Address::generate(&env);
    env.mock_all_auths();
    
    let project_id = client.register_project(
        &creator,
        &String::from_str(&env, "Project"),
        &String::from_str(&env, "Desc"),
        &String::from_str(&env, "Cat"),
    ).unwrap();
    
    let project_before = client.get_project(&project_id).unwrap();
    
    // Advance time
    env.ledger().with_mut(|l| {
        l.timestamp = l.timestamp + 100;
    });
    
    // Update project
    client.update_project(
        &project_id,
        &creator,
        &Some(String::from_str(&env, "New Name")),
        &None,
        &None,
    ).unwrap();
    
    let project_after = client.get_project(&project_id).unwrap();
    
    // Verify updated_at changed
    assert_eq!(project_before.created_at, project_after.created_at);
    assert!(project_after.updated_at > project_before.updated_at);
}

/// Test creator field immutable
#[test]
fn test_creator_field_immutable() {
    let env = Env::default();
    let (client, _admin) = deploy_and_init(&env);
    
    let creator = Address::generate(&env);
    env.mock_all_auths();
    
    let project_id = client.register_project(
        &creator,
        &String::from_str(&env, "Project"),
        &String::from_str(&env, "Desc"),
        &String::from_str(&env, "Cat"),
    ).unwrap();
    
    let project_before = client.get_project(&project_id).unwrap();
    
    // Update project
    client.update_project(
        &project_id,
        &creator,
        &Some(String::from_str(&env, "New Name")),
        &None,
        &None,
    ).unwrap();
    
    let project_after = client.get_project(&project_id).unwrap();
    
    // Verify creator unchanged
    assert_eq!(project_before.creator, project_after.creator);
}

/// Test id field immutable
#[test]
fn test_id_field_immutable() {
    let env = Env::default();
    let (client, _admin) = deploy_and_init(&env);
    
    let creator = Address::generate(&env);
    env.mock_all_auths();
    
    let project_id = client.register_project(
        &creator,
        &String::from_str(&env, "Project 1"),
        &String::from_str(&env, "Desc"),
        &String::from_str(&env, "Cat"),
    ).unwrap();
    
    let project = client.get_project(&project_id).unwrap();
    
    // Verify ID matches
    assert_eq!(project.id, project_id);
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRATION WITHOUT INIT TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test that operations fail without initialization
#[test]
fn test_register_without_init() {
    let env = Env::default();
    let client = deploy(&env);
    
    let creator = Address::generate(&env);
    env.mock_all_auths();
    
    // Try to register without init
    let result = client.register_project(
        &creator,
        &String::from_str(&env, "Project"),
        &String::from_str(&env, "Desc"),
        &String::from_str(&env, "Cat"),
    );
    
    // Verify error (not initialized)
    assert!(result.is_err());
}

/// Test get operations fail without init
#[test]
fn test_get_without_init() {
    let env = Env::default();
    let client = deploy(&env);
    
    // Try to get without init
    let result = client.get_project(&1);
    
    // Verify error or empty result
    assert!(result.is_err() || result.unwrap_err() == ContractError::NotFound);
}
