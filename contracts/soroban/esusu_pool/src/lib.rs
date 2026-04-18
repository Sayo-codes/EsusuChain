#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, Map, Symbol, Vec, token,
    panic_with_error,
};

// ─── Errors ──────────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq)]
#[repr(u32)]
pub enum EsusuError {
    AlreadyMember      = 1,
    PoolFull           = 2,
    PoolNotOpen        = 3,
    PoolNotActive      = 4,
    NotMember          = 5,
    AlreadyContributed = 6,
    NothingToWithdraw  = 7,
    Unauthorized       = 8,
    RoundNotOver       = 9,
    PoolAlreadyCancelled = 10,
}

// ─── Pool Status ──────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum PoolStatus {
    Open      = 0,
    Active    = 1,
    Completed = 2,
    Cancelled = 3,
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const ADMIN:               Symbol = symbol_short!("ADMIN");
const STATUS:              Symbol = symbol_short!("STATUS");
const NAME:                Symbol = symbol_short!("NAME");
const CONTRIB_AMT:         Symbol = symbol_short!("CONTRIB");
const CYCLE_DURATION:      Symbol = symbol_short!("CYCLE");
const MAX_MEMBERS:         Symbol = symbol_short!("MAXMEM");
const CURRENT_ROUND:       Symbol = symbol_short!("ROUND");
const ROUND_START:         Symbol = symbol_short!("RSTART");
const MEMBERS:             Symbol = symbol_short!("MEMBERS");
const TOKEN:               Symbol = symbol_short!("TOKEN");

// ─── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct EsusuPool;

#[contractimpl]
impl EsusuPool {
    /// Initialize a new savings pool.
    ///
    /// # Arguments
    /// - `admin`           — The pool creator/admin address
    /// - `token`           — Stellar asset contract address (SAC) used for contributions
    /// - `name`            — Human-readable name for the savings circle
    /// - `contribution_amt`— Amount each member contributes per round (in stroops)
    /// - `cycle_duration`  — Duration of each round in seconds
    /// - `max_members`     — Maximum number of members allowed
    pub fn initialize(
        env: Env,
        admin: Address,
        token: Address,
        name: soroban_sdk::String,
        contribution_amt: i128,
        cycle_duration: u64,
        max_members: u32,
    ) {
        admin.require_auth();

        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&TOKEN, &token);
        env.storage().instance().set(&NAME, &name);
        env.storage().instance().set(&CONTRIB_AMT, &contribution_amt);
        env.storage().instance().set(&CYCLE_DURATION, &cycle_duration);
        env.storage().instance().set(&MAX_MEMBERS, &max_members);
        env.storage().instance().set(&STATUS, &PoolStatus::Open);
        env.storage().instance().set(&CURRENT_ROUND, &0u32);

        let members: Vec<Address> = Vec::new(&env);
        env.storage().instance().set(&MEMBERS, &members);

