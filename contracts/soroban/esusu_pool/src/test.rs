#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env, String,
};

// Helper: deploy a mock Stellar token and return its address + admin client
fn create_token(env: &Env, admin: &Address) -> (Address, token::StellarAssetClient<'_>) {
    let token_contract = env.register_stellar_asset_contract_v2(admin.clone());
    let token_addr = token_contract.address();
    let token_admin_client = token::StellarAssetClient::new(env, &token_addr);
    (token_addr, token_admin_client)
}

#[test]
fn test_initialize_and_join() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let member1 = Address::generate(&env);
    let member2 = Address::generate(&env);

    let (token_addr, token_admin) = create_token(&env, &admin);

    // Mint tokens to members so they can contribute
    token_admin.mint(&member1, &1_000_0000000i128);
    token_admin.mint(&member2, &1_000_0000000i128);

    let contract_id = env.register(EsusuPool, ());
    let client = EsusuPoolClient::new(&env, &contract_id);

    // Initialize a 2-member pool, 100 XLM contribution, 7-day cycles
    let contribution_amt: i128 = 100_0000000; // 100 XLM in stroops
    let cycle_duration: u64 = 7 * 24 * 60 * 60;

    client.initialize(
        &admin,
        &token_addr,
        &String::from_str(&env, "Test Circle"),
        &contribution_amt,
        &cycle_duration,
        &2u32,
    );

    assert_eq!(client.get_status(), PoolStatus::Open);
    assert_eq!(client.get_members().len(), 0);

    // First member joins — pool still Open
    client.join(&member1);
    assert_eq!(client.get_status(), PoolStatus::Open);
    assert_eq!(client.get_members().len(), 1);

    // Second member joins — pool auto-starts (Active)
    client.join(&member2);
    assert_eq!(client.get_status(), PoolStatus::Active);
    assert_eq!(client.get_members().len(), 2);
}

#[test]
fn test_double_join_reverts() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let member = Address::generate(&env);
    let (token_addr, _) = create_token(&env, &admin);

    let contract_id = env.register(EsusuPool, ());
    let client = EsusuPoolClient::new(&env, &contract_id);

    client.initialize(
        &admin,
        &token_addr,
        &String::from_str(&env, "Circle"),
        &10_0000000i128,
        &86400u64,
        &3u32,
    );

    client.join(&member);

    // Second join by same member must panic
    let result = std::panic::catch_unwind(|| {
        client.join(&member);
    });
    assert!(result.is_err());
}

#[test]
fn test_contribute_and_finalize_full_cycle() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let member1 = Address::generate(&env);
    let member2 = Address::generate(&env);

    let contribution_amt: i128 = 50_0000000; // 50 XLM

    let (token_addr, token_admin) = create_token(&env, &admin);
    token_admin.mint(&member1, &(contribution_amt * 4));
    token_admin.mint(&member2, &(contribution_amt * 4));

    let contract_id = env.register(EsusuPool, ());
    let client = EsusuPoolClient::new(&env, &contract_id);

    client.initialize(
        &admin,
        &token_addr,
        &String::from_str(&env, "Two-Member Circle"),
        &contribution_amt,
        &86400u64,
        &2u32,
    );

    client.join(&member1);
    client.join(&member2); // triggers Active

    // Round 0: both contribute, admin finalizes
    client.contribute(&member1);
    client.contribute(&member2);
    client.finalize_round(&admin); // member1 wins round 0

    assert_eq!(client.get_current_round(), 1);
    assert_eq!(client.get_status(), PoolStatus::Active);

    // Round 1: both contribute, admin finalizes
    client.contribute(&member1);
    client.contribute(&member2);
    client.finalize_round(&admin); // member2 wins round 1

    // All rounds complete — pool should be Completed
    assert_eq!(client.get_current_round(), 2);
    assert_eq!(client.get_status(), PoolStatus::Completed);
}

#[test]
fn test_cancel_pool() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (token_addr, _) = create_token(&env, &admin);

    let contract_id = env.register(EsusuPool, ());
    let client = EsusuPoolClient::new(&env, &contract_id);

    client.initialize(
        &admin,
        &token_addr,
        &String::from_str(&env, "Cancelled Circle"),
        &10_0000000i128,
        &86400u64,
        &3u32,
    );

    assert_eq!(client.get_status(), PoolStatus::Open);
    client.cancel_pool(&admin);
    assert_eq!(client.get_status(), PoolStatus::Cancelled);
}

#[test]
fn test_unauthorized_finalize_reverts() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let rando = Address::generate(&env);
    let (token_addr, _) = create_token(&env, &admin);

    let contract_id = env.register(EsusuPool, ());
    let client = EsusuPoolClient::new(&env, &contract_id);

    client.initialize(
        &admin,
        &token_addr,
        &String::from_str(&env, "Protected Circle"),
        &10_0000000i128,
        &86400u64,
        &2u32,
    );

    // Non-admin trying to finalize should fail
    let result = std::panic::catch_unwind(|| {
        client.finalize_round(&rando);
    });
    assert!(result.is_err());
}