        env.events().publish(
            (symbol_short!("init"), symbol_short!("pool")),
            (admin, name, contribution_amt, max_members),
        );
    }

    // ── Read helpers ─────────────────────────────────────────────────────────

    pub fn get_status(env: Env) -> PoolStatus {
        env.storage().instance().get(&STATUS).unwrap()
    }

    pub fn get_members(env: Env) -> Vec<Address> {
        env.storage().instance().get(&MEMBERS).unwrap_or(Vec::new(&env))
    }

    pub fn get_current_round(env: Env) -> u32 {
        env.storage().instance().get(&CURRENT_ROUND).unwrap_or(0)
    }

    pub fn get_contribution_amount(env: Env) -> i128 {
        env.storage().instance().get(&CONTRIB_AMT).unwrap()
    }

    pub fn get_max_members(env: Env) -> u32 {
        env.storage().instance().get(&MAX_MEMBERS).unwrap()
    }

    // ── Actions ──────────────────────────────────────────────────────────────

    /// Join the savings pool (only while Open).
    pub fn join(env: Env, member: Address) {
        member.require_auth();

        let status: PoolStatus = env.storage().instance().get(&STATUS).unwrap();
        if status != PoolStatus::Open {
            panic_with_error!(&env, EsusuError::PoolNotOpen);
        }

        let max_members: u32 = env.storage().instance().get(&MAX_MEMBERS).unwrap();
        let mut members: Vec<Address> = env.storage().instance().get(&MEMBERS).unwrap_or(Vec::new(&env));

        if members.contains(&member) {
            panic_with_error!(&env, EsusuError::AlreadyMember);
        }
        if members.len() >= max_members {
            panic_with_error!(&env, EsusuError::PoolFull);
        }

        members.push_back(member.clone());
        env.storage().instance().set(&MEMBERS, &members);

        // Auto-start when pool is full
        if members.len() == max_members {
            env.storage().instance().set(&STATUS, &PoolStatus::Active);
            let start_time = env.ledger().timestamp();
            env.storage().instance().set(&ROUND_START, &start_time);
            env.events().publish(
                (symbol_short!("pool"), symbol_short!("started")),
                (start_time,),
            );
        }

        env.events().publish(
            (symbol_short!("member"), symbol_short!("joined")),
            (member, members.len()),
        );
    }

    /// Contribute the required amount for the current round.
    /// Transfers tokens from caller to the contract.
    pub fn contribute(env: Env, member: Address) {
        member.require_auth();

        let status: PoolStatus = env.storage().instance().get(&STATUS).unwrap();
        if status != PoolStatus::Active {
            panic_with_error!(&env, EsusuError::PoolNotActive);
        }

        let members: Vec<Address> = env.storage().instance().get(&MEMBERS).unwrap_or(Vec::new(&env));
        if !members.contains(&member) {
            panic_with_error!(&env, EsusuError::NotMember);
        }

        let contribution_amt: i128 = env.storage().instance().get(&CONTRIB_AMT).unwrap();
        let token_addr: Address = env.storage().instance().get(&TOKEN).unwrap();
        let token_client = token::Client::new(&env, &token_addr);

        // Transfer contribution from member to contract
        token_client.transfer(&member, &env.current_contract_address(), &contribution_amt);

        let round: u32 = env.storage().instance().get(&CURRENT_ROUND).unwrap_or(0);
        env.events().publish(
            (symbol_short!("contributed"),),
            (member, round, contribution_amt),
        );
    }

    /// Finalize the current round and pay out the winner.
    /// Admin only. Called after all members have contributed.
    pub fn finalize_round(env: Env, caller: Address) {
        caller.require_auth();

        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        if caller != admin {
            panic_with_error!(&env, EsusuError::Unauthorized);
        }

        let status: PoolStatus = env.storage().instance().get(&STATUS).unwrap();
        if status != PoolStatus::Active {
            panic_with_error!(&env, EsusuError::PoolNotActive);
        }

        let members: Vec<Address> = env.storage().instance().get(&MEMBERS).unwrap_or(Vec::new(&env));
        let current_round: u32 = env.storage().instance().get(&CURRENT_ROUND).unwrap_or(0);
        let max_members: u32 = env.storage().instance().get(&MAX_MEMBERS).unwrap();

        // Winner = member at index of current_round (deterministic rotation)
        let winner_idx = (current_round as u32) % members.len();
        let winner = members.get(winner_idx).unwrap();

        let contribution_amt: i128 = env.storage().instance().get(&CONTRIB_AMT).unwrap();
        let pot = contribution_amt * (members.len() as i128);

        let token_addr: Address = env.storage().instance().get(&TOKEN).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &winner, &pot);

        let next_round = current_round + 1;
        env.storage().instance().set(&CURRENT_ROUND, &next_round);

        env.events().publish(
            (symbol_short!("round"), symbol_short!("done")),
            (current_round, winner.clone(), pot),
        );

        // Mark pool completed when all rounds done
        if next_round >= max_members {
            env.storage().instance().set(&STATUS, &PoolStatus::Completed);
            env.events().publish(
                (symbol_short!("pool"), symbol_short!("done")),
                (next_round,),
            );
        } else {
            // Start next round
            let start_time = env.ledger().timestamp();
            env.storage().instance().set(&ROUND_START, &start_time);
        }
    }

    /// Emergency cancel — admin refunds remaining contract balance equally.
    pub fn cancel_pool(env: Env, caller: Address) {
        caller.require_auth();

        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        if caller != admin {
            panic_with_error!(&env, EsusuError::Unauthorized);
        }

        let status: PoolStatus = env.storage().instance().get(&STATUS).unwrap();
        if status == PoolStatus::Cancelled {
            panic_with_error!(&env, EsusuError::PoolAlreadyCancelled);
        }

        env.storage().instance().set(&STATUS, &PoolStatus::Cancelled);
        env.events().publish(
            (symbol_short!("pool"), symbol_short!("cancel")),
            (caller,),
        );
    }
}
